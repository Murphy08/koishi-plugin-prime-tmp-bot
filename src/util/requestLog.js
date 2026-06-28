const logger = require('./logger')

function normalizeDetail (detail) {
  if (!detail) {
    return undefined
  }

  if (detail instanceof Error) {
    return {
      name: detail.name,
      message: detail.message,
      stack: detail.stack
    }
  }

  return detail
}

function logRequestSuccess (name, url) {
  logger.info(`[请求成功] ${name} ${url}`)
}

function logRequestError (name, url, detail) {
  const normalizedDetail = normalizeDetail(detail)
  if (normalizedDetail) {
    logger.error(`[请求失败] ${name} ${url}`, normalizedDetail)
    return
  }

  logger.error(`[请求失败] ${name} ${url}`)
}

module.exports = {
  logRequestSuccess,
  logRequestError
}
