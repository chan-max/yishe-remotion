/* eslint-env node */

const templates = [
  {
    id: "hello-world",
    name: "Hello World",
    description: "品牌开场标题动画",
    compositionId: "HelloWorld",
    durationInFrames: 180,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultInputProps: {
      titleText: "Render Server Template",
      titleColor: "#000000",
      logoColor1: "#91EAE4",
      logoColor2: "#86A8E7",
    },
    editableFields: ["titleText", "titleColor", "logoColor1", "logoColor2"],
  },
  {
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
    },
    editableFields: ["quote", "author", "backgroundColor", "textColor"],
  },
  {
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
  },
];

module.exports = {
  templates,
};
