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
  editableFields: ["quote", "author", "backgroundColor", "textColor"],
};
