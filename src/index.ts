import { Context, Schema } from 'koishi'

require('./util/logger')

const model = require('./database/model')
const { MileageRankingType, ServerType } = require('./util/constant')
const tmpQuery = require('./command/tmpQuery/tmpQuery')
const tmpVtc = require('./command/tmpVtc/tmpVtc')
const tmpServer = require('./command/tmpServer')
const tmpBind = require('./command/tmpBind')
const tmpTraffic = require('./command/tmpTraffic/tmpTraffic')
const tmpPosition = require('./command/tmpPosition')
const tmpVersion = require('./command/tmpVersion')
const tmpDlcMap = require('./command/tmpDlcMap')
const tmpMileageRanking = require('./command/tmpMileageRanking')
const tmpFootprint = require('./command/tmpFootprint')
const tmpEvent = require('./command/tmpEvent')

export const name = 'tmp-bot'

export const inject = {
  required: ['database'],
  optional: ['puppeteer']
}

export interface Config {
  baiduTranslateEnable: boolean
  baiduTranslateAppId: string
  baiduTranslateKey: string
  baiduTranslateCacheEnable: boolean
  queryShowAvatarEnable: boolean
  tmpTrafficType: 1 | 2
  tmpQueryType: 1 | 2
  tmpVtcQueryType: 1 | 2
  defaultVTCID: number
  tmpeventType: 1 | 2
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    baiduTranslateEnable: Schema.boolean().default(false).description('启用百度翻译'),
    baiduTranslateAppId: Schema.string().description('百度翻译 APP ID'),
    baiduTranslateKey: Schema.string().description('百度翻译密钥'),
    baiduTranslateCacheEnable: Schema.boolean().default(false).description('启用百度翻译缓存')
  }).description('基础配置'),
  Schema.object({
    queryShowAvatarEnable: Schema.boolean().default(false).description('查询指令显示头像，部分玩家的擦边头像可能导致封号'),
    tmpTrafficType: Schema.union([
      Schema.const(1).description('文字'),
      Schema.const(2).description('热力图')
    ]).default(2).description('路况信息展示方式'),
    tmpQueryType: Schema.union([
      Schema.const(1).description('文字'),
      Schema.const(2).description('图片')
    ]).default(2).description('玩家查询信息展示方式'),
    tmpVtcQueryType: Schema.union([
      Schema.const(1).description('文字'),
      Schema.const(2).description('图片')
    ]).default(2).description('VTC 查询信息展示方式'),
    defaultVTCID: Schema.number().default(7).description('默认 VTC ID'),
    tmpeventType: Schema.union([
      Schema.const(1).description('文字'),
      Schema.const(2).description('图片')
    ]).default(2).description('活动信息展示方式')
  }).description('指令配置')
])

export function apply(ctx: Context, cfg: Config) {
  model(ctx)

  ctx.command('tmpquery [tmpId]').action(async ({ session }, tmpId) => await tmpQuery(ctx, cfg, session, tmpId))
  ctx.command('tmpvtc <vtcId>').action(async ({ session }, vtcId) => await tmpVtc(ctx, cfg, session, vtcId))
  ctx.command('tmpserverets').action(async () => await tmpServer(ctx))
  ctx.command('tmpbind <tmpId>').action(async ({ session }, tmpId) => await tmpBind(ctx, cfg, session, tmpId))
  ctx.command('tmptraffic <serverName>').action(async ({ session }, serverName) => await tmpTraffic(ctx, cfg, serverName))
  ctx.command('tmpposition [tmpId]').action(async ({ session }, tmpId) => await tmpPosition(ctx, cfg, session, tmpId))
  ctx.command('tmpversion').action(async () => await tmpVersion(ctx))
  ctx.command('tmpdlcmap').action(async ({ session }) => await tmpDlcMap(ctx, session))
  ctx.command('tmpmileageranking').action(async ({ session }) => await tmpMileageRanking(ctx, session, MileageRankingType.total))
  ctx.command('tmptodaymileageranking').action(async ({ session }) => await tmpMileageRanking(ctx, session, MileageRankingType.today))
  ctx.command('tmpfootprints [tmpId]').action(async ({ session }, tmpId) => await tmpFootprint(ctx, session, ServerType.ets, tmpId))
  ctx.command('tmpfootprintp [tmpId]').action(async ({ session }, tmpId) => await tmpFootprint(ctx, session, ServerType.promods, tmpId))
  ctx.command('tmpevent <eventId>').action(async ({ session }, eventId) => await tmpEvent(ctx, cfg, session, 'eventById', eventId))
  ctx.command('tmpdefaultvtcrecent [count]').action(async ({ session }, count) => await tmpEvent(ctx, cfg, session, 'defaultVtcRecent', count))
  ctx.command('tmpvtcrecent [vtcId] [count]').action(async ({ session }, vtcId, count) => await tmpEvent(ctx, cfg, session, 'vtcRecent', vtcId, count))
}
