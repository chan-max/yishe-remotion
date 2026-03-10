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
  editableFields: ["imageUrl", "minScale", "maxScale"],
};
