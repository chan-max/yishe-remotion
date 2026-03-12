import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import path from "node:path";

interface JobData {
  templateId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
}

type JobState =
  | {
    status: "queued";
    data: JobData;
    createdAt: number;
    updatedAt: number;
    cancel: () => void;
    startedAt?: number;
    completedAt?: number;
  }
  | {
    status: "in-progress";
    progress: number;
    data: JobData;
    createdAt: number;
    startedAt: number;
    updatedAt: number;
    cancel: () => void;
    completedAt?: number;
  }
  | {
    status: "completed";
    videoUrl: string;
    data: JobData;
    createdAt: number;
    startedAt: number;
    completedAt: number;
    updatedAt: number;
  }
  | {
    status: "failed";
    error: Error;
    data: JobData;
    createdAt: number;
    startedAt?: number;
    completedAt: number;
    updatedAt: number;
  };

export const makeRenderQueue = ({
  port,
  serveUrl,
  rendersDir,
}: {
  port: number;
  serveUrl: string;
  rendersDir: string;
}) => {
  const jobs = new Map<string, JobState>();
  let queue: Promise<unknown> = Promise.resolve();

  const processRender = async (jobId: string) => {
    const job = jobs.get(jobId);
    if (!job) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const { cancel, cancelSignal } = makeCancelSignal();
    const startedAt = Date.now();

    jobs.set(jobId, {
      progress: 0,
      status: "in-progress",
      cancel: cancel,
      data: job.data,
      createdAt: job.createdAt,
      startedAt,
      updatedAt: startedAt,
    });

    try {
      const inputProps = job.data.inputProps;

      const composition = await selectComposition({
        serveUrl,
        id: job.data.compositionId,
        inputProps,
      });

      // 超时配置：支持通过环境变量 `RENDER_TIMEOUT_MS` 调整默认基准（毫秒）
      // 默认基准为 120s（避免网络慢导致的图片/资源加载超时）
      const DEFAULT_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS) || 120 * 1000;

      // 根据输入的 audioDuration 自动计算超时时间（毫秒），并确保至少为默认基准
      const maybeAudioDuration = Number((inputProps as any)?.audioDuration || 0);
      const computedFromAudio = maybeAudioDuration > 0
        ? Math.round(maybeAudioDuration * 1000 + 30 * 1000) // 音频时长 + 30s 余量
        : 0;

      const timeoutInMilliseconds = Math.max(DEFAULT_TIMEOUT_MS, computedFromAudio || 0);

      await renderMedia({
        cancelSignal,
        serveUrl,
        composition,
        inputProps,
        codec: "h264",
        timeoutInMilliseconds,
        onProgress: (progress) => {
          console.info(`${jobId} render progress:`, progress.progress);
          const updatedAt = Date.now();
          jobs.set(jobId, {
            progress: progress.progress,
            status: "in-progress",
            cancel: cancel,
            data: job.data,
            createdAt: job.createdAt,
            startedAt,
            updatedAt,
          });
        },
        outputLocation: path.join(rendersDir, `${jobId}.mp4`),
      });

      const completedAt = Date.now();
      jobs.set(jobId, {
        status: "completed",
        videoUrl: `/renders/${jobId}.mp4`,
        data: job.data,
        createdAt: job.createdAt,
        startedAt,
        completedAt,
        updatedAt: completedAt,
      });
    } catch (error) {
      console.error(error);
      const completedAt = Date.now();
      jobs.set(jobId, {
        status: "failed",
        error: error as Error,
        data: job.data,
        createdAt: job.createdAt,
        startedAt,
        completedAt,
        updatedAt: completedAt,
      });
    }
  };

  const queueRender = async ({
    jobId,
    data,
  }: {
    jobId: string;
    data: JobData;
  }) => {
    const createdAt = Date.now();
    jobs.set(jobId, {
      status: "queued",
      data,
      createdAt,
      updatedAt: createdAt,
      cancel: () => {
        jobs.delete(jobId);
      },
    });

    queue = queue.then(() => processRender(jobId));
  };

  function createJob(data: JobData) {
    const jobId = randomUUID();

    queueRender({ jobId, data });

    return jobId;
  }

  return {
    createJob,
    jobs,
  };
};
