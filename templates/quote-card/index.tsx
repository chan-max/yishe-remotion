import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const quoteCardSchema = z.object({
  quote: z.string(),
  author: z.string(),
  backgroundColor: zColor(),
  textColor: zColor(),
});

export const QuoteCard: React.FC<z.infer<typeof quoteCardSchema>> = ({
  quote,
  author,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
      mass: 0.9,
    },
  });

  const translateY = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        padding: 96,
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          opacity,
          width: "100%",
          maxWidth: 900,
          color: textColor,
          textAlign: "center",
          lineHeight: 1.35,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          "{quote}"
        </div>
        <div
          style={{
            fontSize: 42,
            opacity: 0.85,
          }}
        >
          — {author}
        </div>
      </div>
    </AbsoluteFill>
  );
};
