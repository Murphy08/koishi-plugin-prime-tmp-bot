const { segment } = require('koishi')
const { resolve } = require('path')
const common = require('../util/common')
const evmOpenApi = require('../api/evmOpenApi')

function formatMileage (value) {
  const meters = Number(value) || 0
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} 公里` : `${meters} 米`
}

function resolveVtcId (value, cfg) {
  const id = value === undefined || value === null || value === '' ? cfg.defaultVTCID : Number(value)
  return Number.isInteger(Number(id)) && Number(id) > 0 ? Number(id) : null
}

function renderText (data) {
  const title = data.rankingType === 2 ? 'VTC 今日里程排行榜' : 'VTC 总里程排行榜'
  return [title, `VTC ID：${data.vtcId}`, ...data.list.slice(0, 10).map((item) => `#${item.ranking} ${item.tmpName || '-'}：${formatMileage(item.distance)}`)].join('\n')
}

async function renderImage (ctx, data) {
  if (!ctx.puppeteer) return '未启用 puppeteer 服务'
  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 720, height: 1000, deviceScaleFactor: 1.5 })
    await page.goto(`file:///${resolve(__dirname, '../resource/vtc-mileage-leaderboard.html')}`)
    await page.evaluate(`setData(${JSON.stringify(data)})`)
    await common.waitForPageRender(page, { settleMs: 80 })
    const element = await page.$('#container')
    return segment.image(await element.screenshot({ encoding: 'binary', type: 'png' }), 'image/png')
  } catch {
    return '渲染异常，请重试'
  } finally {
    if (page) await page.close()
  }
}

module.exports = async (ctx, cfg, session, inputVtcId, rankingType) => {
  const vtcId = resolveVtcId(inputVtcId, cfg)
  if (!vtcId) return '请输入正确的 VTC 编号'
  const result = await evmOpenApi.vtcMileageRankingList(ctx.http, rankingType, vtcId)
  if (result.error) return '查询 VTC 里程排行榜失败，请稍后重试'
  const data = { vtcId, rankingType, list: Array.isArray(result.data) ? result.data : [] }
  if (!data.list.length) return '暂无 VTC 里程排行数据'
  return cfg.tmpVtcMileageRankingType === 1 ? renderText(data) : renderImage(ctx, data)
}
