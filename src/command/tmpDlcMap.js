const { segment } = require('koishi')
const { resolve } = require('path')
const common = require('../util/common')
const evmOpenApi = require('../api/evmOpenApi')

function formatPrice (price) {
  const value = Number(price)
  if (!Number.isFinite(value)) {
    return '-'
  }
  return `¥${Math.ceil(value / 100)}`
}

async function loadDlcData (ctx) {
  const dlcData = await evmOpenApi.dlcList(ctx.http, 1)
  if (dlcData.error) {
    return {
      error: '查询 DLC 数据失败，请稍后重试'
    }
  }

  return {
    data: Array.isArray(dlcData.data) ? dlcData.data : []
  }
}

function renderText (dlcList) {
  if (!dlcList.length) {
    return '暂无 DLC 数据'
  }

  const lines = ['DLC 内容概览']
  for (const dlc of dlcList) {
    const discount = dlc.discount > 0 ? ` / -${dlc.discount}%` : ''
    lines.push(`${dlc.name || '-'}: ${formatPrice(dlc.finalPrice)}${discount}`)
  }
  return lines.join('\n')
}

async function renderImage (ctx, dlcList) {
  if (!ctx.puppeteer) {
    return '未启用 Puppeteer 功能'
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 600, height: 1200, deviceScaleFactor: 1.5 })
    await page.goto(`file:///${resolve(__dirname, '../resource/dlc.html')}`)
    await page.evaluate(`setData(${JSON.stringify(dlcList)})`)
    await common.waitForPageRender(page, { settleMs: 500 })
    const element = await page.$('#dlc-info-container')
    return segment.image(
      await element.screenshot({
        encoding: 'binary',
        type: 'png'
      }),
      'image/png'
    )
  } catch (e) {
    console.info(e)
    return '渲染异常，请重试'
  } finally {
    if (page) {
      await page.close()
    }
  }
}

module.exports = async (ctx, cfg, session) => {
  const result = await loadDlcData(ctx)
  if (result.error) {
    return result.error
  }

  switch (cfg.tmpDlcMapType) {
    case 1:
      return renderText(result.data)
    case 2:
      return await renderImage(ctx, result.data)
    default:
      return '指令配置错误'
  }
}
