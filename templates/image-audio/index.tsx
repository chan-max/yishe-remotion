import { z } from "zod";
import React from "react";
import { AbsoluteFill, Img, Audio, useCurrentFrame, useVideoConfig } from "remotion";

export const imageAudioSchema = z.object({
  image: z.string(),
  audio: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  audioDuration: z.number().optional(),
  durationInFrames: z.number().optional(),
});

export const ImageAudio: React.FC<z.infer<typeof imageAudioSchema>> = ({
  image,
  audio,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 简单的淡入效果
  const opacity = Math.min(1, Math.max(0, (frame + 1) / 15));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {audio ? <Audio src={audio} /> : null}

      {image ? (
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity,
            transform: "translateZ(0)",
          }}
        />
      ) : (
        <div style={{ color: "#fff" }}>No image provided</div>
      )}

      {/* 进度条（底部） */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          height: 6,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / Math.max(1, durationInFrames)) * 100}%`,
            background: "rgba(255,255,255,0.9)",
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
