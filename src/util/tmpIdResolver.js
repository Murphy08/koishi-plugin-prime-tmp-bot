const guildBind = require("../database/guildBind");

function isNumericTmpId(tmpId) {
  return /^\d+$/.test(String(tmpId).trim());
}

function collectAtElements(elements, result = []) {
  if (!Array.isArray(elements)) {
    return result;
  }

  for (const element of elements) {
    if (!element || typeof element !== "object") {
      continue;
    }

    if (element.type === "at") {
      result.push(element);
    }

    if (Array.isArray(element.children) && element.children.length) {
      collectAtElements(element.children, result);
    }
  }

  return result;
}

function getMentionedUserId(session) {
  const atElements = collectAtElements(session?.elements || []);

  for (const element of atElements) {
    const userId = element.attrs?.id ?? element.data?.id;
    if (!userId) {
      continue;
    }

    if (session?.selfId && `${userId}` === `${session.selfId}`) {
      continue;
    }

    return `${userId}`;
  }

  return null;
}

module.exports = {
  getMentionedUserId,
  async resolveQueryTmpId(ctx, session, inputTmpId, options = {}) {
    const invalidMessage =
      options.invalidMessage || "请输入正确的玩家编号，或绑定玩家编号";
    const selfBindMissingMessage =
      options.selfBindMissingMessage || invalidMessage;
    const targetBindMissingMessage =
      options.targetBindMissingMessage || "该用户尚未绑定 TMP ID";

    const trimmedTmpId =
      typeof inputTmpId === "string" ? inputTmpId.trim() : inputTmpId;

    if (trimmedTmpId && isNumericTmpId(trimmedTmpId)) {
      return { tmpId: trimmedTmpId };
    }

    const mentionedUserId = getMentionedUserId(session);
    if (mentionedUserId) {
      const guildBindData = await guildBind.get(
        ctx.database,
        session.platform,
        mentionedUserId,
      );
      if (!guildBindData) {
        return { error: targetBindMissingMessage };
      }
      return {
        tmpId: guildBindData.tmp_id,
        source: "mention",
        userId: mentionedUserId,
      };
    }

    if (!trimmedTmpId) {
      const guildBindData = await guildBind.get(
        ctx.database,
        session.platform,
        session.userId,
      );
      if (!guildBindData) {
        return { error: selfBindMissingMessage };
      }
      return {
        tmpId: guildBindData.tmp_id,
        source: "self",
        userId: session.userId,
      };
    }

    return { error: invalidMessage };
  },
};
