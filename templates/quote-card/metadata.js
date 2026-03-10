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
  },
  assetSummary: "2段文字, 2个颜色控制",
  assets: [
    { key: "quote", type: "text", label: "金句内容" },
    { key: "author", type: "text", label: "作者/来源" },
    { key: "backgroundColor", type: "color", label: "背景颜色" },
    { key: "textColor", type: "color", label: "文字颜色" },
  ],
  editableFields: ["quote", "author", "backgroundColor", "textColor"],
};
