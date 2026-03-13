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
    // 更详细的前端可用参数描述，前端表单可优先使用 inputSchema
    inputSchema: [
        {
            key: 'text',
            type: 'text',
            label: '文本内容',
            description: '用于显示的主文本；支持换行与简单的换行符。',
            required: true,
            placeholder: '例如：欢迎使用动态模板',
            example: 'Hello Remotion World'
        },
        {
            key: 'fontSize',
            type: 'number',
            label: '字号',
            description: '文本的像素字号，影响布局与换行。',
            required: false,
            min: 8,
            max: 1000,
            example: 80
        },
        {
            key: 'backgroundColor',
            type: 'color',
            label: '背景颜色',
            description: '页面背景颜色，推荐使用 6 位 HEX 值。',
            required: false,
            example: '#4f46e5'
        },
        {
            key: 'textColor',
            type: 'color',
            label: '文字颜色',
            description: '文本颜色，建议与背景有足够对比度。',
            required: false,
            example: '#ffffff'
        },
        {
            key: 'width',
            type: 'number',
            label: '视频宽度',
            description: '输出视频宽度(px)。前端可用于切换比例预设（如 1920x1080/1080x1920）。',
            required: false,
            min: 160,
            max: 3840,
            example: 1920
        },
        {
            key: 'height',
            type: 'number',
            label: '视频高度',
            description: '输出视频高度(px)。',
            required: false,
            min: 160,
            max: 3840,
            example: 1080
        },
        {
            key: 'durationInFrames',
            type: 'number',
            label: '总帧数',
            description: '视频总帧数，配合 fps 决定时长；默认 150 帧 (5 秒 @30fps)。',
            required: false,
            min: 1,
            max: 10000,
            example: 150
        }
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
