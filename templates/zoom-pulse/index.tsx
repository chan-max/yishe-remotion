import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

export const zoomPulseSchema = z.object({
  imageUrl: z.string().url(),
  minScale: z.number().min(0.5).max(2),
  maxScale: z.number().min(0.5).max(3),
});

export const ZoomPulse: React.FC<z.infer<typeof zoomPulseSchema>> = ({
  imageUrl,
  minScale,
  maxScale,
}) => {
  const frame = useCurrentFrame();
  const progress = (frame % 120) / 120;
  const scale = interpolate(progress, [0, 0.5, 1], [minScale, maxScale, minScale]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};
