/* eslint-env node */

module.exports = {
  id: "image-audio",
  name: "Image + Audio",
  description: "使用一张图片与一段音频生成视频（图片静帧，音频伴随）",
  compositionId: "ImageAudio",
  // 默认元数据
  durationInFrames: 300,
  fps: 30,
  width: 1080,
  height: 1920,
  defaultInputProps: {
    image: "",
    audio: "",
    width: 1080,
    height: 1920,
    audioDuration: 10,
    durationInFrames: 300,
    fps: 30,
  },
  assetSummary: "输入图片 + 音频，按音频时长生成视频",
  assets: [
    { key: "image", type: "asset", label: "图片 URL 或 本地路径" },
    { key: "audio", type: "asset", label: "音频 MP3 URL 或 本地路径" },
    { key: "width", type: "number", label: "视频宽度" },
    { key: "height", type: "number", label: "视频高度" },
    { key: "audioDuration", type: "number", label: "音频时长(秒)" },
    { key: "durationInFrames", type: "number", label: "总帧数(可由 audioDuration 自动计算)" },
  ],
  editableFields: ["image", "audio", "width", "height", "audioDuration", "durationInFrames"],

  inputSchema: [
    {
      key: 'image',
      type: 'asset',
      label: '图片',
      description: '封面图片 URL 或 COS 路径，支持 https:// 或 data: URI。优先使用宽高匹配的视频尺寸。',
      required: true,
      placeholder: 'https://example.com/photo.jpg',
      example: 'https://example.com/photo.jpg'
    },
    {
      key: 'audio',
      type: 'asset',
      label: '音频',
      description: '音频文件 URL（MP3 等），如果未提供 audioDuration，模板会尽量读取音频实际时长。',
      required: true,
      placeholder: 'https://example.com/music.mp3',
      example: 'https://example.com/music.mp3'
    },
    {
      key: 'audioDuration',
      type: 'number',
      label: '音频时长（秒）',
      description: '可选，若提供则按此时长计算总帧数；否则尝试从音频文件读取时长。',
      required: false,
      min: 0,
      example: 12
    },
    {
      key: 'width',
      type: 'number',
      label: '视频宽度(px)',
      description: '输出宽度，若留空使用模板默认',
      required: false,
      example: 1080
    },
    {
      key: 'height',
      type: 'number',
      label: '视频高度(px)',
      description: '输出高度，若留空使用模板默认',
      required: false,
      example: 1920
    },
    {
      key: 'durationInFrames',
      type: 'number',
      label: '总帧数',
      description: '可由 audioDuration 与 fps 计算得到，一般不需手动设置',
      required: false,
      example: 300
    }
  ],

  // 如果传入 audioDuration，则按 audioDuration 与 fps 计算总帧数
  calculateMetadata({ props, defaultMetadata }) {
    const fps = Number(props.fps || defaultMetadata.fps || 30);
    const audioDur = Number(props.audioDuration || 0);
    const durationInFrames = audioDur > 0 ? Math.round(audioDur * fps) : Number(props.durationInFrames || defaultMetadata.durationInFrames);
    const width = Number(props.width || defaultMetadata.width || 1080);
    const height = Number(props.height || defaultMetadata.height || 1920);

    return {
      durationInFrames,
      fps,
      width,
      height,
    };
  },
};

/**
 * 示例调用：
 * {
 *   "templateId": "image-audio",
 *   "inputProps": {
 *     "image": "https://example.com/photo.jpg",
 *     "audio": "https://example.com/music.mp3",
 *     "audioDuration": 12,
 *     "width": 1080,
 *     "height": 1920
 *   }
 * }
 */
