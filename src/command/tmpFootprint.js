const { segment, Logger } = require('koishi')
const dayjs = require('dayjs')
const { resolve } = require('path')
const { pathToFileURL } = require('url')
const common = require('../util/common')
const { PromodsIds, ServerType } = require('../util/constant')
const evmOpenApi = require('../api/evmOpenApi')
const tmpIdResolver = require('../util/tmpIdResolver')

function formatMileage (mileage) {
  const meters = Number(mileage) || 0
  return `${(meters / 1000).toFixed(1)} km`
}

async function loadFootprintData (ctx, session, serverType, inputTmpId) {
  const resolved = await tmpIdResolver.resolveQueryTmpId(ctx, session, inputTmpId)
  if (resolved.error) {
    return {
      error: resolved.error
    }
  }

  const tmpId = resolved.tmpId
  if (tmpId && isNaN(tmpId)) {
    return {
      error: '请输入正确的玩家编号，或绑定玩家编号'
    }
  }

  const playerInfo = await evmOpenApi.playerInfo(ctx.http, tmpId)
  if (playerInfo.error && playerInfo.code === 10001) {
    return {
      error: '玩家不存在'
    }
  } else if (playerInfo.error) {
    return {
      error: '查询玩家信息失败，请重试'
    }
  }

  const startTime = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
  const endTime = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  const mapPlayerHistory = await evmOpenApi.mapPlayerHistory(ctx.http, tmpId, null, startTime, endTime)
  if (mapPlayerHistory.error) {
    return {
      error: '查询玩家历史位置数据失败，请稍后重试'
    }
  }

  const promodsIdSet = new Set(PromodsIds)
  const points = (mapPlayerHistory.data || []).filter((item) => {
    if (ServerType.ets === serverType) {
      return !promodsIdSet.has(item.serverId)
    } else if (ServerType.promods === serverType) {
      return promodsIdSet.has(item.serverId)
    }
    return false
  })

  if (points.length === 0) {
    return {
      error: '当日暂无数据'
    }
  }

  return {
    data: {
      mapType: ServerType.promods === serverType ? 'promods' : 'ets',
      name: playerInfo.data.name,
      smallAvatarUrl: playerInfo.data.smallAvatarUrl,
      todayMileage: playerInfo.data.todayMileage,
      points
    }
  }
}

function renderText (data) {
  const first = data.points[0]
  const last = data.points[data.points.length - 1]
  const lines = [
    `${data.name} 的今日足迹`,
    `地图: ${data.mapType === 'promods' ? 'ProMods' : 'ETS2'}`,
    `今日里程: ${formatMileage(data.todayMileage)}`,
    `轨迹点: ${data.points.length}`
  ]

  if (first?.updateTime && last?.updateTime) {
    lines.push(`时间范围: ${first.updateTime} - ${last.updateTime}`)
  }

  return lines.join('\n')
}

async function renderImage (ctx, data) {
  const logger = new Logger('footprint')
  if (!ctx.puppeteer) {
    return '未启用 puppeteer 服务'
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    page.on('pageerror', (error) => logger.warn(error))
    page.on('requestfailed', (request) => {
      logger.warn(`request failed: ${request.url()} ${request.failure()?.errorText || ''}`.trim())
    })

    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 1.5 })
    await page.goto(pathToFileURL(resolve(__dirname, '../resource/footprint.html')).href)
    await page.evaluate(`init(${JSON.stringify(data)})`)
    await common.waitForPageRender(page, {
      readyFlag: '__footprintReady',
      timeoutMs: 15000,
      settleMs: 100,
      allowReadyTimeout: true,
      onReadyTimeout: async (error) => {
        logger.warn(`footprint ready timeout, fallback to screenshot: ${error.message}`)
      }
    })
    const element = await page.$('#container')
    return segment.image(
      await element.screenshot({
        encoding: 'binary',
        type: 'png'
      }),
      'image/png'
    )
  } catch (e) {
    logger.info(e)
    return '渲染异常，请重试'
  } finally {
    if (page) {
      await page.close()
    }
  }
}

module.exports = async (ctx, cfg, session, serverType, tmpId) => {
  const result = await loadFootprintData(ctx, session, serverType, tmpId)
  if (result.error) {
    return result.error
  }

  switch (cfg.tmpFootprintType) {
    case 1:
      return renderText(result.data)
    case 2:
      return await renderImage(ctx, result.data)
    default:
      return '指令配置错误'
  }
}
