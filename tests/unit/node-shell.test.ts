import { describe, it, expect } from "vitest";
import {
  buildShellCommand,
  extractExitCode,
} from "../../src/node-shell.js";

describe("node-shell", () => {
  describe("buildShellCommand", () => {
    it("should disable echo, emit START/RC markers, run in a subshell and exit", () => {
      const out = buildShellCommand("hostname");

      expect(out).toContain("stty -echo");
      expect(out).toContain("hostname");
      expect(out).toContain('printf "__MCP_START__');
      expect(out).toContain('printf "__MCP_RC=%s__');
      expect(out).toContain("( hostname )");
      expect(out).toContain("exit");
    });

    it("should keep the original command intact inside the subshell", () => {
      const cmd = "echo a && echo b | wc -l";
      expect(buildShellCommand(cmd)).toContain(`( ${cmd} )`);
    });

    it("should survive `exit N` (subshell), reporting N via the RC marker", () => {
      const out = buildShellCommand("exit 3");
      // The exit runs in a subshell, so the wrapper still prints the marker:
      expect(out).toContain("( exit 3 )");
      expect(out.indexOf("__MCP_RC")).toBeGreaterThan(out.indexOf("( exit 3 )"));
    });
  });

  describe("extractExitCode", () => {
    it("should extract the code and strip the trailing marker", () => {
      const res = extractExitCode("ip-10-0-3-30\n__MCP_RC=0__\n");

      expect(res.exitCode).toBe(0);
      expect(res.output).toBe("ip-10-0-3-30\n");
    });

    it("should return non-zero exit code", () => {
      const res = extractExitCode("boom\n__MCP_RC=42__\n");

      expect(res.exitCode).toBe(42);
      expect(res.output).toBe("boom\n");
    });

    it("should preserve multiline output", () => {
      const res = extractExitCode("line1\nline2\nline3\n__MCP_RC=1__\n");

      expect(res.exitCode).toBe(1);
      expect(res.output).toBe("line1\nline2\nline3\n");
      expect(res.output.split("\n")).toHaveLength(4);
    });

    it("should handle a marker without a trailing newline", () => {
      const res = extractExitCode("out\n__MCP_RC=7__");

      expect(res.exitCode).toBe(7);
      expect(res.output).toBe("out\n");
    });

    it("should return null when no marker is present", () => {
      const res = extractExitCode("just output\n");

      expect(res.exitCode).toBeNull();
      expect(res.output).toBe("just output\n");
    });

    it("should use the last marker occurrence", () => {
      const res = extractExitCode("__MCP_RC=1__\nreal\n__MCP_RC=0__\n");

      expect(res.exitCode).toBe(0);
      expect(res.output).toBe("__MCP_RC=1__\nreal\n");
    });

    it("should handle empty output", () => {
      const res = extractExitCode("");

      expect(res.exitCode).toBeNull();
      expect(res.output).toBe("");
    });

    it("should drop MOTD/banner/echo before the START marker line", () => {
      const raw =
        "Welcome to Ubuntu 24.04.4 LTS\r\n" +
        "System information as of ...\r\n" +
        'stty -echo 2>/dev/null; printf "__MCP_START__\\n"; ( hostname ); printf "__MCP_RC=%s__\\n" $?; exit\r\n' +
        "__MCP_START__\n" +
        "aws-worker-1\r\n" +
        "logout\r\n" +
        "__MCP_RC=0__\r\n" +
        "logout\r\n";

      const res = extractExitCode(raw);
      expect(res.exitCode).toBe(0);
      expect(res.output).not.toContain("Welcome");
      expect(res.output).not.toContain("stty -echo");
      expect(res.output).toContain("aws-worker-1");
    });

    it("should normalize CRLF to LF", () => {
      const res = extractExitCode("__MCP_START__\r\nline1\r\nline2\r\n__MCP_RC=2__\r\n");
      expect(res.exitCode).toBe(2);
      expect(res.output).toBe("line1\nline2\n");
    });

    it("should not mistake the echoed START token for the real marker", () => {
      // The echoed command contains `__MCP_START__\n` with a literal backslash:
      const raw =
        'stty -echo; printf "__MCP_START__\\n"; ( hostname ); printf "__MCP_RC=%s__\\n" $?; exit\r\n' +
        "__MCP_START__\n" +
        "real-output\n" +
        "__MCP_RC=0__\n";
      const res = extractExitCode(raw);
      expect(res.output).toBe("real-output\n");
      expect(res.exitCode).toBe(0);
    });
  });
});
