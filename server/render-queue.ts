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
    }
  | {
      status: "in-progress";
      progress: number;
      data: JobData;
      createdAt: number;
      startedAt: number;
      updatedAt: number;
      cancel: () => void;
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

      await renderMedia({
        cancelSignal,
        serveUrl,
        composition,
        inputProps,
        codec: "h264",
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
        videoUrl: `http://localhost:${port}/renders/${jobId}.mp4`,
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
