import express from "express";
import { makeRenderQueue } from "./render-queue";
import { bundle } from "@remotion/bundler";
import path from "node:path";
import fs from "node:fs";
import { ensureBrowser } from "@remotion/renderer";
import { success, error, ErrorCode } from "./response";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadTemplates } = require("../templates/index.js") as {
  loadTemplates: () => Array<{
    id: string;
    name: string;
    description: string;
    compositionId: string;
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
    defaultInputProps: Record<string, unknown>;
    editableFields: string[];
  }>;
};

const { PORT = 1572, REMOTION_SERVE_URL } = process.env;

function setupApp({ remotionBundleUrl }: { remotionBundleUrl: string }) {
  const app = express();

  const getTemplates = () => loadTemplates();

  const rendersDir = path.resolve("renders");

  const queue = makeRenderQueue({
    port: Number(PORT),
    serveUrl: remotionBundleUrl,
    rendersDir,
  });

  const formatJob = (job: {
    status: string;
    data: unknown;
    progress?: number;
    videoUrl?: string;
    error?: Error;
    createdAt?: number;
    startedAt?: number;
    completedAt?: number;
    updatedAt?: number;
  }) => {
    const now = Date.now();
    const startedAt = job.startedAt ?? job.createdAt;
    const completedAt = job.completedAt;
    const elapsedMs = completedAt
      ? completedAt - (startedAt ?? completedAt)
      : startedAt
        ? now - startedAt
        : 0;

    return {
      ...job,
      createdAt: job.createdAt ?? now,
      startedAt: job.startedAt ?? null,
      completedAt: job.completedAt ?? null,
      updatedAt: job.updatedAt ?? now,
      elapsedMs,
    };
  };

  const waitForJobCompletion = ({
    jobId,
    timeoutMs,
    pollMs = 1000,
  }: {
    jobId: string;
    timeoutMs: number;
    pollMs?: number;
  }) => {
    return new Promise<
      | { status: "completed"; videoUrl: string }
      | { status: "failed"; error?: Error }
      | { status: "not_found" }
      | { status: "timeout" }
    >((resolve) => {
      const startedAt = Date.now();

      const timer = setInterval(() => {
        const job = queue.jobs.get(jobId);

        if (!job) {
          clearInterval(timer);
          resolve({ status: "not_found" });
          return;
        }

        if (job.status === "completed") {
          clearInterval(timer);
          resolve({ status: "completed", videoUrl: job.videoUrl });
          return;
        }

        if (job.status === "failed") {
          clearInterval(timer);
          resolve({ status: "failed", error: job.error });
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          clearInterval(timer);
          resolve({ status: "timeout" });
        }
      }, pollMs);
    });
  };


  // Host renders on /renders
  app.use("/renders", express.static(rendersDir));
  app.use("/semantic", express.static(path.resolve("node_modules/fomantic-ui-css")));
  app.use("/", express.static(path.resolve("ui")));
  app.use(express.json());

  // List render output files/folders with pagination
  app.get("/api/renders-folders", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));
      const files = await fs.promises.readdir(rendersDir);
      // Only show files/folders, optionally filter by extension
      const allStats = await Promise.all(
        files.map(async (name) => {
          const fullPath = path.join(rendersDir, name);
          const stat = await fs.promises.stat(fullPath);
          return {
            name,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            mtime: stat.mtime,
            ctime: stat.ctime,
            path: fullPath,
          };
        })
      );
      // Sort by mtime desc
      allStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      const total = allStats.length;
      const paged = allStats.slice((page - 1) * pageSize, page * pageSize);
      res.json(success({
        list: paged,
        page,
        pageSize,
        total,
      }, "获取渲染输出文件夹列表成功"));
    } catch (err) {
      res.status(500).json(error(ErrorCode.INTERNAL_ERROR, "读取渲染输出文件夹失败", { err: String(err) }));
    }
  });

  // Delete one or more render output files/folders
  app.delete("/api/renders-folders", async (req, res) => {
    try {
      const { names } = req.body;
      if (!Array.isArray(names) || names.length === 0) {
        res.status(400).json(error(ErrorCode.INVALID_REQUEST, "names 必须为非空数组"));
        return;
      }
      let deleted: string[] = [];
      let failed: { name: string, error: string }[] = [];
      for (const name of names) {
        const fullPath = path.join(rendersDir, name);
        try {
          const stat = await fs.promises.stat(fullPath);
          if (stat.isDirectory()) {
            await fs.promises.rm(fullPath, { recursive: true, force: true });
          } else {
            await fs.promises.unlink(fullPath);
          }
          deleted.push(name);
        } catch (e) {
          failed.push({ name, error: String(e) });
        }
      }
      res.json(success({ deleted, failed }, "删除渲染输出文件/文件夹完成"));
    } catch (err) {
      res.status(500).json(error(ErrorCode.INTERNAL_ERROR, "删除渲染输出文件夹失败", { err: String(err) }));
    }
  });

  app.get("/api/templates", (_req, res) => {
    const templates = getTemplates();
    res.json(
      success(
        templates.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          compositionId: template.compositionId,
          durationInFrames: template.durationInFrames,
          fps: template.fps,
          width: template.width,
          height: template.height,
          defaultInputProps: template.defaultInputProps,
          editableFields: template.editableFields,
        })),
        "获取模板列表成功",
      ),
    );
  });

  // Endpoint to create a new job
  app.post("/api/renders", async (req, res) => {
    const templates = getTemplates();
    const templateId = req.body?.templateId;
    const inputProps = req.body?.inputProps ?? {};

    if (typeof templateId !== "string") {
      res
        .status(400)
        .json(error(ErrorCode.INVALID_REQUEST, "templateId must be a string"));
      return;
    }

    if (typeof inputProps !== "object" || Array.isArray(inputProps)) {
      res
        .status(400)
        .json(error(ErrorCode.INVALID_REQUEST, "inputProps must be an object"));
      return;
    }

    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      res
        .status(404)
        .json(
          error(
            ErrorCode.TEMPLATE_NOT_FOUND,
            `Template ${templateId} not found`,
          ),
        );
      return;
    }

    const sanitizedInputProps = {
      ...template.defaultInputProps,
    } as Record<string, unknown>;

    for (const field of template.editableFields) {
      if (field in inputProps) {
        sanitizedInputProps[field] = (inputProps as Record<string, unknown>)[field];
      }
    }

    const jobId = queue.createJob({
      templateId,
      compositionId: template.compositionId,
      inputProps: sanitizedInputProps,
    });

    const job = queue.jobs.get(jobId);

    res.json(
      success(
        {
          jobId,
          status: "queued",
          createdAt: job?.createdAt ?? Date.now(),
        },
        "渲染任务创建成功",
      ),
    );
  });

  app.post("/api/renders/sync", async (req, res) => {
    const templates = getTemplates();
    const templateId = req.body?.templateId;
    const inputProps = req.body?.inputProps ?? {};
    const timeoutMs = Number(req.body?.timeoutMs ?? 300000);

    if (typeof templateId !== "string") {
      res
        .status(400)
        .json(error(ErrorCode.INVALID_REQUEST, "templateId must be a string"));
      return;
    }

    if (typeof inputProps !== "object" || Array.isArray(inputProps)) {
      res
        .status(400)
        .json(error(ErrorCode.INVALID_REQUEST, "inputProps must be an object"));
      return;
    }

    if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 900000) {
      res
        .status(400)
        .json(
          error(
            ErrorCode.INVALID_REQUEST,
            "timeoutMs must be a number between 1000 and 900000",
          ),
        );
      return;
    }

    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      res
        .status(404)
        .json(
          error(
            ErrorCode.TEMPLATE_NOT_FOUND,
            `Template ${templateId} not found`,
          ),
        );
      return;
    }

    const sanitizedInputProps = {
      ...template.defaultInputProps,
    } as Record<string, unknown>;

    for (const field of template.editableFields) {
      if (field in inputProps) {
        sanitizedInputProps[field] = (inputProps as Record<string, unknown>)[field];
      }
    }

    const jobId = queue.createJob({
      templateId,
      compositionId: template.compositionId,
      inputProps: sanitizedInputProps,
    });

    const result = await waitForJobCompletion({ jobId, timeoutMs });

    if (result.status === "completed") {
      const job = queue.jobs.get(jobId);
      // Build full videoUrl with host
      const host = req.headers.host || `localhost:${PORT}`;
      const protocol = req.protocol || 'http';
      const videoUrl = `${protocol}://${host}${result.videoUrl}`;
      res.json(
        success(
          {
            jobId,
            status: "completed",
            videoUrl,
            createdAt: job?.createdAt ?? null,
            startedAt: job?.startedAt ?? null,
            completedAt: job?.completedAt ?? null,
            elapsedMs: job?.completedAt && job?.startedAt
              ? job.completedAt - job.startedAt
              : null,
          },
          "渲染完成",
        ),
      );
      return;
    }

    if (result.status === "failed") {
      res
        .status(500)
        .json(
          error(
            ErrorCode.INTERNAL_ERROR,
            result.error?.message || "渲染失败",
            { jobId },
          ),
        );
      return;
    }

    if (result.status === "not_found") {
      res
        .status(404)
        .json(error(ErrorCode.JOB_NOT_FOUND, "Job not found", { jobId }));
      return;
    }

    res
      .status(202)
      .json(
        error(ErrorCode.INTERNAL_ERROR, "渲染超时，请改用异步轮询", {
          jobId,
          status: "in-progress",
        }),
      );
  });

  app.post("/renders", async (req, res) => {
    const templates = getTemplates();
    const templateId = req.body?.templateId || "hello-world";
    const inputProps = req.body?.inputProps ?? req.body ?? {};

    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      res.status(404).json({ message: `Template ${templateId} not found` });
      return;
    }

    const sanitizedInputProps = {
      ...template.defaultInputProps,
    } as Record<string, unknown>;

    for (const field of template.editableFields) {
      if (field in inputProps) {
        sanitizedInputProps[field] = (inputProps as Record<string, unknown>)[field];
      }
    }

    const jobId = queue.createJob({
      templateId,
      compositionId: template.compositionId,
      inputProps: sanitizedInputProps,
    });

    res.json({ jobId });
  });

  // Endpoint to get a job status
  app.get("/api/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const job = queue.jobs.get(jobId);

    if (!job) {
      res
        .status(404)
        .json(error(ErrorCode.JOB_NOT_FOUND, "Job not found"));
      return;
    }

    res.json(success(formatJob(job), "获取任务状态成功"));
  });

  app.get("/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const job = queue.jobs.get(jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json(job);
  });

  // Endpoint to cancel a job
  app.delete("/api/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;

    const job = queue.jobs.get(jobId);

    if (!job) {
      res
        .status(404)
        .json(error(ErrorCode.JOB_NOT_FOUND, "Job not found"));
      return;
    }

    if (job.status !== "queued" && job.status !== "in-progress") {
      res
        .status(400)
        .json(
          error(
            ErrorCode.JOB_NOT_CANCELLABLE,
            "Job is not cancellable",
          ),
        );
      return;
    }

    job.cancel();

    res.json(success({ jobId }, "任务取消成功"));
  });

  app.delete("/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;

    const job = queue.jobs.get(jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.status !== "queued" && job.status !== "in-progress") {
      res.status(400).json({ message: "Job is not cancellable" });
      return;
    }

    job.cancel();

    res.json({ message: "Job cancelled" });
  });

  app.use((_req, res) => {
    res.sendFile(path.resolve("ui", "index.html"));
  });

  return app;
}

async function main() {
  await ensureBrowser();

  const remotionBundleUrl = REMOTION_SERVE_URL
    ? REMOTION_SERVE_URL
    : await bundle({
      entryPoint: path.resolve("remotion/index.ts"),
      onProgress(progress) {
        console.info(`Bundling Remotion project: ${progress}%`);
      },
    });

  const app = setupApp({ remotionBundleUrl });

  app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT}`);
  });
}

main();
