// Node shell over the Rancher Steve link-handler `shell` (WebSocket).
// Contract: specs/20261006-233657-mcp-rancher-node-ssh/contracts/node-shell-tool.md
// Protocol: research.md D2/D5 — subprotocol `base64.channel.k8s.io`,
// channel `0` = stdin, `1` = stdout (PTY, stderr merged), exit code via marker.
import WebSocket from "ws";
import { truncateOutput } from "./utils.js";

export type NodeShellResult = {
  stdout: string;
  exitCode: number | null;
  truncated: boolean;
  durationMs: number;
};

export type RunNodeCommandOptions = {
  shellLink: string;
  token: string;
  command: string;
  timeoutSeconds?: number;
  insecureSkipTlsVerify?: boolean;
};

/** One-shot command wrapper: disables PTY echo, emits START/RC markers, runs in a subshell. */
export function buildShellCommand(command: string): string {
  return (
    `stty -echo 2>/dev/null; printf "__MCP_START__\\n"; ` +
    `( ${command} ); printf "__MCP_RC=%s__\\n" $?; exit`
  );
}

const RC_MARKER_RE = /__MCP_RC=(\d+)__/g;
const START_MARKER = "__MCP_START__";

/**
 * Extract the exit-code marker from the accumulated output.
 * - Normalizes CRLF (PTY) to LF.
 * - Drops everything before the START marker line (MOTD, login banner, PTY echo).
 *   The START token is matched WITH its real newline so the echoed command text
 *   (where it appears as `__MCP_START__\n"` with a literal backslash) is not mistaken for it.
 * - Uses the LAST RC marker occurrence and removes the marker line from the output.
 */
export function extractExitCode(output: string): {
  output: string;
  exitCode: number | null;
} {
  const text = output.replace(/\r\n/g, "\n");
  const startIdx = text.indexOf(START_MARKER + "\n");
  let cleaned = startIdx === -1 ? text : text.slice(startIdx + START_MARKER.length + 1);

  let lastIndex = -1;
  let lastCode: number | null = null;
  RC_MARKER_RE.lastIndex = 0;
  for (let m = RC_MARKER_RE.exec(cleaned); m !== null; m = RC_MARKER_RE.exec(cleaned)) {
    lastIndex = m.index;
    lastCode = parseInt(m[1], 10);
  }
  if (lastIndex === -1) return { output: cleaned, exitCode: null };

  const before = cleaned.slice(0, lastIndex);
  let after = cleaned.slice(lastIndex);
  // Drop the marker itself plus the trailing newline printed after it,
  // and the PTY session epilogue ("logout") printed after `exit`.
  after = after.replace(/^__MCP_RC=\d+__\n?/, "");
  after = after.replace(/(?:^|\n)logout\n?$/, "");
  return { output: before + after, exitCode: lastCode };
}

function clampTimeout(timeoutSeconds?: number): number {
  const t = timeoutSeconds ?? 30;
  return Math.max(1, Math.min(300, t));
}

function shellError(message: string): Error {
  return new Error(`Shell session failed: ${message}`);
}

/**
 * Run one command on a node through the Steve shell WebSocket.
 * Resolves with collected stdout (marker removed) and the exit code.
 */
export function runNodeCommand(
  opts: RunNodeCommandOptions,
): Promise<NodeShellResult> {
  const { shellLink, token, command, insecureSkipTlsVerify } = opts;
  const timeoutSeconds = clampTimeout(opts.timeoutSeconds);
  const startedAt = Date.now();

  return new Promise<NodeShellResult>((resolve, reject) => {
    const url = shellLink.replace(/^http/, "ws");
    const ws = new WebSocket(url, ["base64.channel.k8s.io"], {
      headers: { Authorization: "Bearer " + token },
      perMessageDeflate: false,
      rejectUnauthorized: !insecureSkipTlsVerify,
    });

    let stdout = "";
    let settled = false;
    let exitCode: number | null = null;
    let foundMarker = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.terminate();
      reject(new Error(`Command timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);

    const finish = (result: NodeShellResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    };

    const currentResult = (): NodeShellResult => {
      // Final extraction on the raw accumulated output: handles late frames
      // (e.g. the PTY `logout` epilogue) arriving after the marker was seen.
      const parsed = extractExitCode(stdout);
      const { text, truncated } = truncateOutput(parsed.output);
      return {
        stdout: text,
        exitCode: parsed.exitCode !== null ? parsed.exitCode : (foundMarker ? exitCode : null),
        truncated,
        durationMs: Date.now() - startedAt,
      };
    };

    ws.on("open", () => {
      const frame = "0" + Buffer.from(buildShellCommand(command) + "\n").toString("base64");
      ws.send(frame);
    });

    ws.on("message", (raw: WebSocket.RawData) => {
      const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
      if (!text) return;
      const channel = text[0];
      if (channel !== "1") return;
      let decoded: string;
      try {
        decoded = Buffer.from(text.slice(1), "base64").toString("utf8");
      } catch {
        return; // invalid base64 — ignore the frame
      }
      stdout += decoded;

      if (!foundMarker) {
        const parsed = extractExitCode(stdout);
        if (parsed.exitCode !== null) {
          exitCode = parsed.exitCode;
          foundMarker = true;
          // Result is fixed; close the session (close handler resolves and
          // performs the final extraction on the raw output).
          ws.close();
        }
      }
    });

    ws.on("close", () => {
      finish(currentResult());
    });

    ws.on("error", (err: Error) => {
      fail(shellError(err?.message || "connection error"));
    });

    ws.on("unexpected-response", (_req: unknown, res: { statusCode?: number; statusMessage?: string }) => {
      fail(
        shellError(
          `HTTP ${res?.statusCode ?? "?"} ${res?.statusMessage ?? ""}`.trim(),
        ),
      );
    });
  });
}
