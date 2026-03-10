import { Composition } from "remotion";
import { QuoteCard, quoteCardSchema } from "../templates/quote-card";
import {
  ProductHighlight,
  productHighlightSchema,
} from "../templates/product-highlight";
import { ZoomPulse, zoomPulseSchema } from "../templates/zoom-pulse";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuoteCard"
        component={QuoteCard}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        schema={quoteCardSchema}
        defaultProps={{
          quote: "好内容值得被看见",
          author: "Yishe",
          backgroundColor: "#111827",
          textColor: "#F9FAFB",
        }}
      />
      <Composition
        id="ProductHighlight"
        component={ProductHighlight}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
        schema={productHighlightSchema}
        defaultProps={{
          productName: "Remotion API",
          slogan: "一键生成品牌视频",
          accentColor: "#22C55E",
          backgroundColor: "#0F172A",
          textColor: "#E2E8F0",
        }}
      />
      <Composition
        id="ZoomPulse"
        component={ZoomPulse}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        schema={zoomPulseSchema}
        defaultProps={{
          imageUrl:
            "https://images.pexels.com/photos/1726310/pexels-photo-1726310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
          minScale: 1,
          maxScale: 1.1,
        }}
      />
    </>
  );
};
