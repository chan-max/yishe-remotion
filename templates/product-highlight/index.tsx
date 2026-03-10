import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const productHighlightSchema = z.object({
  productName: z.string(),
  slogan: z.string(),
  accentColor: zColor(),
  backgroundColor: zColor(),
  textColor: zColor(),
});

export const ProductHighlight: React.FC<
  z.infer<typeof productHighlightSchema>
> = ({ productName, slogan, accentColor, backgroundColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
    },
  });

  const width = interpolate(pulse, [0, 1], [140, 860]);
  const titleOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        color: textColor,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width,
          height: 10,
          backgroundColor: accentColor,
          borderRadius: 999,
          marginBottom: 50,
        }}
      />
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          opacity: titleOpacity,
          marginBottom: 24,
          letterSpacing: 1,
        }}
      >
        {productName}
      </div>
      <div
        style={{
          fontSize: 52,
          opacity: 0.9,
        }}
      >
        {slogan}
      </div>
    </AbsoluteFill>
  );
};
