/* eslint-env node */

module.exports = {
  id: "product-highlight",
  name: "Product Highlight",
  description: "产品卖点展示模板",
  compositionId: "ProductHighlight",
  durationInFrames: 210,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultInputProps: {
    productName: "Remotion API",
    slogan: "一键生成品牌视频",
    accentColor: "#22C55E",
    backgroundColor: "#0F172A",
    textColor: "#E2E8F0",
    width: 1920,
    height: 1080,
    durationInFrames: 210,
  },
  assetSummary: "2段文字, 3个颜色控制, 支持全动态尺寸",
  assets: [
    { key: "productName", type: "text", label: "产品名称" },
    { key: "slogan", type: "text", label: "标语" },
    { key: "accentColor", type: "color", label: "强调色" },
    { key: "backgroundColor", type: "color", label: "背景颜色" },
    { key: "textColor", type: "color", label: "文字颜色" },
    { key: "width", type: "number", label: "视频宽度" },
    { key: "height", type: "number", label: "视频高度" },
    { key: "durationInFrames", type: "number", label: "总帧数" },
  ],
  editableFields: [
    "productName",
    "slogan",
    "accentColor",
    "backgroundColor",
    "textColor",
    "width",
    "height",
    "durationInFrames",
  ],
  inputSchema: [
    { key: 'productName', type: 'text', label: '产品名称', description: '主要标题，建议短而有力', required: true, placeholder: '例如：智能手表' , example: 'Remotion API' },
    { key: 'slogan', type: 'text', label: '标语', description: '副标题或促销语', required: false, example: '一键生成品牌视频' },
    { key: 'accentColor', type: 'color', label: '强调色', description: '用于按钮或高亮元素', required: false, example: '#22C55E' },
    { key: 'backgroundColor', type: 'color', label: '背景颜色', description: '页面背景色', required: false, example: '#0F172A' },
    { key: 'textColor', type: 'color', label: '文字颜色', description: '正文文字色', required: false, example: '#E2E8F0' },
    { key: 'width', type: 'number', label: '视频宽度', description: '输出宽度(px)', required: false, example: 1920 },
    { key: 'height', type: 'number', label: '视频高度', description: '输出高度(px)', required: false, example: 1080 },
    { key: 'durationInFrames', type: 'number', label: '总帧数', description: '视频总帧数', required: false, example: 210 }
  ],
};

/**
 * [参数实例 / API 调用参考]
 * 
 * 1. 标准产品展示:
 * {
 *   "templateId": "product-highlight",
 *   "inputProps": {
 *     "productName": "新款智能手表",
 *     "slogan": "定义未来生活"
 *   }
 * }
 * 
 * 2. 电商主图比例 (1:1 正方形):
 * {
 *   "templateId": "product-highlight",
 *   "inputProps": {
 *     "productName": "限时特惠",
 *     "slogan": "全场买一送一",
 *     "width": 1000,
 *     "height": 1000,
 *     "accentColor": "#ff0000"
 *   }
 * }
 */
