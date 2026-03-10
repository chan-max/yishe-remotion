/* eslint-env node */

const fs = require("node:fs");
const path = require("node:path");

/**
 * 自动加载 templates 目录下所有模板的 metadata.js
 */
function loadTemplates() {
  const templatesDir = __dirname;
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });

  const templates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const metadataPath = path.join(templatesDir, entry.name, "metadata.js");
    if (fs.existsSync(metadataPath)) {
      delete require.cache[require.resolve(metadataPath)];
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const metadata = require(metadataPath);
      templates.push(metadata);
    }
  }

  return templates;
}

module.exports = {
  loadTemplates,
};
