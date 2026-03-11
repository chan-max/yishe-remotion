/* eslint-env node */

module.exports = {
  id: "quote-card",
  name: "Quote Card",
  description: "金句卡片视频模板",
  compositionId: "QuoteCard",
  durationInFrames: 240,
  fps: 30,
  width: 1080,
  height: 1920,
  defaultInputProps: {
    quote: "好内容值得被看见",
    author: "Yishe",
    backgroundColor: "#111827",
    textColor: "#F9FAFB",
    width: 1080,
    height: 1920,
    durationInFrames: 240,
  },
  assetSummary: "2段文字, 2个颜色控制, 支持自定义尺寸与时长",
  assets: [
    { key: "quote", type: "text", label: "金句内容" },
    { key: "author", type: "text", label: "作者/来源" },
    { key: "backgroundColor", type: "color", label: "背景颜色" },
    { key: "textColor", type: "color", label: "文字颜色" },
    { key: "width", type: "number", label: "视频宽度" },
    { key: "height", type: "number", label: "视频高度" },
    { key: "durationInFrames", type: "number", label: "总帧数(时长)" },
  ],
  editableFields: [
    "quote",
    "author",
    "backgroundColor",
    "textColor",
    "width",
    "height",
    "durationInFrames",
  ],
};

/**
 * [参数实例 / API 调用参考]
 * 
 * 1. 标准渲染 (默认尺寸):
 * {
 *   "templateId": "quote-card",
 *   "inputProps": {
 *     "quote": "Stay hungry, stay foolish.",
 *     "author": "Steve Jobs"
 *   }
 * }
 * 
 * 2. 动态比例 (高清横屏):
 * {
 *   "templateId": "quote-card",
 *   "inputProps": {
 *     "quote": "每一个不曾起舞的日子，都是对生命的辜负。",
 *     "author": "尼采",
 *     "width": 1920,
 *     "height": 1080,
 *     "durationInFrames": 150
 *   }
 * }
 */
