import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ensureBrowser } from "@remotion/renderer";

type DesktopPlatform = "windows" | "macos";
type DesktopArch = "x64" | "arm64";

type ReleaseTarget = {
  platform: DesktopPlatform;
  arch: DesktopArch;
  slug: string;
  installerStableSuffix: string;
  installerVersionedSuffix: string;
};

type RuntimeAssetSnapshot = {
  browserExecutableRelativePath: string;
  compositorRootRelativePath: string;
  ffmpegRelativePath: string;
  ffprobeRelativePath: string;
};

type AliasedArtifact = {
  kind: "installer" | "plugin-bundle" | "manifest" | "checksums";
  sizeBytes: number;
  sha256: string;
  stableFileName: string;
  stablePath: string;
  versionedFileName: string;
  versionedPath: string;
};

const root = process.cwd();
const releaseRoot = path.join(root, "release");
const stageRoot = path.join(releaseRoot, "stage");
const distRoot = path.join(releaseRoot, "dist");
const bundleRoot = path.join(stageRoot, "app");
const pluginRuntimeStageRoot = path.join(stageRoot, "plugin-runtime");
const artifactsRoot = path.join(distRoot, "artifacts");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as { version: string };

const productName = "yishe-video-tool";
const displayName = "Yishe Video Tool";
const pluginName = "yishe-remotion";
const version = process.env.RELEASE_VERSION ?? packageJson.version;
const releaseTag = process.env.RELEASE_TAG ?? `v${version}`;
const repository = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : null;

const executableName =
  process.platform === "win32" ? `${productName}.exe` : productName;
const compiledExecutable = path.join(stageRoot, executableName);
const pluginExecutableName =
  process.platform === "win32" ? `${pluginName}.exe` : pluginName;

const removeIfExists = async (targetPath: string) => {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
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

const createZipFromDirectory = async (
  sourceDir: string,
  zipPath: string,
) => {
  await removeIfExists(zipPath);

  if (process.platform === "win32") {
    runCommand("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Compress-Archive -LiteralPath '${sourceDir.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
    ]);
    return;
  }

  runCommand("ditto", ["-c", "-k", "--keepParent", sourceDir, zipPath]);
};

const resolveCommandPath = (command: string) => {
  const lookupCommand = process.platform === "win32" ? "where.exe" : "which";

  try {
    const output = execFileSync(lookupCommand, [command], {
      cwd: root,
      stdio: "pipe",
      encoding: "utf8",
    });

    const resolvedPath = String(output || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    return resolvedPath || null;
  } catch {
    return null;
  }
};

const resolveWindowsMakensis = () => {
  if (process.platform !== "win32") {
    return "makensis";
  }

  const envPath = process.env.MAKENSIS_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const nsisHome = process.env.NSIS_HOME;
  if (nsisHome) {
    const nsisHomeBinary = path.join(nsisHome, "makensis.exe");
    if (fs.existsSync(nsisHomeBinary)) {
      return nsisHomeBinary;
    }
  }

  const resolvedFromPath = resolveCommandPath("makensis");
  if (resolvedFromPath) {
    return resolvedFromPath;
  }

  const candidatePaths = [
    process.env["ProgramFiles(x86)"]
      ? path.join(process.env["ProgramFiles(x86)"], "NSIS", "makensis.exe")
      : null,
    process.env.ProgramFiles
      ? path.join(process.env.ProgramFiles, "NSIS", "makensis.exe")
      : null,
    process.env["ChocolateyInstall"]
      ? path.join(
          process.env["ChocolateyInstall"],
          "bin",
          "makensis.exe",
        )
      : null,
    process.env["ChocolateyInstall"]
      ? path.join(
          process.env["ChocolateyInstall"],
          "lib",
          "nsis",
          "tools",
          "makensis.exe",
        )
      : null,
    "C:\\ProgramData\\chocolatey\\bin\\makensis.exe",
    "C:\\ProgramData\\chocolatey\\lib\\nsis\\tools\\makensis.exe",
  ].filter((candidate): candidate is string => Boolean(candidate));

  const resolvedCandidate = candidatePaths.find((candidate) =>
    fs.existsSync(candidate),
  );
  if (resolvedCandidate) {
    return resolvedCandidate;
  }

  throw new Error(
    [
      "NSIS is required to build the Windows installer, but makensis.exe could not be found.",
      "Install NSIS and make sure makensis is on PATH, or set MAKENSIS_PATH / NSIS_HOME.",
      "For GitHub Actions Windows runners, install NSIS and export its directory through GITHUB_PATH.",
    ].join(" "),
  );
};

const escapeForNsis = (value: string) => {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

const findFirstMatchingFile = (rootDir: string, fileNames: string[]) => {
  if (!fs.existsSync(rootDir)) {
    return null;
  }

  const normalizedNames = new Set(
    fileNames.map((fileName) => fileName.toLowerCase()),
  );
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

      if (normalizedNames.has(entry.name.toLowerCase())) {
        return fullPath;
      }
    }
  }

  return null;
};

