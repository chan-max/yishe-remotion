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
  inputSchema: [
    {
      key: 'quote',
      type: 'text',
      label: '金句内容',
      description: '主体引用文本，尽量控制在可视区域内（建议行数 <= 4）',
      required: true,
      placeholder: '例如：好内容值得被看见',
      example: 'Stay hungry, stay foolish.'
    },
    {
      key: 'author',
      type: 'text',
      label: '作者/来源',
      description: '引用来源或作者，可为空',
      required: false,
      example: 'Steve Jobs'
    },
    {
      key: 'backgroundColor',
      type: 'color',
      label: '背景颜色',
      description: '背景色，使用 HEX 值。',
      required: false,
      example: '#111827'
    },
    {
      key: 'textColor',
      type: 'color',
      label: '文字颜色',
      description: '文字颜色，确保与背景对比明显。',
      required: false,
      example: '#F9FAFB'
    },
    {
      key: 'width',
      type: 'number',
      label: '视频宽度',
      description: '输出宽度(px)',
      required: false,
      min: 160,
      max: 3840,
      example: 1080
    },
    {
      key: 'height',
      type: 'number',
      label: '视频高度',
      description: '输出高度(px)',
      required: false,
      min: 160,
      max: 3840,
      example: 1920
    },
    {
      key: 'durationInFrames',
      type: 'number',
      label: '总帧数(时长)',
      description: '总帧数决定时长，默认 240 帧。',
      required: false,
      example: 240
    }
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
