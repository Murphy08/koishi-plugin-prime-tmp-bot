module.exports = {
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  async waitForPageRender(page, options = {}) {
    const {
      timeoutMs = 15000,
      readyFlag = null,
      settleMs = 150,
      allowReadyTimeout = false,
      onReadyTimeout = null
    } = options

    if (readyFlag) {
      try {
        await page.waitForFunction((flag) => window[flag] === true, {
          timeout: timeoutMs
        }, readyFlag)
      } catch (error) {
        if (!allowReadyTimeout) {
          throw error
        }
        if (typeof onReadyTimeout === 'function') {
          await onReadyTimeout(error)
        }
      }
    }

    await page.waitForFunction(() => {
      return Array.from(document.images || []).every((img) => img.complete)
    }, {
      timeout: timeoutMs
    })

    await page.evaluate(async () => {
      if (!document.fonts || !document.fonts.ready) return
      try {
        await document.fonts.ready
      } catch {}
    })

    await this.sleep(settleMs)
  }
}
