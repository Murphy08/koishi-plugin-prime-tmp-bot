const { resolve } = require('path')
const { segment } = require('koishi')
const common = require('../../util/common')

module.exports = async function renderImage (ctx, event) {
  if (!ctx.puppeteer) {
    return '未启用 puppeteer 服务'
  }

  let page
  try {
    page = await ctx.puppeteer.page()
    await page.setViewport({ width: 1260, height: 1600 })
    await page.goto(`file:///${resolve(__dirname, '../../resource/event.html')}`)
    await page.evaluate(async (eventData) => {
      window.renderEvent(eventData)
      if (typeof window.prepareEventRender === 'function') {
        await window.prepareEventRender()
      }
    }, event)
    await page.waitForNetworkIdle({ idleTime: 250, timeout: 8000 }).catch(() => {})

    // 根据最终内容高度调整视口，避免长文本活动被截图截断。
    const viewport = await page.evaluate(() => {
      const element = document.getElementById('event-card')
      const rect = element.getBoundingClientRect()
      return {
        width: Math.ceil(rect.width) + 80,
        height: Math.ceil(rect.height) + 120
      }
    })

    await page.setViewport({
      width: Math.max(1260, viewport.width),
      height: Math.min(Math.max(1400, viewport.height), 16000)
    })
    await common.sleep(120)
    await page.evaluate(async () => {
      if (typeof window.prepareEventRender === 'function') {
        await window.prepareEventRender()
      }
    })

    const element = await page.$('#event-card')
    return segment.image(
      await element.screenshot({
        encoding: 'binary'
      }),
      'image/png'
    )
  } catch {
    return '渲染活动卡片失败，请稍后再试'
  } finally {
    if (page) {
      await page.close()
    }
  }
}
