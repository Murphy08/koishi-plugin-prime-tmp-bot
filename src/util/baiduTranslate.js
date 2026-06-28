const md5 = require('js-md5')
const translateCache = require('../database/translateCache')
const { logRequestSuccess, logRequestError } = require('./requestLog')
const TRANSLATE_API = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

module.exports = async (ctx, cfg, content, cache = true) => {
  if (!cfg.baiduTranslateEnable) {
    return content
  }

  if (cfg.baiduTranslateCacheEnable && cache) {
    let translateContent = await translateCache.getTranslate(ctx.database, md5(content))
    if (translateContent) {
      return translateContent
    }
  }

  let randomInt = Math.floor(Math.random() * 10000)
  let sign = md5(cfg.baiduTranslateAppId + content + randomInt + cfg.baiduTranslateKey)
  let result = null
  try {
    result = await ctx.http.get(`${TRANSLATE_API}?q=${encodeURI(content)}&from=auto&to=zh&appid=${cfg.baiduTranslateAppId}&salt=${randomInt}&sign=${sign}`)
  } catch (error) {
    logRequestError('baiduTranslate.translate', TRANSLATE_API, error)
    return content
  }

  if (result.error_code) {
    logRequestError('baiduTranslate.translate', TRANSLATE_API, {
      errorCode: result.error_code,
      errorMsg: result.error_msg
    })
    return content
  }

  if (!result.trans_result || !result.trans_result[0]) {
    logRequestError('baiduTranslate.translate', TRANSLATE_API, {
      reason: 'invalid response'
    })
    return content
  }

  logRequestSuccess('baiduTranslate.translate', TRANSLATE_API)

  if (cfg.baiduTranslateCacheEnable && cache) {
    translateCache.save(ctx.database, md5(content), content, result.trans_result[0].dst)
  }

  return result.trans_result[0].dst
}
