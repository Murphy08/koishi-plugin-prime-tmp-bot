const { segment } = require('koishi')
const { resolve } = require('path')
const truckyAppApi = require('../api/truckyAppApi')
const truckersMpApi = require('../api/truckersMpApi')
const evmOpenApi = require('../api/evmOpenApi')
const baiduTranslate = require('../util/baiduTranslate')
const common = require('../util/common')
const tmpIdResolver = require('../util/tmpIdResolver')

async function loadPositionData (ctx, cfg, session, inputTmpId) {
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

  const playerInfo = await truckersMpApi.player(ctx.http, tmpId)
  if (playerInfo.error) {
    return {
      error: '查询玩家信息失败，请重试'
    }
  }

  const playerMapInfo = await truckyAppApi.online(ctx.http, tmpId)
  if (playerMapInfo.error) {
    return {
      error: '查询玩家位置信息失败，请重试'
    }
  }
  if (!playerMapInfo.data.online) {
    return {
      error: '玩家离线'
    }
  }

  const areaPlayersData = await evmOpenApi.mapPlayerList(
    ctx.http,
    playerMapInfo.data.server,
    playerMapInfo.data.x - 4000,
    playerMapInfo.data.y + 2500,
    playerMapInfo.data.x + 4000,
    playerMapInfo.data.y - 2500
  )

  let areaPlayerList = []
  if (!areaPlayersData.error && Array.isArray(areaPlayersData.data)) {
    areaPlayerList = areaPlayersData.data
    const index = areaPlayerList.findIndex((player) => {
      return player.tmpId.toString() === tmpId.toString()
    })
    if (index !== -1) {
      areaPlayerList.splice(index, 1)
    }
  }
  areaPlayerList.push({
    axisX: playerMapInfo.data.x,
    axisY: playerMapInfo.data.y,
    tmpId
  })

  const promodsServerIdList = [50, 51]
  const country = await baiduTranslate(ctx, cfg, playerMapInfo.data.location.poi.country)
  const realName = await baiduTranslate(ctx, cfg, playerMapInfo.data.location.poi.realName)

  return {
    data: {
      mapType: promodsServerIdList.indexOf(playerMapInfo.data.server) !== -1 ? 'promods' : 'ets',
      avatar: playerInfo.data.smallAvatar,
      username: playerInfo.data.name,
      serverName: playerMapInfo.data.serverDetails.name,
      country,
      realName,
      currentPlayerId: tmpId,
      centerX: playerMapInfo.data.x,
      centerY: playerMapInfo.data.y,
      playerList: areaPlayerList
    }
  }
}

function renderText (data) {
  const nearbyCount = Math.max((data.playerList || []).length - 1, 0)
  return [
    `玩家: ${data.username} (#${data.currentPlayerId})`,
    `服务器: ${data.serverName}`,
    `位置: ${data.country} - ${data.realName}`,
    `地图: ${data.mapType === 'promods' ? 'ProMods' : 'ETS2'}`,
    `坐标: X ${Math.round(data.centerX)}, Y ${Math.round(data.centerY)}`,
    `周边玩家: ${nearbyCount}`
  ].join('\n')
}

async function renderImage (ctx, data) {
  if (!ctx.puppeteer) {
    return '未启用 puppeteer 服务'
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 720, height: 500, deviceScaleFactor: 1.5 })
    await page.goto(`file:///${resolve(__dirname, '../resource/position.html')}`)
    await page.evaluate(`setData(${JSON.stringify(data)})`)
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
    return '渲染异常，请重试'
  } finally {
    if (page) {
      await page.close()
    }
  }
}

module.exports = async (ctx, cfg, session, tmpId) => {
  const result = await loadPositionData(ctx, cfg, session, tmpId)
  if (result.error) {
    return result.error
  }

  switch (cfg.tmpPositionType) {
    case 1:
      return renderText(result.data)
    case 2:
      return await renderImage(ctx, result.data)
    default:
      return '指令配置错误'
  }
}
