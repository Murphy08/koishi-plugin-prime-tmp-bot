const { segment } = require('koishi')
const { resolve } = require('path')
const common = require('../util/common')
const evmOpenApi = require('../api/evmOpenApi')
const guildBind = require('../database/guildBind')
const { MileageRankingType } = require('../util/constant')

function formatMileage (distance) {
  const meters = Number(distance) || 0
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${meters} m`
}

function getTitle (rankingType) {
  return rankingType === MileageRankingType.today ? '今日里程排行榜' : '总里程排行榜'
}

async function loadRankingData (ctx, session, rankingType) {
  const mileageRankingList = await evmOpenApi.mileageRankingList(ctx.http, rankingType, null)
  if (mileageRankingList.error) {
    return {
      error: '查询排行榜信息失败'
    }
  } else if (!mileageRankingList.data || mileageRankingList.data.length === 0) {
    return {
      error: '暂无数据'
    }
  }

  const guildBindData = await guildBind.get(ctx.database, session.platform, session.userId)
  let playerMileageRanking = null
  if (guildBindData) {
    const playerMileageRankingResult = await evmOpenApi.mileageRankingList(ctx.http, rankingType, guildBindData.tmp_id)
    if (!playerMileageRankingResult.error && playerMileageRankingResult.data.length > 0) {
      playerMileageRanking = playerMileageRankingResult.data[0]
    }
  }

  return {
    data: {
      rankingType,
      mileageRankingList: mileageRankingList.data,
      playerMileageRanking
    }
  }
}

function renderText (data) {
  const lines = [getTitle(data.rankingType)]
  for (const player of data.mileageRankingList.slice(0, 10)) {
    lines.push(`#${player.ranking} ${player.tmpName}: ${formatMileage(player.distance)}`)
  }

  if (data.playerMileageRanking) {
    lines.push('')
    lines.push(`你的排名: #${data.playerMileageRanking.ranking} ${data.playerMileageRanking.tmpName}: ${formatMileage(data.playerMileageRanking.distance)}`)
  }

  return lines.join('\n')
}

async function renderImage (ctx, data) {
  if (!ctx.puppeteer) {
    return '未启用 Puppeteer 功能'
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 340, height: 1000, deviceScaleFactor: 1.5 })
    await page.goto(`file:///${resolve(__dirname, '../resource/mileage-leaderboard.html')}`)
    await page.evaluate(`setData(${JSON.stringify(data)})`)
    await common.waitForPageRender(page, { settleMs: 500 })
    const element = await page.$('#container')
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

module.exports = async (ctx, cfg, session, rankingType) => {
  const result = await loadRankingData(ctx, session, rankingType)
  if (result.error) {
    return result.error
  }

  switch (cfg.tmpMileageRankingType) {
    case 1:
      return renderText(result.data)
    case 2:
      return await renderImage(ctx, result.data)
    default:
      return '指令配置错误'
  }
}
