/* eslint-env node */

module.exports = {
    id: "text-slide",
    name: "Text Slide",
    description: "全能文本幻灯片，支持自定义尺寸和时长",
    compositionId: "TextSlide",
    // 默认元数据
    durationInFrames: 150,
    fps: 30,
    width: 1920,
    height: 1080,
    defaultInputProps: {
        text: "欢迎使用动态模板",
        fontSize: 80,
        backgroundColor: "#4f46e5",
        textColor: "#ffffff",
        width: 1920,
        height: 1080,
        durationInFrames: 150,
    },
    assetSummary: "自定义文字及全动态比例支持",
    assets: [
        { key: "text", type: "text", label: "文本内容" },
        { key: "fontSize", type: "number", label: "字号" },
        { key: "backgroundColor", type: "color", label: "背景颜色" },
        { key: "textColor", type: "color", label: "文字颜色" },
        { key: "width", type: "number", label: "视频宽度" },
        { key: "height", type: "number", label: "视频高度" },
        { key: "durationInFrames", type: "number", label: "总帧数" },
    ],
    editableFields: [
        "text",
        "fontSize",
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
 * 1. 文字幻灯片 (5秒):
 * {
 *   "templateId": "text-slide",
 *   "inputProps": {
 *     "text": "Hello Remotion World",
 *     "durationInFrames": 150
 *   }
 * }
 * 
 * 2. 特大标题 (2秒快闪):
 * {
 *   "templateId": "text-slide",
 *   "inputProps": {
 *     "text": "WOW!",
 *     "fontSize": 300,
 *     "backgroundColor": "#000000",
 *     "durationInFrames": 60
 *   }
 * }
 */
