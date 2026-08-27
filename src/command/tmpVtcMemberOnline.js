const { segment } = require('koishi')
const { resolve } = require('path')
const common = require('../util/common')
const evmOpenApi = require('../api/evmOpenApi')

function resolveVtcId (value, cfg) {
  const id = value === undefined || value === null || value === '' ? cfg.defaultVTCID : Number(value)
  return Number.isInteger(Number(id)) && Number(id) > 0 ? Number(id) : null
}

function renderText (data) {
  const lines = [`VTC 在线成员（${data.vtcId}）`, `在线 ${data.members.length} 人`]
  for (const member of data.members) {
    lines.push(`${member.isOnline ? '🟢' : '⚫'} ${member.name || '-'}｜${member.role || '-'}${member.isOnline ? `｜${member.serverName || '-'}` : ''}`)
  }
  return lines.join('\n')
}

async function renderImage (ctx, data) {
  if (!ctx.puppeteer) return '未启用 puppeteer 服务'
  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 720, height: 1000, deviceScaleFactor: 1.5 })
    await page.goto(`file:///${resolve(__dirname, '../resource/vtc-member-online.html')}`)
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

module.exports = async (ctx, cfg, session, inputVtcId) => {
  const vtcId = resolveVtcId(inputVtcId, cfg)
  if (!vtcId) return '请输入正确的 VTC 编号'
  const result = await evmOpenApi.vtcMemberOnline(ctx.http, vtcId)
  if (result.error) return '查询 VTC 在线成员失败，请稍后重试'
  const data = { vtcId, members: (Array.isArray(result.data) ? result.data : []).filter((member) => member && member.isOnline) }
  return cfg.tmpVtcMemberOnlineType === 1 ? renderText(data) : renderImage(ctx, data)
}
