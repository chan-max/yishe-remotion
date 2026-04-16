import fs from "node:fs";
import path from "node:path";

const EXECUTABLE_NAMES = new Set(["bun", "bun.exe", "node", "node.exe"]);

const getPackagedAppRoot = () => {
  const candidates = [process.argv0, process.execPath].filter(Boolean);

  for (const executablePath of candidates) {
    const executableName = path.basename(executablePath).toLowerCase();
    if (EXECUTABLE_NAMES.has(executableName)) {
      continue;
    }

    const appRoot = path.join(path.dirname(executablePath), "app");
    if (fs.existsSync(appRoot)) {
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
  const rendersDir = path.join(appRoot, "renders");
  const uiDir = path.join(appRoot, "ui");
  const buildDir = path.join(appRoot, "build");
  const browserRoot = path.join(appRoot, "browser");
  const binariesDir = path.join(appRoot, "binaries");

  const browserExecutable = findFirstMatchingFile(browserRoot, [
    "chrome-headless-shell.exe",
    "chrome-headless-shell",
    "chrome.exe",
    "chrome",
  ]);

  return {
    appRoot,
    rendersDir,
    uiDir,
    buildDir,
    browserRoot,
    browserExecutable,
    binariesDir: fs.existsSync(binariesDir) ? binariesDir : null,
  };
};

export const ensureRuntimeDirectories = () => {
  const paths = getRuntimePaths();
  fs.mkdirSync(paths.rendersDir, { recursive: true });
  return paths;
};
