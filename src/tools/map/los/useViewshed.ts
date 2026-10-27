import { useEffect, useMemo, useState } from "react";
import type { World } from "@/core/data";
import { heightmapUrl } from "@/core/maps";
import type { Viewshed, ViewshedInput } from "./viewshed";
import type { ViewshedRequest, ViewshedResponse } from "./viewshed.worker";

export type ViewshedStatus = "idle" | "running" | "done" | "cancelled" | "error" | "unsupported";

export interface ViewshedState {
  status: ViewshedStatus;
  progress: number;
  result: Viewshed | null;
  error: string | null;
  cancel: () => void;
}

interface Job {
  key: string;
  progress: number;
  result: Viewshed | null;
  done: boolean;
  error: string | null;
}

export function useViewshed(world: World, input: ViewshedInput | null): ViewshedState {
  const key = useMemo(() => (input === null ? null : JSON.stringify({ world, input })), [world, input]);
  const [job, setJob] = useState<Job | null>(null);
  const [cancelledKey, setCancelledKey] = useState<string | null>(null);
  const supported = typeof Worker !== "undefined";

  useEffect(() => {
    if (key === null || cancelledKey === key || !supported) {
      return;
    }
    const request = JSON.parse(key) as { world: World; input: ViewshedInput };
    const worker = new Worker(new URL("./viewshed.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<ViewshedResponse>) => {
      const message = event.data;
      if (message.type === "progress") {
        setJob({ key, progress: message.value, result: null, done: false, error: null });
      } else if (message.type === "done") {
        setJob({ key, progress: 1, result: message.result, done: true, error: null });
      } else {
        setJob({ key, progress: 0, result: null, done: true, error: message.message });
      }
    });
    worker.addEventListener("error", () => {
      setJob({ key, progress: 0, result: null, done: true, error: "The viewshed could not be computed." });
    });
    const message: ViewshedRequest = {
      id: 1,
      metaUrl: heightmapUrl(request.world, "json"),
      dataUrl: heightmapUrl(request.world, "u16"),
      input: request.input,
    };
    worker.postMessage(message);
    return () => worker.terminate();
  }, [key, cancelledKey, supported]);

  const cancel = () => setCancelledKey(key);
  const current = job !== null && job.key === key ? job : null;
  if (key === null) {
    return { status: "idle", progress: 0, result: null, error: null, cancel };
  }
  if (!supported) {
    return { status: "unsupported", progress: 0, result: null, error: null, cancel };
  }
  if (current?.done) {
    return {
      status: current.error === null ? "done" : "error",
      progress: current.progress,
      result: current.result,
      error: current.error,
      cancel,
    };
  }
  if (cancelledKey === key) {
    return { status: "cancelled", progress: current?.progress ?? 0, result: null, error: null, cancel };
  }
  return { status: "running", progress: current?.progress ?? 0, result: null, error: null, cancel };
}
