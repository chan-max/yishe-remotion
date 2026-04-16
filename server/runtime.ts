import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const EXECUTABLE_NAMES = new Set(["bun", "bun.exe", "node", "node.exe"]);
const PRODUCT_NAME = "yishe-video-tool";

const resolvePackagedAppRoot = (executablePath: string) => {
  const siblingAppRoot = path.join(path.dirname(executablePath), "app");
  if (fs.existsSync(siblingAppRoot)) {
    return siblingAppRoot;
  }

  const macResourcesAppRoot = path.join(
    path.dirname(executablePath),
    "..",
    "Resources",
    "app",
  );
  if (fs.existsSync(macResourcesAppRoot)) {
    return path.resolve(macResourcesAppRoot);
  }

  return null;
};

const getWritableDataRoot = () => {
  if (process.platform === "win32") {
    const appDataRoot = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    return path.join(appDataRoot, PRODUCT_NAME);
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", PRODUCT_NAME);
  }

  return path.join(os.homedir(), `.${PRODUCT_NAME}`);
};

const getPackagedAppRoot = () => {
  const candidates = [process.argv0, process.execPath].filter(Boolean);

  for (const executablePath of candidates) {
    const executableName = path.basename(executablePath).toLowerCase();
    if (EXECUTABLE_NAMES.has(executableName)) {
      continue;
    }

    const appRoot = resolvePackagedAppRoot(executablePath);
    if (appRoot && fs.existsSync(appRoot)) {
      return appRoot;
    }
  }

  return null;
};

export const isPackagedRuntime = () => {
  return getPackagedAppRoot() !== null;
};

export const getAppRoot = () => {
  const packagedAppRoot = getPackagedAppRoot();
  if (packagedAppRoot) {
    return packagedAppRoot;
  }

  return process.cwd();
};

const findFirstMatchingFile = (rootDir: string, fileNames: string[]) => {
  if (!fs.existsSync(rootDir)) {
    return null;
  }

  const queue = [rootDir];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    if (!currentDir) {
      continue;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (fileNames.includes(entry.name.toLowerCase())) {
        return fullPath;
      }
    }
  }

  return null;
};

export const getRuntimePaths = () => {
  const appRoot = getAppRoot();
  const uiDir = path.join(appRoot, "ui");
  const buildDir = path.join(appRoot, "build");
  const browserRoot = path.join(appRoot, "browser");
  const binariesDir = path.join(appRoot, "binaries");
  const assetsRoot = path.join(appRoot, "assets");
  const isPackaged = isPackagedRuntime();
  const dataRoot = isPackaged ? getWritableDataRoot() : appRoot;
  const rendersDir = path.join(dataRoot, "renders");
  const downloadsDir = path.join(dataRoot, "downloads");
  const semanticDir = path.join(assetsRoot, "fomantic-ui-css");

  const browserExecutable = findFirstMatchingFile(browserRoot, [
    "chrome-headless-shell.exe",
    "chrome-headless-shell",
    "chrome.exe",
    "chrome",
  ]);

  return {
    appRoot,
    assetsRoot,
    dataRoot,
    rendersDir,
    downloadsDir,
    uiDir,
    buildDir,
    browserRoot,
    browserExecutable,
    semanticDir: fs.existsSync(semanticDir) ? semanticDir : null,
    binariesDir: fs.existsSync(binariesDir) ? binariesDir : null,
  };
};

export const ensureRuntimeDirectories = () => {
  const paths = getRuntimePaths();
  fs.mkdirSync(paths.dataRoot, { recursive: true });
  fs.mkdirSync(paths.rendersDir, { recursive: true });
  fs.mkdirSync(paths.downloadsDir, { recursive: true });
  return paths;
};
