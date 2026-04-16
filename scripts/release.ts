import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureBrowser } from "@remotion/renderer";

const root = process.cwd();
const releaseRoot = path.join(root, "release");
const stageRoot = path.join(releaseRoot, "stage");
const distRoot = path.join(releaseRoot, "dist");
const bundleRoot = path.join(stageRoot, "app");
const artifactsRoot = path.join(distRoot, "artifacts");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as { version: string };

const productName = "yishe-video-tool";
const displayName = "Yishe Video Tool";
const platform = process.platform;
const executableName = platform === "win32" ? `${productName}.exe` : productName;
const compiledExecutable = path.join(stageRoot, executableName);
const version = process.env.RELEASE_VERSION ?? packageJson.version;
const releaseTag = process.env.GITHUB_REF_NAME ?? `v${version}`;

const removeIfExists = async (targetPath: string) => {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
};

const escapeForNsis = (value: string) => {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

const ensureDir = async (targetPath: string) => {
  await fs.promises.mkdir(targetPath, { recursive: true });
};

const copyDir = async (source: string, target: string) => {
  if (!fs.existsSync(source)) {
    return;
  }

  await ensureDir(path.dirname(target));
  await fs.promises.cp(source, target, { recursive: true, force: true });
};

const copyFile = async (source: string, target: string) => {
  await ensureDir(path.dirname(target));
  await fs.promises.copyFile(source, target);
};

const runCommand = (command: string, args: string[]) => {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
  });
};

const runBun = (args: string[]) => {
  runCommand(process.execPath, args);
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
      throw new Error(`Installer packaging is only scripted for Windows/macOS, current platform: ${platform}`);
  }
};

const getReleaseFileName = (extension: string) => {
  const platformName = platform === "win32" ? "windows-x64" : `macos-${process.arch}`;
  return `${productName}-${releaseTag}-${platformName}${extension}`;
};

const stageRuntimeAssets = async () => {
  console.log("Preparing browser assets...");
  await ensureBrowser({ logLevel: "info" });

  console.log("Building Remotion bundle...");
  runBun(["x", "remotion", "bundle"]);

  console.log("Compiling application executable...");
  await removeIfExists(releaseRoot);
  await ensureDir(bundleRoot);
  await ensureDir(artifactsRoot);

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
    compiledExecutable,
  ]);

  const browserCacheRoot = path.join(root, "node_modules", ".remotion");

  console.log("Copying packaged resources...");
  await copyDir(path.join(root, "ui"), path.join(bundleRoot, "ui"));
  await copyDir(path.join(root, "build"), path.join(bundleRoot, "build"));
  await copyDir(path.join(root, "templates"), path.join(bundleRoot, "templates"));
  await copyDir(browserCacheRoot, path.join(bundleRoot, "browser"));
  await copyDir(getCompositorPackageDir(), path.join(bundleRoot, "binaries"));
  await copyDir(
    path.join(root, "node_modules", "fomantic-ui-css"),
    path.join(bundleRoot, "assets", "fomantic-ui-css"),
  );
};

const buildWindowsInstaller = async () => {
  const installRoot = path.join(stageRoot, "windows-installer");
  await ensureDir(installRoot);

  await copyFile(compiledExecutable, path.join(installRoot, executableName));
  await copyDir(bundleRoot, path.join(installRoot, "app"));

  const nsisScriptPath = path.join(stageRoot, "windows-installer.nsi");
  const installerOutfile = path.join(artifactsRoot, getReleaseFileName("-setup.exe"));
  const escapedInstallRoot = escapeForNsis(installRoot);
  const escapedOutput = escapeForNsis(installerOutfile);
  const escapedDisplayName = escapeForNsis(displayName);
  const escapedVersion = escapeForNsis(version);

  const script = `
Unicode true
!include "MUI2.nsh"
!define PRODUCT_NAME "${escapedDisplayName}"
!define PRODUCT_EXE "${executableName}"
!define PRODUCT_VERSION "${escapedVersion}"
!define SOURCE_DIR "${escapedInstallRoot}"
!define OUTPUT_FILE "${escapedOutput}"

Name "\${PRODUCT_NAME}"
OutFile "\${OUTPUT_FILE}"
InstallDir "$PROGRAMFILES64\\${productName}"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "\${SOURCE_DIR}\\*"
  CreateDirectory "$SMPROGRAMS\\${productName}"
  CreateShortcut "$SMPROGRAMS\\${productName}\\${escapedDisplayName}.lnk" "$INSTDIR\\${executableName}"
  CreateShortcut "$DESKTOP\\${escapedDisplayName}.lnk" "$INSTDIR\\${executableName}"
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${productName}" "DisplayName" "${escapedDisplayName}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${productName}" "DisplayVersion" "${escapedVersion}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${productName}" "Publisher" "Yishe"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${productName}" "UninstallString" "$INSTDIR\\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\\${escapedDisplayName}.lnk"
  Delete "$SMPROGRAMS\\${productName}\\${escapedDisplayName}.lnk"
  RMDir "$SMPROGRAMS\\${productName}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${productName}"
SectionEnd
`.trim();

  await fs.promises.writeFile(nsisScriptPath, script, "utf8");
  runCommand("makensis", [nsisScriptPath]);
};

const buildMacInstaller = async () => {
  const appBundleRoot = path.join(stageRoot, `${displayName}.app`);
  const contentsDir = path.join(appBundleRoot, "Contents");
  const macOsDir = path.join(contentsDir, "MacOS");
  const resourcesDir = path.join(contentsDir, "Resources");
  const bundledAppRoot = path.join(resourcesDir, "app");

  await ensureDir(macOsDir);
  await ensureDir(resourcesDir);

  await copyFile(compiledExecutable, path.join(macOsDir, productName));
  await copyDir(bundleRoot, bundledAppRoot);
  runCommand("chmod", ["+x", path.join(macOsDir, productName)]);

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>${displayName}</string>
  <key>CFBundleExecutable</key>
  <string>${productName}</string>
  <key>CFBundleIdentifier</key>
  <string>com.yishe.${productName}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${displayName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleVersion</key>
  <string>${version}</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
</dict>
</plist>
`;
  await fs.promises.writeFile(path.join(contentsDir, "Info.plist"), plistContent, "utf8");

  const dmgStageRoot = path.join(stageRoot, "mac-dmg");
  await ensureDir(dmgStageRoot);
  await copyDir(appBundleRoot, path.join(dmgStageRoot, `${displayName}.app`));

  const applicationsLink = path.join(dmgStageRoot, "Applications");
  if (!fs.existsSync(applicationsLink)) {
    fs.symlinkSync("/Applications", applicationsLink);
  }

  const dmgOutfile = path.join(artifactsRoot, getReleaseFileName(".dmg"));
  const tempDmg = path.join(os.tmpdir(), `${productName}-${Date.now()}.dmg`);

  runCommand("hdiutil", [
    "create",
    "-volname",
    displayName,
    "-srcfolder",
    dmgStageRoot,
    "-ov",
    "-format",
    "UDZO",
    tempDmg,
  ]);

  await copyFile(tempDmg, dmgOutfile);
  await removeIfExists(tempDmg);
};

const main = async () => {
  await stageRuntimeAssets();

  if (platform === "win32") {
    console.log("Building Windows installer...");
    await buildWindowsInstaller();
  } else if (platform === "darwin") {
    console.log("Building macOS installer...");
    await buildMacInstaller();
  } else {
    throw new Error(`Unsupported platform for installer build: ${platform}`);
  }

  console.log(`Installer artifacts ready: ${artifactsRoot}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
