const BASE_API = 'https://da.vtcm.link'
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

  async mapPlayerList (http, serverId, ax, ay, bx, by) {
    const url = `${BASE_API}/map/playerList?aAxisX=${ax}&aAxisY=${ay}&bAxisX=${bx}&bAxisY=${by}&serverId=${serverId}`
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
  }
}
