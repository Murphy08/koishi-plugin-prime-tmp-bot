# koishi-plugin-prime-tmp-bot

[![npm](https://img.shields.io/npm/v/koishi-plugin-prime-tmp-bot?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-prime-tmp-bot)
[![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![koishi](https://img.shields.io/badge/Koishi-4.x-blueviolet?style=flat-square)](https://koishi.chat/)

Prime Logistics 中国社区定制版 TruckersMP 查询插件。
基于 `koishi-plugin-tmp-bot` 修改，保留原有 TMP 查询能力，并加入 Prime 风格的图片卡片、路况热力图、VTC 查询与活动查询等功能。

## 功能亮点

- TMP 玩家信息查询、绑定、实时位置查询
- ETS2 服务器状态查询，支持文字 / 图片模式
- 路况热门地点查询，支持文字 / 热力图模式
- DLC 列表、里程排行榜、今日足迹
- VTC 信息查询，支持文字 / Prime 主题图片模式
- TruckersMP 活动查询、默认 VTC 近期活动、指定 VTC 近期活动
- 外部请求成功 / 失败日志输出，便于在 Koishi 控制台排查问题

## 依赖

| 服务 | 必需 | 说明 |
| --- | --- | --- |
| `database` | 是 | 绑定 TMP ID、翻译缓存等功能需要数据库 |
| `puppeteer` | 否 | 图片卡片、热力图、足迹图等图片模式需要启用 |

> 如果未启用 `puppeteer`，请将相关展示方式配置为 `文字`。

## 配置项

### 基础配置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `baiduTranslateEnable` | `false` | 启用百度翻译，用于路况、地点等英文内容翻译 |
| `baiduTranslateAppId` | 空 | 百度翻译 APP ID |
| `baiduTranslateKey` | 空 | 百度翻译密钥 |
| `baiduTranslateCacheEnable` | `false` | 启用翻译缓存，减少重复请求 |

### 展示方式

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `queryShowAvatarEnable` | `false` | 文字查询中是否显示玩家头像 |
| `tmpQueryType` | `图片` | 玩家查询：`1` 文字，`2` 图片 |
| `tmpTrafficType` | `热力图` | 路况查询：`1` 文字，`2` 热力图 |
| `tmpServerType` | `文字` | 服务器列表：`1` 文字，`2` 图片 |
| `tmpPositionType` | `图片` | 玩家位置：`1` 文字，`2` 图片 |
| `tmpDlcMapType` | `图片` | DLC 列表：`1` 文字，`2` 图片 |
| `tmpMileageRankingType` | `图片` | 里程排行榜：`1` 文字，`2` 图片 |
| `tmpFootprintType` | `图片` | 今日足迹：`1` 文字，`2` 图片 |
| `tmpVtcQueryType` | `图片` | VTC 查询：`1` 文字，`2` 图片 |
| `tmpeventType` | `图片` | 活动查询：`1` 文字，`2` 图片 |
| `defaultVTCID` | `7` | 默认 VTC ID，用于默认 VTC 近期活动查询 |

## 指令

### 玩家

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| `tmpbind <tmpId>` | 绑定自己的 TMP ID | `tmpbind 123456` |
| `tmpquery [tmpId]` | 查询 TMP 玩家信息；不填时使用绑定 ID | `tmpquery 123456` |
| `tmpposition [tmpId]` | 查询玩家实时位置 | `tmpposition 123456` |

### 服务器与路况

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| `tmpserverets` | 查询 ETS2 服务器列表 | `tmpserverets` |
| `tmptraffic <server>` | 查询热门地点路况 | `tmptraffic s1` |

`tmptraffic` 支持的服务器简称：

| 简称 | 服务器 |
| --- | --- |
| `s1` | Simulation 1 |
| `s2` | Simulation 2 |
| `p` | ProMods |
| `a` | Arcade |

> `tmpserverats` 是原项目历史版本中出现过的 ATS 服务器指令；当前上游已因接口变更移除，本主题版按当前上游实现保留 `tmpserverets`。

### 排行与足迹

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| `tmpmileageranking` | 总里程排行榜 | `tmpmileageranking` |
| `tmptodaymileageranking` | 今日里程排行榜 | `tmptodaymileageranking` |
| `tmpfootprints [tmpId]` | 今日 ETS2 足迹 | `tmpfootprints 123456` |
| `tmpfootprintp [tmpId]` | 今日 ProMods 足迹 | `tmpfootprintp 123456` |

### VTC 与活动

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| `tmpvtc <vtcId>` | 查询 VTC 信息 | `tmpvtc 7` |
| `tmpevent <eventId>` | 查询 TruckersMP 活动详情 | `tmpevent 12345` |
| `tmpdefaultvtcrecent [count]` | 查询默认 VTC 近期活动 | `tmpdefaultvtcrecent 3` |
| `tmpvtcrecent [vtcId] [count]` | 查询指定 VTC 近期活动 | `tmpvtcrecent 7 3` |

### 其他

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| `tmpversion` | 查询 TMP / 游戏兼容版本 | `tmpversion` |
| `tmpdlcmap` | 查询地图 DLC 列表 | `tmpdlcmap` |

## 数据来源

- TruckersMP 官方接口
- VTcm / TMP 相关数据接口
- TruckyApp 路况接口
- TMP 数据接口文档：[Apifox 文档](https://apifox.com/apidoc/shared-38508a88-5ff4-4b29-b724-41f9d3d3336a)

## 致谢与许可

本插件基于原项目 `koishi-plugin-tmp-bot` 修改而来。
原项目作者 / 维护者信息保留：`79887143`，原 README 联系方式：`QQ 3523283907`。

当前主题定制与维护：`Murphy08` / Prime Logistics 中国社区。

本项目遵循 [MIT License](./LICENSE)。根据 MIT 许可证要求，分发或二次修改时请保留原作者版权声明、许可证文本与本致谢说明。
