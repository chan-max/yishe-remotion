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
  editableFields: [
    "productName",
    "slogan",
    "accentColor",
    "backgroundColor",
    "textColor",
  ],
};
