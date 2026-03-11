import { Composition } from "remotion";
import React from "react";

/**
 * 动态加载 templates 目录下的所有模板
 * 使用 Webpack 的 require.context 自动扫描文件夹
 */
// @ts-ignore
const metadataContext = require.context("../templates", true, /metadata\.js$/);
// @ts-ignore
const componentContext = require.context("../templates", true, /index\.tsx$/);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {metadataContext.keys().map((key: string) => {
        const metadata = metadataContext(key);
        // key 格式如 './quote-card/metadata.js'
        const componentKey = key.replace("metadata.js", "index.tsx");

        try {
          const componentModule = componentContext(componentKey);
          const compositionId = metadata.compositionId;
          const Component = componentModule[compositionId];

          // 自动匹配 Schema：compositionId 首字母小写 + "Schema"
          const schemaName =
            compositionId.charAt(0).toLowerCase() +
            compositionId.slice(1) +
            "Schema";
          const schema = componentModule[schemaName];

          if (!Component) {
            console.warn(
              `[RemotionRoot] 在 ${componentKey} 中找不到组件 "${compositionId}"`,
            );
            return null;
          }

          return (
            <Composition
              key={metadata.id}
              id={compositionId}
              component={Component}
              // 增强：增加“提前钩子”支持
              calculateMetadata={async ({ props }: { props: any }) => {
                // 1. 默认的元数据计算逻辑
                const defaultMetadata = {
                  durationInFrames: Number(
                    props.durationInFrames || metadata.durationInFrames || 240,
                  ),
                  fps: Number(props.fps || metadata.fps || 30),
                  width: Number(props.width || metadata.width || 1080),
                  height: Number(props.height || metadata.height || 1920),
                  props, // 默认透传所有的 props
                };

                // 2. 如果 metadata.js 里定义了 calculateMetadata 钩子，则执行它
                if (typeof metadata.calculateMetadata === "function") {
                  const customMetadata = await metadata.calculateMetadata({
                    props,
                    defaultMetadata,
                  });
                  return {
                    ...defaultMetadata,
                    ...customMetadata,
                  };
                }

                return defaultMetadata;
              }}
              schema={schema}
              defaultProps={metadata.defaultInputProps}
            />
          );
        } catch (e) {
          console.error(`[RemotionRoot] 加载模板 ${key} 出错:`, e);
          return null;
        }
      })}
    </>
  );
};
