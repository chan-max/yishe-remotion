import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ensureBrowser } from "@remotion/renderer";

const root = process.cwd();
const releaseRoot = path.join(root, "release");
const appDir = path.join(releaseRoot, "app");
const platform = process.platform;
const executableName = platform === "win32" ? "yishe-remotion.exe" : "yishe-remotion";
const executableOutfile = path.join(releaseRoot, executableName);

const removeIfExists = async (targetPath: string) => {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
};

const copyDir = async (source: string, target: string) => {
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.cp(source, target, { recursive: true, force: true });
};

const ensureDir = async (target: string) => {
  await fs.promises.mkdir(target, { recursive: true });
};

const runBun = (args: string[]) => {
  execFileSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
};

const getCompositorPackageDir = () => {
  switch (platform) {
    case "win32":
      if (process.arch !== "x64") {
        throw new Error(`Windows only supports x64 right now, current arch: ${process.arch}`);
      }
      return path.dirname(require.resolve("@remotion/compositor-win32-x64-msvc/package.json"));
    case "darwin":
      if (process.arch === "arm64") {
        return path.dirname(require.resolve("@remotion/compositor-darwin-arm64/package.json"));
      }
      if (process.arch === "x64") {
        return path.dirname(require.resolve("@remotion/compositor-darwin-x64/package.json"));
      }
      throw new Error(`Unsupported macOS arch: ${process.arch}`);
    default:
      throw new Error(`Portable packaging is only scripted for Windows/macOS, current platform: ${platform}`);
  }
};

const main = async () => {
  console.log("Preparing browser assets...");
  await ensureBrowser({ logLevel: "info" });
  const browserCacheRoot = path.join(root, "node_modules", ".remotion");

  console.log("Building Remotion bundle...");
  runBun(["x", "remotion", "bundle"]);

  console.log("Creating portable executable...");
  await removeIfExists(releaseRoot);
  await ensureDir(appDir);
  runBun([
    "build",
    "--compile",
    "./server/index.ts",
    "--external",
    "@remotion/bundler",
    "--external",
    "@remotion/cli",
    "--external",
    "@remotion/studio",
    "--external",
    "@remotion/web-renderer",
    "--outfile",
    executableOutfile,
  ]);

  console.log("Copying application assets...");
  await copyDir(path.join(root, "ui"), path.join(appDir, "ui"));
  await copyDir(path.join(root, "build"), path.join(appDir, "build"));
  await copyDir(path.join(root, "templates"), path.join(appDir, "templates"));
  await copyDir(path.join(root, "downloads"), path.join(appDir, "downloads"));
  await copyDir(path.join(root, "renders"), path.join(appDir, "renders"));
  await copyDir(browserCacheRoot, path.join(appDir, "browser"));
  await copyDir(getCompositorPackageDir(), path.join(appDir, "binaries"));

  console.log(`Portable release ready: ${releaseRoot}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
