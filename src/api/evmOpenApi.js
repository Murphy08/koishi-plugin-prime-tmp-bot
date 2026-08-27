const BASE_API = 'https://evmapi.cxnnn.cn'
const { logRequestSuccess, logRequestError } = require('../util/requestLog')

async function request (http, name, url, resolveData) {
  let result = null
  try {
    result = await http.get(url)
  } catch (error) {
    logRequestError(name, url, error)
    return {
      error: true
    }
  }

  const data = resolveData(result)
  if (data.error) {
    logRequestError(name, url, {
      code: result && result.code
    })
  } else {
    logRequestSuccess(name, url)
  }

  return data
}

function resolveCodeData (result, includeCode = false) {
  let data = {
    error: !result || result.code !== 200
  }
  if (includeCode) {
    data.code = result && result.code
  }
  if (!data.error) {
    data.data = result.data
  }

  return data
}

module.exports = {
  async serverList (http) {
    const url = `${BASE_API}/server/list`
    return await request(http, 'evmOpenApi.serverList', url, (result) => resolveCodeData(result))
  },

  async mapPlayerList (http, serverId, ax, ay, bx, by, options = {}) {
    const params = new URLSearchParams()
    if (serverId !== undefined && serverId !== null && serverId !== '') params.set('serverId', serverId)
    if (ax !== undefined && ax !== null && ax !== '') params.set('aAxisX', ax)
    if (ay !== undefined && ay !== null && ay !== '') params.set('aAxisY', ay)
    if (bx !== undefined && bx !== null && bx !== '') params.set('bAxisX', bx)
    if (by !== undefined && by !== null && by !== '') params.set('bAxisY', by)
    if (options.tmpId) params.set('tmpId', options.tmpId)
    if (options.tmpIdList) params.set('tmpIdList', options.tmpIdList)
    if (options.tmpName) params.set('tmpName', options.tmpName)
    const url = `${BASE_API}/map/playerList?${params.toString()}`
    return await request(http, 'evmOpenApi.mapPlayerList', url, (result) => resolveCodeData(result))
  },

  async playerInfo (http, tmpId) {
    const url = `${BASE_API}/player/info?tmpId=${tmpId}`
    return await request(http, 'evmOpenApi.playerInfo', url, (result) => resolveCodeData(result, true))
  },

  async vtcInfo (http, vtcId) {
    const url = `${BASE_API}/vtc/info?vtcId=${vtcId}`
    return await request(http, 'evmOpenApi.vtcInfo', url, (result) => resolveCodeData(result, true))
  },

  async vtcMemberOnline (http, vtcId) {
    const url = `${BASE_API}/vtc/memberOnline?vtcId=${vtcId}`
    return await request(http, 'evmOpenApi.vtcMemberOnline', url, (result) => resolveCodeData(result))
  },

  async vtcMileageRankingList (http, rankingType, vtcId) {
    const url = `${BASE_API}/statistics/VTCmileageRankingList?rankingType=${rankingType}&vtcId=${vtcId}`
    return await request(http, 'evmOpenApi.vtcMileageRankingList', url, (result) => resolveCodeData(result))
  },

  async dlcList (http, type) {
    const url = `${BASE_API}/dlc/list?type=${type}`
    return await request(http, 'evmOpenApi.dlcList', url, (result) => resolveCodeData(result))
  },

  async mileageRankingList (http, rankingType, tmpId) {
    const url = `${BASE_API}/statistics/mileageRankingList?rankingType=${rankingType}&tmpId=${tmpId || ''}&rankingCount=10`
    return await request(http, 'evmOpenApi.mileageRankingList', url, (result) => resolveCodeData(result))
  },

  async mapPlayerHistory (http, tmpId, serverId, startTime, endTime) {
    const url = `${BASE_API}/map/playerHistory?tmpId=${tmpId || ''}&serverId=${serverId || ''}&startTime=${startTime || ''}&endTime=${endTime || ''}`
    return await request(http, 'evmOpenApi.mapPlayerHistory', url, (result) => resolveCodeData(result))
  },

  async tmpVersion (http) {
    const url = `${BASE_API}/other/tmpVersion`
    return await request(http, 'evmOpenApi.tmpVersion', url, (result) => resolveCodeData(result))
  }
}
