const tmpVtcText = require("./tmpVtcText");
const tmpVtcImg = require("./tmpVtcImg");

module.exports = async (ctx, cfg, session, vtcId) => {
  switch (cfg.tmpVtcQueryType) {
    case 1:
      return await tmpVtcText(ctx, cfg, session, vtcId);
    case 2:
      return await tmpVtcImg(ctx, cfg, session, vtcId);
    default:
      return "指令配置错误";
  }
};
