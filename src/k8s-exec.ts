import WebSocket from "ws";
import { truncateOutput } from "./utils.js";

/** Fields needed to build the pod exec WebSocket URL. */
export type ExecUrlOptions = {
  baseUrl: string; // https://rancher.example.com
  clusterId: string;
  namespace: string;
  pod: string;
  container?: string;
  command: string;
};

export type K8sExecOptions = ExecUrlOptions & {
  token: string;
  timeoutSeconds?: number;
  insecureSkipTlsVerify?: boolean;
};

export type K8sExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  truncated: boolean;
  durationMs: number;
};

const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 300;
const MAX_ERROR_BODY = 400;

// v5.channel.k8s.io / v4.channel.k8s.io channel numbers.
const CHANNEL_STDOUT = 1;
const CHANNEL_STDERR = 2;
const CHANNEL_STATUS = 3;

/**
 * Build the Rancher-proxied pod exec WebSocket URL.
 * Method is GET (the upgrade carries it); the command is passed as three
 * repeated `command` query params: `sh -c <command>`.
 */
export function buildExecUrl(opts: ExecUrlOptions): string {
  const wsBase = opts.baseUrl.replace(/\/+$/, "").replace(/^http/, "ws");
  const clusterId = encodeURIComponent(opts.clusterId);
  const ns = encodeURIComponent(opts.namespace);
  const pod = encodeURIComponent(opts.pod);

  const params = new URLSearchParams();
  params.append("command", "sh");
  params.append("command", "-c");
  params.append("command", opts.command);
  if (opts.container) params.append("container", opts.container);
  params.append("stdout", "1");
  params.append("stderr", "1");
  params.append("tty", "0");
  params.append("stdin", "0");

  return `${wsBase}/k8s/clusters/${clusterId}/api/v1/namespaces/${ns}/pods/${pod}/exec?${params.toString()}`;
}

/**
 * Decode a raw (non-base64) exec frame: `[channel, ...payload]`.
 * An empty buffer yields channel -1, which callers ignore.
 */
export function decodeExecFrame(data: Buffer): { channel: number; payload: Buffer } {
  // Defensive: `ws` may hand over a string depending on binaryType.
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as unknown as string);
  if (buf.length === 0) return { channel: -1, payload: buf };
  return { channel: buf[0], payload: buf.subarray(1) };
}

/**
 * Parse a channel-3 `metav1.Status` frame.
 * - `{"status":"Success"}` -> exitCode 0
 * - `Failure` + `NonZeroExitCode` with a cause `{reason:"ExitCode",message:"42"}` -> 42
 * - anything unparseable / unexpected -> exitCode null
 */
export function parseExecStatus(jsonText: string): { exitCode: number | null; message?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { exitCode: null };
  }
  if (!parsed || typeof parsed !== "object") return { exitCode: null };

  const status = parsed as {
    status?: unknown;
    reason?: unknown;
    message?: unknown;
    details?: { causes?: unknown };
  };

  if (status.status === "Success") return { exitCode: 0 };

  const causes = status.details?.causes;
  if (Array.isArray(causes)) {
    for (const cause of causes) {
      if (!cause || typeof cause !== "object") continue;
      const c = cause as { reason?: unknown; message?: unknown };
      if (c.reason === "ExitCode" && typeof c.message === "string") {
        const code = parseInt(c.message, 10);
        if (!Number.isNaN(code)) return { exitCode: code, message: c.message };
      }
    }
  }

  const message =
    typeof status.message === "string"
      ? status.message
      : typeof status.reason === "string"
        ? status.reason
        : undefined;
  return { exitCode: null, message };
}

function toBuffer(data: Buffer | ArrayBuffer | Buffer[]): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data);
}

/**
 * One-shot, non-interactive exec in a pod via the Rancher WS proxy.
 * stdout/stderr are collected from channels 1/2; the exit code comes from
 * the channel-3 status frame. Times out with `ws.terminate()`.
 */
export function k8sPodExec(opts: K8sExecOptions): Promise<K8sExecResult> {
  const timeoutSeconds = Math.min(
    Math.max(opts.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS, 1),
    MAX_TIMEOUT_SECONDS,
  );
  const url = buildExecUrl(opts);
  const startedAt = Date.now();

  return new Promise<K8sExecResult>((resolve, reject) => {
    const ws = new WebSocket(url, ["v5.channel.k8s.io", "v4.channel.k8s.io"], {
      perMessageDeflate: false,
      headers: { Authorization: `Bearer ${opts.token}` },
      rejectUnauthorized: !opts.insecureSkipTlsVerify,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.terminate();
      reject(new Error(`Command timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.terminate();
      reject(err);
    };

    const succeed = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const out = truncateOutput(stdout);
      const err = truncateOutput(stderr);
      resolve({
        stdout: out.text,
        stderr: err.text,
        exitCode,
        truncated: out.truncated || err.truncated,
        durationMs: Date.now() - startedAt,
      });
      ws.close();
    };

    ws.on("message", (data) => {
      if (settled) return;
      const frame = decodeExecFrame(toBuffer(data));
      if (frame.channel === CHANNEL_STDOUT) {
        // An empty stdout frame right after connect is not an error.
        if (frame.payload.length > 0) stdout += frame.payload.toString("utf8");
      } else if (frame.channel === CHANNEL_STDERR) {
        if (frame.payload.length > 0) stderr += frame.payload.toString("utf8");
      } else if (frame.channel === CHANNEL_STATUS) {
        const status = parseExecStatus(frame.payload.toString("utf8"));
        if (status.exitCode !== null) {
          succeed(status.exitCode);
        } else {
          // Failure without an ExitCode cause (e.g. OCI runtime error:
          // "exec: \"sh\": executable file not found in $PATH") — surface it.
          const detail = (status.message ?? "unknown exec failure")
            .slice(0, MAX_ERROR_BODY);
          fail(new Error(`Exec failed: ${detail}`));
        }
      }
    });

    ws.on("close", () => {
      // Server closed without a status frame: settle with a null exit code
      // rather than hanging until the timeout.
      if (!settled) succeed(null);
    });

    ws.on("unexpected-response", (req, res) => {
      const statusCode = res.statusCode ?? 0;
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        body += chunk;
      });
      res.on("end", () => {
        req.destroy();
        const detail = body.trim().slice(0, MAX_ERROR_BODY);
        fail(new Error(`Exec failed: HTTP ${statusCode}${detail ? ` — ${detail}` : ""}`));
      });
      res.on("error", () => {
        req.destroy();
        fail(new Error(`Exec failed: HTTP ${statusCode}`));
      });
    });

    ws.on("error", (err: Error) => {
      fail(new Error(`Exec failed: ${err.message}`));
    });
  });
}
