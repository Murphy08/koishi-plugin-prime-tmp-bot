const dayjs = require('dayjs')
const evmOpenApi = require('../../api/evmOpenApi')

const levelMap = {
  1: '普通',
  2: '橙名',
  3: '红名'
}

module.exports = async (ctx, cfg, session, vtcId) => {
  if (!vtcId || isNaN(vtcId)) {
    return '请输入正确的VTC编号'
  }

  const vtcInfo = await evmOpenApi.vtcInfo(ctx.http, vtcId)
  if (vtcInfo.error && vtcInfo.code === 10001) {
    return 'VTC不存在'
  } else if (vtcInfo.error) {
    return '查询VTC信息失败，请重试'
  }

  const data = vtcInfo.data
  let message = ''
  message += '🚛VTC编号: ' + (data.vtcId ?? '-')
  message += '\n🏷️VTC名称: ' + (data.name || '-')
  message += '\n⭐认证等级: ' + (levelMap[data.level] || `未知(${data.level || '-'})`)
  message += '\n👥成员数量: ' + (data.memberCount ?? '-')
  message += '\n👑所有者TMP ID: ' + (data.ownerTmpId ?? '-')
  message += '\n📅创建时间: ' + (data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD HH:mm:ss') : '-')

  if (data.logoUrl) {
    message += '\n🖼️Logo: ' + data.logoUrl
  }
  if (data.coverUrl) {
    message += '\n🌆Cover: ' + data.coverUrl
  }

  return message
}
