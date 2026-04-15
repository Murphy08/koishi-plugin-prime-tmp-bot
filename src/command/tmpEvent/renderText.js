function formatDlcs (dlcs) {
  if (!Array.isArray(dlcs) || !dlcs.length) {
    return ['DLC 列表：无']
  }

  const lines = ['DLC 列表：']
  for (const dlc of dlcs) {
    lines.push(`- [${dlc.id}] ${dlc.name}`)
  }
  return lines
}

module.exports = function renderText (event) {
  const lines = []

  lines.push(`活动名称：${event.name}`)
  lines.push(`活动 ID：${event.id ?? '-'}`)
  lines.push(`活动类型：${event.eventType}`)
  lines.push(`游戏：${event.game}`)
  lines.push(`服务器：${event.serverName}`)
  lines.push(`语言：${event.language}`)
  lines.push(`出发城市：${event.departureCity}`)
  lines.push(`出发地点：${event.departureLocation}`)
  lines.push(`到达城市：${event.arriveCity}`)
  lines.push(`到达地点：${event.arriveLocation}`)
  lines.push(`集合时间（UTC）：${event.meetupUtc}`)
  lines.push(`集合时间（北京时间）：${event.meetupBeijing}`)
  lines.push(`发车时间（UTC）：${event.startUtc}`)
  lines.push(`发车时间（北京时间）：${event.startBeijing}`)
  lines.push(`VTC ID：${event.vtcId ?? '-'}`)
  lines.push(`VTC 名称：${event.vtcName || '-'}`)
  lines.push(`参与统计：确认 ${event.attendances.confirmed} / 待定 ${event.attendances.unsure} / VTC ${event.attendances.vtcs}`)
  lines.push(`活动链接：${event.url}`)
  lines.push(`活动海报：${event.banner || '-'}`)
  lines.push(`路线图：${event.map || '-'}`)
  lines.push(`语音链接：${event.voiceLink || '-'}`)
  lines.push(`外部链接：${event.externalLink || '-'}`)

  lines.push('')
  lines.push(...formatDlcs(event.dlcs))

  lines.push('')
  lines.push('活动简介：')
  lines.push(event.descriptionPlain || '无')

  lines.push('')
  lines.push('活动规则：')
  lines.push(event.rulePlain || '无')

  return lines.join('\n').trim()
}
