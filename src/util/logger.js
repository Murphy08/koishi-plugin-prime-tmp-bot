const { Logger } = require('koishi')

const globalKey = '__primeTmpBotLogger'

if (!globalThis[globalKey]) {
  globalThis[globalKey] = new Logger('prime-tmp-bot')
}

if (!globalThis.logger) {
  globalThis.logger = globalThis[globalKey]
}

module.exports = globalThis[globalKey]
