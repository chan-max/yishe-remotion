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
