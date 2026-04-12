const dayjs = require('dayjs')
const evmOpenApi = require('../../api/evmOpenApi')
const { resolve } = require('path')
const common = require('../../util/common')
const { segment } = require('koishi')

const levelMap = {
  1: { text: '普通', color: '#6B7280' },
  2: { text: '橙名', color: '#F59E0B' },
  3: { text: '红名', color: '#EF4444' }
}

module.exports = async (ctx, cfg, session, vtcId) => {
  if (!ctx.puppeteer) {
    return '未启用 puppeteer 服务'
  }

  if (!vtcId || isNaN(vtcId)) {
    return '请输入正确的VTC编号'
  }

  const vtcInfo = await evmOpenApi.vtcInfo(ctx.http, vtcId)
  if (vtcInfo.error && vtcInfo.code === 10001) {
    return 'VTC不存在'
  } else if (vtcInfo.error) {
    return '查询VTC信息失败，请重试'
  }

  const info = vtcInfo.data
  const levelInfo = levelMap[info.level] || { text: `未知(${info.level || '-'})`, color: '#6B7280' }
  const data = {
    vtcId: info.vtcId,
    name: info.name,
    level: levelInfo.text,
    levelColor: levelInfo.color,
    memberCount: info.memberCount,
    ownerTmpId: info.ownerTmpId,
    createTime: info.createTime ? dayjs(info.createTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    logoUrl: info.logoUrl,
    coverUrl: info.coverUrl
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 419, height: 900, deviceScaleFactor: 2 })
    await page.goto(`file:///${resolve(__dirname, '../../resource/vtc-query.html')}`)
    await page.evaluate(`init(${JSON.stringify(data)})`)
    await common.waitForPageRender(page)
    const element = await page.$('#container')
    return segment.image(
      await element.screenshot({
        encoding: 'binary',
        type: 'png'
      }),
      'image/png'
    )
  } catch (e) {
    logger.error('渲染VTC信息失败', { vtcId, error: e })
    return '渲染异常，请重试'
  } finally {
    if (page) {
      await page.close()
    }
  }
}
