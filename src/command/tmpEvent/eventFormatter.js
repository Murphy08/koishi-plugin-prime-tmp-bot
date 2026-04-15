const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const { marked } = require('marked')

dayjs.extend(utc)
dayjs.extend(timezone)

const TMP_BASE_URL = 'https://truckersmp.com'
const DLC_IMAGE_PREFIX = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps'
const BEIJING_TZ = 'Asia/Shanghai'

const renderer = new marked.Renderer()
renderer.html = (html) => {
  if (!html) {
    return ''
  }

  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function resolveLink (url) {
  if (!url) {
    return ''
  }

  if (url.startsWith('//')) {
    return `https:${url}`
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (url.startsWith('/')) {
    return `${TMP_BASE_URL}${url}`
  }

  return ''
}

function resolveMedia (url) {
  if (!url) {
    return ''
  }

  if (/^data:image\//i.test(url)) {
    return url
  }

  return resolveLink(url)
}

function sanitizeRichText (html) {
  if (!html) {
    return ''
  }

  return html
    .replace(/href="([^"]*)"/gi, (_, href) => {
      const safe = resolveLink(href)
      return safe
        ? `href="${safe}" target="_blank" rel="noreferrer noopener"`
        : 'href="#"'
    })
    .replace(/src="([^"]*)"/gi, (_, src) => {
      const safe = resolveMedia(src)
      return `src="${safe || ''}"`
    })
}

function markdownToHtml (markdown) {
  if (!markdown) {
    return ''
  }

  const html = marked.parse(markdown, {
    gfm: true,
    breaks: true,
    renderer
  })
  return sanitizeRichText(html)
}

function htmlToPlain (html) {
  if (!html) {
    return ''
  }

  return html
    .replace(/<\s*\/(h\d|p|div|section|article|blockquote)>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '\n[引用]\n')
    .replace(/<\s*\/li>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, '\'')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function markdownToPlain (markdown) {
  if (!markdown) {
    return ''
  }

  return htmlToPlain(markdownToHtml(markdown))
}

function formatTime (value) {
  if (!value) {
    return {
      utcText: '-',
      beijingText: '-',
      timestamp: null
    }
  }

  const utcTime = dayjs.utc(value)
  if (!utcTime.isValid()) {
    return {
      utcText: value,
      beijingText: value,
      timestamp: null
    }
  }

  return {
    utcText: `${utcTime.format('YYYY-MM-DD HH:mm:ss')} UTC`,
    beijingText: `${utcTime.tz(BEIJING_TZ).format('YYYY-MM-DD HH:mm:ss')} 北京时间`,
    timestamp: utcTime.valueOf()
  }
}

function normalizeDlcs (dlcs) {
  if (!dlcs) {
    return []
  }

  if (Array.isArray(dlcs)) {
    return dlcs
      .map((item) => {
        const id = item.id || item.appid || item.appId || item.key || ''
        return {
          id: String(id),
          name: item.name || '',
          image: id ? `${DLC_IMAGE_PREFIX}/${id}/header.jpg` : ''
        }
      })
      .filter((item) => item.id && item.name)
  }

  if (typeof dlcs === 'object') {
    return Object.entries(dlcs).map(([id, name]) => ({
      id,
      name,
      image: `${DLC_IMAGE_PREFIX}/${id}/header.jpg`
    }))
  }

  return []
}

function buildLocationText (city, location) {
  if (city && city !== '-' && location && location !== '-') {
    return `${city} · ${location}`
  }

  if (city && city !== '-') {
    return city
  }

  if (location && location !== '-') {
    return location
  }

  return '-'
}

function normalizeEvent (raw) {
  const meetup = formatTime(raw?.meetup_at)
  const start = formatTime(raw?.start_at)
  const descriptionHtml = markdownToHtml(raw?.description)
  const ruleHtml = markdownToHtml(raw?.rule)

  return {
    id: raw?.id || null,
    eventType: raw?.event_type?.name || '-',
    eventTypeKey: raw?.event_type?.key || '',
    name: raw?.name || '-',
    slug: raw?.slug || '',
    url: raw?.url
      ? (raw.url.startsWith('http') ? raw.url : `${TMP_BASE_URL}${raw.url}`)
      : raw?.slug
        ? `${TMP_BASE_URL}/events/${raw.slug}`
        : raw?.id
          ? `${TMP_BASE_URL}/events/${raw.id}`
          : TMP_BASE_URL,
    game: raw?.game || '-',
    serverName: raw?.server?.name || '-',
    serverId: raw?.server?.id || null,
    language: raw?.language || '-',
    departureLocation: raw?.departure?.location || '-',
    departureCity: raw?.departure?.city || '-',
    departureText: buildLocationText(raw?.departure?.city || '-', raw?.departure?.location || '-'),
    arriveLocation: raw?.arrive?.location || '-',
    arriveCity: raw?.arrive?.city || '-',
    arriveText: buildLocationText(raw?.arrive?.city || '-', raw?.arrive?.location || '-'),
    meetupUtc: meetup.utcText,
    meetupBeijing: meetup.beijingText,
    meetupTimestamp: meetup.timestamp,
    startUtc: start.utcText,
    startBeijing: start.beijingText,
    startTimestamp: start.timestamp,
    banner: raw?.banner || '',
    map: raw?.map || '',
    descriptionMarkdown: raw?.description || '',
    descriptionHtml,
    descriptionPlain: markdownToPlain(raw?.description),
    ruleMarkdown: raw?.rule || '',
    ruleHtml,
    rulePlain: markdownToPlain(raw?.rule),
    vtcId: raw?.vtc?.id || null,
    vtcName: raw?.vtc?.name || '-',
    dlcs: normalizeDlcs(raw?.dlcs),
    voiceLink: raw?.voice_link || '',
    externalLink: raw?.external_link || '',
    featured: raw?.featured || '',
    attendances: {
      confirmed: raw?.attendances?.confirmed ?? '-',
      unsure: raw?.attendances?.unsure ?? '-',
      vtcs: raw?.attendances?.vtcs ?? '-'
    },
    createdAt: raw?.created_at || '',
    updatedAt: raw?.updated_at || '',
    user: raw?.user || null
  }
}

function normalizeEventList (list) {
  if (!Array.isArray(list)) {
    return []
  }

  return list.map(normalizeEvent)
}

module.exports = {
  buildLocationText,
  normalizeEvent,
  normalizeEventList
}
