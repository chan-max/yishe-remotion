/* eslint-env node */

module.exports = {
  id: "zoom-pulse",
  name: "Zoom Pulse",
  description: "图片缓慢缩放律动效果",
  compositionId: "ZoomPulse",
  durationInFrames: 240,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultInputProps: {
    imageUrl:
      "https://images.pexels.com/photos/1726310/pexels-photo-1726310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    minScale: 1,
    maxScale: 1.1,
  },
  assetSummary: "1张图片, 2个数值参数",
  assets: [
    { key: "imageUrl", type: "image", label: "图片资源" },
    { key: "minScale", type: "number", label: "最小缩放比" },
    { key: "maxScale", type: "number", label: "最大缩放比" },
  ],
  editableFields: ["imageUrl", "minScale", "maxScale"],
};
