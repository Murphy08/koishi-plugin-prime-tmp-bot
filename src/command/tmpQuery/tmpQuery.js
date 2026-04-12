const tmpQueryText = require("./tmpQueryText");
const tmpQueryImg = require("./tmpQueryImg");
const tmpIdResolver = require("../../util/tmpIdResolver");

module.exports = async (ctx, cfg, session, tmpId) => {
  const resolved = await tmpIdResolver.resolveQueryTmpId(ctx, session, tmpId);
  if (resolved.error) {
    return resolved.error;
  }

  switch (cfg.tmpQueryType) {
    case 1:
      return await tmpQueryText(ctx, cfg, session, resolved.tmpId);
    case 2:
      return await tmpQueryImg(ctx, cfg, session, resolved.tmpId);
    default:
      return "指令配置错误";
  }
};
