const evmOpenApi = require('../api/evmOpenApi')

module.exports = async (ctx) => {
  const result = await evmOpenApi.tmpVersion(ctx.http)
  if (result.error) {
    return '查询数据失败，请稍后再试'
  }

  const data = result.data || {}
  let message = 'TMP 版本信息\n'
  message += `联机插件: ${data.tmpVersion || '-'}\n`
  message += `兼容版本: ${data.supportGameVersion || '-'}\n`
  message += `官方版本: ${data.officialGameVersion || '-'}\n`
  message += data.supportGameVersion === data.officialGameVersion
    ? '兼容游戏: 是'
    : '兼容游戏: 否'
  return message
}
