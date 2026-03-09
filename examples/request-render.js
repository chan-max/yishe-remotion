#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const https = require("node:https");

const BASE_URL = process.env.REMOTION_SERVER_URL || "http://localhost:3000";
const TITLE_TEXT = process.env.TITLE_TEXT || "Hello, world!";
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.resolve(process.cwd(), "downloads");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createJob() {
  const res = await fetch(`${BASE_URL}/renders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ titleText: TITLE_TEXT }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create job failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data?.jobId) {
    throw new Error("Create job response missing jobId");
  }

  return data.jobId;
}

async function getJob(jobId) {
  const res = await fetch(`${BASE_URL}/renders/${jobId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get job failed: ${res.status} ${text}`);
  }
  return res.json();
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on("finish", () => fileStream.close(resolve));
      })
      .on("error", reject);
  });
}

async function main() {
  console.info(`Server: ${BASE_URL}`);
  console.info(`Title: ${TITLE_TEXT}`);

  const jobId = await createJob();
  console.info(`Job created: ${jobId}`);

  while (true) {
    const job = await getJob(jobId);

    if (job?.status === "completed") {
      const videoUrl = job.videoUrl;
      if (!videoUrl) throw new Error("Missing videoUrl");

      const outputPath = path.join(OUTPUT_DIR, `${jobId}.mp4`);
      console.info(`Render completed: ${videoUrl}`);
      console.info(`Downloading to: ${outputPath}`);

      await downloadFile(videoUrl, outputPath);
      console.info("Download finished");
      return;
    }

    if (job?.status === "failed") {
      throw new Error(job?.error?.message || "Render failed");
    }

    const progress = job?.progress ?? 0;
    console.info(`Status: ${job?.status || "unknown"} ${(progress * 100).toFixed(1)}%`);
    await sleep(1500);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
