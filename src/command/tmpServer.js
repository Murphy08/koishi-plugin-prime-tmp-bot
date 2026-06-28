const { resolve } = require('path')
const { segment } = require('koishi')
const common = require('../util/common')
const evmOpenApi = require('../api/evmOpenApi')

async function loadServerData (ctx) {
  const serverData = await evmOpenApi.serverList(ctx.http)
  if (serverData.error) {
    return {
      error: '查询服务器失败，请稍后重试'
    }
  }

  return {
    data: serverData
  }
}

function formatFeatures (server) {
  const characteristicList = []
  if (!(server.afkEnable === 1)) {
    characteristicList.push('禁用挂机')
  }
  if (server.collisionsEnable === 1) {
    characteristicList.push('碰撞')
  }
  if (server.policeCarEnable === 1) {
    characteristicList.push('警车')
  }
  if (server.speedLimiterEnable === 1) {
    characteristicList.push('限速')
  }
  return characteristicList
}

function renderText (serverData) {
  let message = ''
  for (let server of serverData.data) {
    if (message) {
      message += '\n\n'
    }

    message += '服务器 ' + (server.isOnline === 1 ? '在线 ' : '离线 ') + server.serverName
    message += `\n玩家人数: ${server.playerCount}/${server.maxPlayer}`
    if (server.queueCount > 0) {
      message += ` (队列: ${server.queueCount})`
    }

    const features = formatFeatures(server)
    if (features.length > 0) {
      message += '\n服务器特性: ' + features.join(' ')
    }
  }
  return message
}

async function renderImage (ctx, serverData) {
  if (!ctx.puppeteer) {
    return '未启用 puppeteer 服务'
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 600, height: 1200, deviceScaleFactor: 1.5 })
    await page.goto(`file:///${resolve(__dirname, '../resource/server-list.html')}`)
    await page.evaluate(`setData(${JSON.stringify(serverData)})`)
    await common.waitForPageRender(page, { settleMs: 300 })
    const element = await page.$('#container')
    return segment.image(
      await element.screenshot({
        encoding: 'binary',
        type: 'png'
      }),
      'image/png'
    )
  } catch {
    return '渲染异常，请重试'
  } finally {
    if (page) {
      await page.close()
    }
  }
}

module.exports = async (ctx, cfg) => {
  const result = await loadServerData(ctx)
  if (result.error) {
    return result.error
  }

  switch (cfg.tmpServerType) {
    case 1:
      return renderText(result.data)
    case 2:
      return await renderImage(ctx, result.data)
    default:
      return '指令配置错误'
  }
}
