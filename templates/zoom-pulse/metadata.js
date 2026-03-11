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
    width: 1920,
    height: 1080,
    durationInFrames: 240,
  },
  assetSummary: "1张图片, 2个数值参数, 全动态规格支持",
  assets: [
    { key: "imageUrl", type: "image", label: "图片资源" },
    { key: "minScale", type: "number", label: "最小缩放比" },
    { key: "maxScale", type: "number", label: "最大缩放比" },
    { key: "width", type: "number", label: "视频宽度" },
    { key: "height", type: "number", label: "视频高度" },
    { key: "durationInFrames", type: "number", label: "总帧数" },
  ],
  editableFields: [
    "imageUrl",
    "minScale",
    "maxScale",
    "width",
    "height",
    "durationInFrames",
  ],
};

/**
 * [参数实例 / API 调用参考]
 * 
 * 1. 默认律动展示:
 * {
 *   "templateId": "zoom-pulse",
 *   "inputProps": {
 *     "imageUrl": "https://example.com/photo.jpg"
 *   }
 * }
 * 
 * 2. 快速短视频卡点:
 * {
 *   "templateId": "zoom-pulse",
 *   "inputProps": {
 *     "imageUrl": "https://example.com/fast.jpg",
 *     "minScale": 1.2,
 *     "maxScale": 1.5,
 *     "durationInFrames": 60
 *   }
 * }
 */
