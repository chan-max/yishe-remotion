import { z } from "zod";
import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { zColor } from "@remotion/zod-types";

export const textSlideSchema = z.object({
    text: z.string(),
    fontSize: z.number(),
    backgroundColor: zColor(),
    textColor: zColor(),
});

export const TextSlide: React.FC<z.infer<typeof textSlideSchema>> = ({
    text,
    fontSize,
    backgroundColor,
    textColor,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height, durationInFrames } = useVideoConfig();

    // 简单的文本进入动画
    const spr = spring({
        frame,
        fps,
        config: {
            damping: 12,
        },
    });

    // 这里的动画会根据 Composition 的宽度动态调整位移
    const translateY = interpolate(spr, [0, 1], [height / 4, 0]);
    const opacity = interpolate(spr, [0, 1], [0, 1]);

    return (
        <AbsoluteFill
            style={{
                backgroundColor,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    color: textColor,
                    fontSize,
                    fontWeight: "bold",
                    textAlign: "center",
                    fontFamily: "sans-serif",
                    transform: `translateY(${translateY}px)`,
                    opacity,
                    padding: "0 40px",
                    wordBreak: "break-word",
                }}
            >
                {text}
            </div>

            {/* 底部显示当前视频的规格信息（调试用） */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                color: textColor,
                opacity: 0.5,
                fontSize: 20
            }}>
                规格: {width}x{height} | 时长: {(durationInFrames / fps).toFixed(1)}s
            </div>
        </AbsoluteFill>
    );
};