const relativeToBundleRoot = (absolutePath: string) => {
  return path.relative(bundleRoot, absolutePath).replace(/\\/g, "/");
};

const sha256File = async (targetPath: string) => {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(targetPath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};

const createAliasedArtifact = async ({
  kind,
  sourcePath,
  stableFileName,
  versionedFileName,
}: {
  kind: AliasedArtifact["kind"];
  sourcePath: string;
  stableFileName: string;
  versionedFileName: string;
}) => {
  const versionedPath = path.join(artifactsRoot, versionedFileName);
  const stablePath = path.join(artifactsRoot, stableFileName);

  await copyFile(sourcePath, versionedPath);
  await copyFile(sourcePath, stablePath);

  const stats = await fs.promises.stat(sourcePath);
  const sha256 = await sha256File(sourcePath);

  return {
    kind,
    sizeBytes: stats.size,
    sha256,
    stableFileName,
    stablePath,
    versionedFileName,
    versionedPath,
  } satisfies AliasedArtifact;
};

const buildReleaseTarget = (): ReleaseTarget => {
  if (process.platform === "win32") {
    if (process.arch !== "x64") {
      throw new Error(
        `Windows only supports x64 right now, current arch: ${process.arch}`,
      );
    }

    return {
      platform: "windows",
      arch: "x64",
      slug: "windows-x64",
      installerStableSuffix: "windows-x64-setup.exe",
      installerVersionedSuffix: `${releaseTag}-windows-x64-setup.exe`,
    };
  }

  if (process.platform === "darwin") {
    if (process.arch !== "x64" && process.arch !== "arm64") {
      throw new Error(`Unsupported macOS arch: ${process.arch}`);
    }

    const arch = process.arch as DesktopArch;
    return {
      platform: "macos",
      arch,
      slug: `macos-${arch}`,
      installerStableSuffix: `macos-${arch}.dmg`,
      installerVersionedSuffix: `${releaseTag}-macos-${arch}.dmg`,
    };
  }

  throw new Error(
    `Installer packaging is only scripted for Windows/macOS, current platform: ${process.platform}`,
  );
};

const releaseTarget = buildReleaseTarget();

const getCompositorPackageDir = () => {
  switch (releaseTarget.platform) {
    case "windows":
      return path.dirname(
        require.resolve("@remotion/compositor-win32-x64-msvc/package.json"),
      );
    case "macos":
      if (releaseTarget.arch === "arm64") {
        return path.dirname(
          require.resolve("@remotion/compositor-darwin-arm64/package.json"),
        );
      }

      return path.dirname(
        require.resolve("@remotion/compositor-darwin-x64/package.json"),
      );
    default:
      throw new Error(`Unsupported release target: ${releaseTarget.platform}`);
  }
};

const stageRuntimeAssets = async () => {
  console.log("Preparing browser assets...");
  await ensureBrowser({ logLevel: "info" });

  console.log("Building Remotion bundle...");
  runBun(["x", "remotion", "bundle"]);

  console.log("Preparing desktop release stage...");
  await removeIfExists(releaseRoot);
  await ensureDir(bundleRoot);
  await ensureDir(pluginRuntimeStageRoot);
  await ensureDir(artifactsRoot);

  console.log("Compiling application executable...");
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

  console.log("Copying packaged runtime resources...");
  await copyDir(path.join(root, "ui"), path.join(bundleRoot, "ui"));
  await copyDir(path.join(root, "build"), path.join(bundleRoot, "build"));
  await copyDir(
    path.join(root, "templates"),
    path.join(bundleRoot, "templates"),
  );
  await copyDir(browserCacheRoot, path.join(bundleRoot, "browser"));
  await copyDir(getCompositorPackageDir(), path.join(bundleRoot, "binaries"));
  await copyDir(
    path.join(root, "node_modules", "fomantic-ui-css"),
    path.join(bundleRoot, "assets", "fomantic-ui-css"),
  );
};

const verifyBundledRuntimeAssets = () => {
  const browserExecutable = findFirstMatchingFile(
    path.join(bundleRoot, "browser"),
    [
      "chrome-headless-shell.exe",
      "chrome-headless-shell",
      "chrome.exe",
      "chrome",
    ],
  );
  const ffmpegPath = findFirstMatchingFile(path.join(bundleRoot, "binaries"), [
    "ffmpeg",
    "ffmpeg.exe",
  ]);
  const ffprobePath = findFirstMatchingFile(path.join(bundleRoot, "binaries"), [
    "ffprobe",
    "ffprobe.exe",
  ]);

  if (!browserExecutable) {
    throw new Error(
      "Bundled browser executable is missing from release payload",
    );
  }
  if (!ffmpegPath) {
    throw new Error(
      "Bundled ffmpeg executable is missing from release payload",
    );
  }
  if (!ffprobePath) {
    throw new Error(
      "Bundled ffprobe executable is missing from release payload",
    );
  }

  return {
    browserExecutableRelativePath: relativeToBundleRoot(browserExecutable),
    compositorRootRelativePath: "binaries",
    ffmpegRelativePath: relativeToBundleRoot(ffmpegPath),
    ffprobeRelativePath: relativeToBundleRoot(ffprobePath),
  } satisfies RuntimeAssetSnapshot;
};

const buildWindowsInstaller = async () => {
  const installRoot = path.join(stageRoot, "windows-installer");
  await ensureDir(installRoot);

  await copyFile(compiledExecutable, path.join(installRoot, executableName));
  await copyDir(bundleRoot, path.join(installRoot, "app"));

  const nsisScriptPath = path.join(stageRoot, "windows-installer.nsi");
  const installerStagePath = path.join(
    stageRoot,
    `${productName}-installer.exe`,
  );
  const escapedInstallRoot = escapeForNsis(installRoot);
  const escapedOutput = escapeForNsis(installerStagePath);
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
  runCommand(resolveWindowsMakensis(), [nsisScriptPath]);

  return installerStagePath;
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
  await fs.promises.writeFile(
    path.join(contentsDir, "Info.plist"),
    plistContent,
    "utf8",
  );

  const dmgStageRoot = path.join(stageRoot, "mac-dmg");
  await ensureDir(dmgStageRoot);
  await copyDir(appBundleRoot, path.join(dmgStageRoot, `${displayName}.app`));

  const applicationsLink = path.join(dmgStageRoot, "Applications");
  if (!fs.existsSync(applicationsLink)) {
    fs.symlinkSync("/Applications", applicationsLink);
  }

  const installerStagePath = path.join(stageRoot, `${productName}.dmg`);
  runCommand("hdiutil", [
    "create",
    "-volname",
    displayName,
    "-srcfolder",
    dmgStageRoot,
    "-ov",
    "-format",
    "UDZO",
    installerStagePath,
  ]);

  return installerStagePath;
};

const buildPluginRuntimeBundle = async () => {
  const pluginRoot = path.join(pluginRuntimeStageRoot, pluginName);
  await removeIfExists(pluginRoot);
  await ensureDir(pluginRoot);

  await copyFile(
    compiledExecutable,
    path.join(pluginRoot, pluginExecutableName),
  );
  await copyDir(bundleRoot, path.join(pluginRoot, "app"));

  if (process.platform !== "win32") {
    runCommand("chmod", ["+x", path.join(pluginRoot, pluginExecutableName)]);
  }

  const zipStagePath = path.join(
    stageRoot,
    `${pluginName}-${releaseTarget.slug}-plugin.zip`,
  );
  await createZipFromDirectory(pluginRoot, zipStagePath);
  return zipStagePath;
};

const finalizeInstallerArtifact = async (installerStagePath: string) => {
  return createAliasedArtifact({
    kind: "installer",
    sourcePath: installerStagePath,
    stableFileName: `${productName}-${releaseTarget.installerStableSuffix}`,
    versionedFileName: `${productName}-${releaseTarget.installerVersionedSuffix}`,
  });
};

const finalizePluginBundleArtifact = async (pluginBundleStagePath: string) => {
  return createAliasedArtifact({
    kind: "plugin-bundle",
    sourcePath: pluginBundleStagePath,
    stableFileName: `${pluginName}-${releaseTarget.slug}-plugin.zip`,
    versionedFileName: `${pluginName}-${releaseTag}-${releaseTarget.slug}-plugin.zip`,
  });
};

const createDownloadUrls = (fileName: string) => {
  if (!repository) {
    return {
      latest: null,
      versioned: null,
    };
  }

  return {
    latest: `${repository}/releases/latest/download/${fileName}`,
    versioned: `${repository}/releases/download/${releaseTag}/${fileName}`,
  };
};

const writeManifestArtifacts = async (
  installerArtifact: AliasedArtifact,
  pluginBundleArtifact: AliasedArtifact,
  runtimeAssets: RuntimeAssetSnapshot,
) => {
  const stableFileName = `${productName}-${releaseTarget.slug}-runtime.json`;
  const versionedFileName = `${productName}-${releaseTag}-${releaseTarget.slug}-runtime.json`;
  const manifestStagePath = path.join(
    stageRoot,
    `${releaseTarget.slug}-runtime.json`,
  );

  const manifest = {
    productName,
    displayName,
    version,
    releaseTag,
    repository,
    generatedAt: new Date().toISOString(),
    target: {
      platform: releaseTarget.platform,
      arch: releaseTarget.arch,
      slug: releaseTarget.slug,
    },
    installer: {
      stableFileName: installerArtifact.stableFileName,
      versionedFileName: installerArtifact.versionedFileName,
      sizeBytes: installerArtifact.sizeBytes,
      sha256: installerArtifact.sha256,
      downloadUrls: {
        stable: createDownloadUrls(installerArtifact.stableFileName).latest,
        versioned: createDownloadUrls(installerArtifact.versionedFileName)
          .versioned,
      },
    },
    pluginBundle: {
      stableFileName: pluginBundleArtifact.stableFileName,
      versionedFileName: pluginBundleArtifact.versionedFileName,
      sizeBytes: pluginBundleArtifact.sizeBytes,
      sha256: pluginBundleArtifact.sha256,
      executableName: pluginExecutableName,
      rootDirectory: pluginName,
      bundledAppDirectory: "app",
      downloadUrls: {
        stable: createDownloadUrls(pluginBundleArtifact.stableFileName).latest,
        versioned: createDownloadUrls(pluginBundleArtifact.versionedFileName)
          .versioned,
      },
    },
    bundledRuntime: {
      browserExecutable: runtimeAssets.browserExecutableRelativePath,
      compositorRoot: runtimeAssets.compositorRootRelativePath,
      ffmpeg: runtimeAssets.ffmpegRelativePath,
      ffprobe: runtimeAssets.ffprobeRelativePath,
      resources: ["ui", "build", "templates", "assets/fomantic-ui-css"],
    },
    notes: [
      "Installer includes Chromium browser, Remotion compositor, ffmpeg, ffprobe, templates and UI assets.",
      "Plugin bundle zip is intended for yishe-client managed plugin distribution.",
      "No extra runtime dependency download is required after installation.",
    ],
  };

  await fs.promises.writeFile(
    manifestStagePath,
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  return createAliasedArtifact({
    kind: "manifest",
    sourcePath: manifestStagePath,
    stableFileName,
    versionedFileName,
  });
};

const writeChecksumArtifacts = async (artifacts: AliasedArtifact[]) => {
  const stableFileName = `${productName}-${releaseTarget.slug}-sha256.txt`;
  const versionedFileName = `${productName}-${releaseTag}-${releaseTarget.slug}-sha256.txt`;
  const checksumStagePath = path.join(
    stageRoot,
    `${releaseTarget.slug}-sha256.txt`,
  );

  const lines = artifacts.flatMap((artifact) => [
    `${artifact.sha256}  ${artifact.versionedFileName}`,
    `${artifact.sha256}  ${artifact.stableFileName}`,
  ]);

  await fs.promises.writeFile(
    `${checksumStagePath}`,
    `${lines.join("\n")}\n`,
    "utf8",
  );

  return createAliasedArtifact({
    kind: "checksums",
    sourcePath: checksumStagePath,
    stableFileName,
    versionedFileName,
  });
};

const main = async () => {
  await stageRuntimeAssets();
  const runtimeAssets = verifyBundledRuntimeAssets();

  let installerStagePath: string;
  if (releaseTarget.platform === "windows") {
    console.log("Building Windows installer...");
    installerStagePath = await buildWindowsInstaller();
  } else {
    console.log(`Building macOS installer (${releaseTarget.arch})...`);
    installerStagePath = await buildMacInstaller();
  }

  const pluginBundleStagePath = await buildPluginRuntimeBundle();
  const installerArtifact = await finalizeInstallerArtifact(installerStagePath);
  const pluginBundleArtifact = await finalizePluginBundleArtifact(
    pluginBundleStagePath,
  );
  const manifestArtifact = await writeManifestArtifacts(
    installerArtifact,
    pluginBundleArtifact,
    runtimeAssets,
  );
  const checksumArtifact = await writeChecksumArtifacts([
    installerArtifact,
    pluginBundleArtifact,
    manifestArtifact,
  ]);

  console.log(`Installer artifacts ready: ${artifactsRoot}`);
  console.log(
    [
      `Stable installer: ${installerArtifact.stableFileName}`,
      `Versioned installer: ${installerArtifact.versionedFileName}`,
      `Plugin bundle: ${pluginBundleArtifact.stableFileName}`,
      `Runtime manifest: ${manifestArtifact.stableFileName}`,
      `Checksums: ${checksumArtifact.stableFileName}`,
    ].join("\n"),
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
