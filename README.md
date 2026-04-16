# Yishe Remotion

`yishe-remotion` is the local Video Template rendering service used by the Yishe client plugin.
It serves template metadata, accepts render jobs, and produces local video outputs through Remotion.

## Local development

Install dependencies:

```bash
bun install
```

Start the local render service in watch mode:

```bash
bun run dev
```

Start the service in production mode:

```bash
bun run start
```

Build the Remotion bundle only:

```bash
bun run build
```

Open Remotion Studio:

```bash
bun run remotion:studio
```

## Desktop packaging

This repository ships desktop installers for local deployment.
The packaging flow bundles everything required for direct use after installation:

- Chromium browser assets downloaded by Remotion
- Remotion compositor binaries
- `ffmpeg`
- `ffprobe`
- UI assets
- Template registry and build output

Build a desktop installer for the current machine locally:

```bash
bun run release
```

Generated artifacts are written to `release/dist/artifacts`.

Each build now emits:

- A versioned installer artifact
- A stable installer artifact name for fixed download URLs
- A runtime manifest JSON
- A SHA256 checksum file

## Automated release flow

Desktop installers are published automatically by GitHub Actions.

Trigger rule:

- Push to `main` with a changed `package.json` version

What the workflow does:

- Builds Windows x64 installer
- Builds macOS x64 installer
- Builds macOS arm64 installer
- Publishes a GitHub Release with both versioned assets and stable asset names

Workflow file:

- `.github/workflows/release.yml`

## Fixed download URLs

The workflow uploads stable file names so clients can always download the latest installers from fixed URLs:

- Windows x64:
  `https://github.com/chan-max/yishe-remotion/releases/latest/download/yishe-video-tool-windows-x64-setup.exe`
- macOS Intel:
  `https://github.com/chan-max/yishe-remotion/releases/latest/download/yishe-video-tool-macos-x64.dmg`
- macOS Apple Silicon:
  `https://github.com/chan-max/yishe-remotion/releases/latest/download/yishe-video-tool-macos-arm64.dmg`

Matching runtime manifests and checksum files are also published under the same `latest/download/` pattern.

## Docker

Docker support is still available for server-side deployment:

```bash
docker build -t yishe-remotion .
docker run -d -p 1572:1572 yishe-remotion
```

## Notes

- When you want to publish a new desktop release, bump `package.json` version first.
- The desktop release workflow uses the bumped version to create/update the GitHub Release tag `v<version>`.
- If any required runtime dependency such as `ffmpeg` or `ffprobe` is missing from the staged payload, the release build fails immediately.
