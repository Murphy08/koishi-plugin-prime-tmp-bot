const { segment } = require("koishi");
const { Logger } = require("koishi");
const dayjs = require("dayjs");
const { resolve } = require("path");
const { pathToFileURL } = require("url");
const common = require("../util/common");
const { PromodsIds, ServerType } = require("../util/constant");
const evmOpenApi = require("../api/evmOpenApi");
const guildBind = require("../database/guildBind");
const tmpIdResolver = require("../util/tmpIdResolver");

module.exports = async (ctx, session, serverType, tmpId) => {
  const logger = new Logger("footprint");
  if (!ctx.puppeteer) {
    return "未启用 puppeteer 服务";
  }

  const resolved = await tmpIdResolver.resolveQueryTmpId(ctx, session, tmpId);
  if (resolved.error) {
    return resolved.error;
  }
  tmpId = resolved.tmpId;

  if (tmpId && isNaN(tmpId)) {
    return `请输入正确的玩家编号，或绑定玩家编号`;
  }

  // 如果没有传入tmpId，尝试从数据库查询绑定信息
  if (!tmpId) {
    let guildBindData = await guildBind.get(
      ctx.database,
      session.platform,
      session.userId,
    );
    if (!guildBindData) {
      return `请输入正确的玩家编号，或绑定玩家编号`;
    }
    tmpId = guildBindData.tmp_id;
  }

  // 查询玩家信息
  let playerInfo = await evmOpenApi.playerInfo(ctx.http, tmpId);
  if (playerInfo.error && playerInfo.code === 10001) {
    return "玩家不存在";
  } else if (playerInfo.error) {
    return "查询玩家信息失败，请重试";
  }

  // 查询当日历史位置数据
  const startTime = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
  const endTime = dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss");
  let mapPlayerHistory = await evmOpenApi.mapPlayerHistory(
    ctx.http,
    tmpId,
    null,
    startTime,
    endTime,
  );
  if (mapPlayerHistory.error) {
    return "查询玩家历史位置数据失败，请稍后重试";
  }

  // 过滤非对应服务器数据
  const promodsIdSet = new Set(PromodsIds);
  const mapPlayerHistoryArr = mapPlayerHistory.data.filter((item) => {
    if (ServerType.ets === serverType) {
      return !promodsIdSet.has(item.serverId);
    } else if (ServerType.promods === serverType) {
      return promodsIdSet.has(item.serverId);
    }
    return false;
  });
  if (mapPlayerHistoryArr.length === 0) {
    return `当日暂无数据`;
  }

  // 拼接数据
  let data = {
    mapType: ServerType.promods === serverType ? "promods" : "ets",
    name: playerInfo.data.name,
    smallAvatarUrl: playerInfo.data.smallAvatarUrl,
    todayMileage: playerInfo.data.todayMileage,
    points: mapPlayerHistoryArr,
  };

  let page;
  try {
    page = await ctx.puppeteer.page();
    page.on("pageerror", (error) => logger.warn(error));
    page.on("requestfailed", (request) => {
      logger.warn(
        `request failed: ${request.url()} ${request.failure()?.errorText || ""}`.trim(),
      );
    });

    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(resolve(__dirname, "../resource/footprint.html")).href);
    await page.evaluate(`init(${JSON.stringify(data)})`);
    await common.waitForPageRender(page, {
      readyFlag: "__footprintReady",
      timeoutMs: 15000,
      settleMs: 100,
      allowReadyTimeout: true,
      onReadyTimeout: async (error) => {
        logger.warn(`footprint ready timeout, fallback to screenshot: ${error.message}`);
      },
    });
    const element = await page.$("#container");
    return segment.image(
      await element.screenshot({
        encoding: "binary",
        type: "png",
      }),
      "image/png",
    );
  } catch (e) {
    logger.info(e);
    return "渲染异常，请重试";
  } finally {
    if (page) {
      await page.close();
    }
  }
  return `OK: ` + playerInfo.data.name;
};
