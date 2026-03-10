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
  },
  assetSummary: "2段文字, 3个颜色控制",
  assets: [
    { key: "productName", type: "text", label: "产品名称" },
    { key: "slogan", type: "text", label: "标语" },
    { key: "accentColor", type: "color", label: "强调色" },
    { key: "backgroundColor", type: "color", label: "背景颜色" },
    { key: "textColor", type: "color", label: "文字颜色" },
  ],
  editableFields: [
    "productName",
    "slogan",
    "accentColor",
    "backgroundColor",
    "textColor",
  ],
};
