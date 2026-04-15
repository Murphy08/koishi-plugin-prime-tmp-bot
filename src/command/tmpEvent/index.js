const truckersMPEventApi = require('../../api/truckersMPEventApi')
const { normalizeEvent, normalizeEventList } = require('./eventFormatter')
const renderText = require('./renderText')
const renderImage = require('./renderImage')

const MAX_RECENT_COUNT = 10

async function sendEventMessages (ctx, cfg, session, events) {
  if (!events.length) {
    return '没有符合条件的活动'
  }

  if (!session) {
    return '当前环境不支持发送多条消息'
  }

  switch (cfg.tmpeventType) {
    case 1: {
      for (const event of events) {
        await session.send(renderText(event))
      }
      return
    }
    case 2: {
      for (const event of events) {
        const image = await renderImage(ctx, event)
        if (typeof image === 'string') {
          return image
        }
        await session.send(image)
      }
      return
    }
    default:
      return '活动展示方式配置错误'
  }
}

function deduplicateEvents (events) {
  const map = new Map()

  for (const event of events) {
    if (!event?.id) {
      continue
    }

    map.set(event.id, event)
  }

  return Array.from(map.values())
}

function pickRecentEvents (events, count) {
  const now = Date.now()
  const withTime = events.filter((event) => event.startTimestamp)
  const withoutTime = events.filter((event) => !event.startTimestamp)

  withTime.sort((a, b) => {
    const aUpcoming = a.startTimestamp >= now
    const bUpcoming = b.startTimestamp >= now

    if (aUpcoming !== bUpcoming) {
      return aUpcoming ? -1 : 1
    }

    return aUpcoming
      ? a.startTimestamp - b.startTimestamp
      : b.startTimestamp - a.startTimestamp
  })

  return withTime.concat(withoutTime).slice(0, count)
}

function parsePositiveInt (value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 1) {
    return null
  }

  return Math.min(parsed, MAX_RECENT_COUNT)
}

function resolveVtcId (value, cfg) {
  const target = value === undefined || value === null || value === ''
    ? cfg.defaultVTCID
    : value

  const parsed = Number(target)
  if (Number.isNaN(parsed) || parsed < 1) {
    return null
  }

  return parsed
}

async function loadEventById (ctx, eventId) {
  const result = await truckersMPEventApi.eventById(ctx.http, eventId)
  if (result.error) {
    return {
      error: '活动查询失败，请稍后再试'
    }
  }

  const rawEvent = Array.isArray(result.data) ? result.data[0] : result.data
  if (!rawEvent) {
    return {
      error: '没有找到该活动'
    }
  }

  return {
    data: [normalizeEvent(rawEvent)]
  }
}

async function loadVtcRecentEvents (ctx, vtcId, count) {
  const [createdResult, attendingResult] = await Promise.all([
    truckersMPEventApi.vtcEvents(ctx.http, vtcId),
    truckersMPEventApi.vtcEventsAttending(ctx.http, vtcId)
  ])

  if (createdResult.error && attendingResult.error) {
    return {
      error: '查询 VTC 相关活动失败，请稍后再试'
    }
  }

  const createdList = createdResult.error ? [] : normalizeEventList(createdResult.data)
  const attendingList = attendingResult.error ? [] : normalizeEventList(attendingResult.data)
  const recentEvents = pickRecentEvents(
    deduplicateEvents(createdList.concat(attendingList)),
    count
  )

  if (!recentEvents.length) {
    return {
      error: '没有查询到匹配的活动'
    }
  }

  return {
    data: recentEvents
  }
}

module.exports = async (ctx, cfg, session, action, ...args) => {
  switch (action) {
    case 'eventById': {
      const [eventId] = args
      if (!eventId || Number.isNaN(Number(eventId))) {
        return '请输入正确的活动 ID'
      }

      const result = await loadEventById(ctx, eventId)
      if (result.error) {
        return result.error
      }

      return await sendEventMessages(ctx, cfg, session, result.data)
    }

    case 'defaultVtcRecent': {
      const [countInput] = args
      const vtcId = resolveVtcId(null, cfg)
      if (!vtcId) {
        return '请先在配置中设置默认 VTC ID'
      }

      const count = parsePositiveInt(countInput, 1)
      if (!count) {
        return `请输入正确的数量，范围为 1-${MAX_RECENT_COUNT}`
      }

      const result = await loadVtcRecentEvents(ctx, vtcId, count)
      if (result.error) {
        return result.error
      }

      return await sendEventMessages(ctx, cfg, session, result.data)
    }

    case 'vtcRecent': {
      const [vtcIdInput, countInput] = args
      const vtcId = resolveVtcId(vtcIdInput, cfg)
      if (!vtcId) {
        return '请输入正确的 VTC ID'
      }

      const count = parsePositiveInt(countInput, 1)
      if (!count) {
        return `请输入正确的数量，范围为 1-${MAX_RECENT_COUNT}`
      }

      const result = await loadVtcRecentEvents(ctx, vtcId, count)
      if (result.error) {
        return result.error
      }

      return await sendEventMessages(ctx, cfg, session, result.data)
    }

    default:
      return '活动指令配置错误'
  }
}
