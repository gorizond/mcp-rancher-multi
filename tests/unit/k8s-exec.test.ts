import { describe, it, expect } from 'vitest';
import { buildExecUrl, decodeExecFrame, parseExecStatus } from '../../src/k8s-exec.js';

describe('k8s-exec', () => {
  describe('decodeExecFrame', () => {
    it('should decode stdout channel (1)', () => {
      const frame = decodeExecFrame(Buffer.concat([Buffer.from([1]), Buffer.from('hello')]));
      expect(frame.channel).toBe(1);
      expect(frame.payload.toString('utf8')).toBe('hello');
    });

    it('should decode stderr channel (2)', () => {
      const frame = decodeExecFrame(Buffer.concat([Buffer.from([2]), Buffer.from('boom')]));
      expect(frame.channel).toBe(2);
      expect(frame.payload.toString('utf8')).toBe('boom');
    });

    it('should decode status channel (3)', () => {
      const payload = JSON.stringify({ status: 'Success' });
      const frame = decodeExecFrame(Buffer.concat([Buffer.from([3]), Buffer.from(payload)]));
      expect(frame.channel).toBe(3);
      expect(frame.payload.toString('utf8')).toBe(payload);
    });

    it('should decode close channel (255)', () => {
      const frame = decodeExecFrame(Buffer.from([255, 3]));
      expect(frame.channel).toBe(255);
      expect(frame.payload.toString('utf8')).toBe('\x03');
    });

    it('should ignore empty frames', () => {
      const frame = decodeExecFrame(Buffer.alloc(0));
      expect(frame.channel).toBe(-1);
      expect(frame.payload.length).toBe(0);
    });

    it('should handle payload with only a channel byte', () => {
      const frame = decodeExecFrame(Buffer.from([1]));
      expect(frame.channel).toBe(1);
      expect(frame.payload.length).toBe(0);
    });
  });

  describe('parseExecStatus', () => {
    it('should return exit code 0 for Success', () => {
      expect(parseExecStatus('{"status":"Success"}')).toEqual({ exitCode: 0 });
    });

    it('should extract exit code from NonZeroExitCode cause message', () => {
      const json = JSON.stringify({
        status: 'Failure',
        reason: 'NonZeroExitCode',
        details: { causes: [{ reason: 'ExitCode', message: '42' }] },
      });
      expect(parseExecStatus(json)).toEqual({ exitCode: 42, message: '42' });
    });

    it('should pick the ExitCode cause among other causes', () => {
      const json = JSON.stringify({
        status: 'Failure',
        reason: 'NonZeroExitCode',
        details: {
          causes: [
            { reason: 'UnexpectedServerResponse', message: 'whatever' },
            { reason: 'ExitCode', message: '1' },
          ],
        },
      });
      expect(parseExecStatus(json).exitCode).toBe(1);
    });

    it('should return null exit code for Failure without causes', () => {
      const json = JSON.stringify({
        status: 'Failure',
        reason: 'InternalError',
        message: 'something broke',
      });
      const parsed = parseExecStatus(json);
      expect(parsed.exitCode).toBeNull();
      expect(parsed.message).toBe('something broke');
    });

    it('should return null exit code for invalid JSON', () => {
      expect(parseExecStatus('not json at all').exitCode).toBeNull();
    });

    it('should return null exit code for empty text', () => {
      expect(parseExecStatus('').exitCode).toBeNull();
    });

    it('should return null exit code when ExitCode message is not numeric', () => {
      const json = JSON.stringify({
        status: 'Failure',
        details: { causes: [{ reason: 'ExitCode', message: 'oops' }] },
      });
      expect(parseExecStatus(json).exitCode).toBeNull();
    });

    it('should return null exit code for unexpected JSON shape', () => {
      expect(parseExecStatus('{"foo":"bar"}').exitCode).toBeNull();
      expect(parseExecStatus('null').exitCode).toBeNull();
      expect(parseExecStatus('"just a string"').exitCode).toBeNull();
    });
  });

  describe('buildExecUrl', () => {
    const base = {
      baseUrl: 'https://rancher.example.com',
      clusterId: 'c-m-abc123',
      namespace: 'default',
      pod: 'web-0',
      command: 'echo hi',
    };

    it('should convert https to wss and point at the Rancher k8s proxy', () => {
      const url = new URL(buildExecUrl(base));
      expect(url.protocol).toBe('wss:');
      expect(url.pathname).toBe('/k8s/clusters/c-m-abc123/api/v1/namespaces/default/pods/web-0/exec');
    });

    it('should send the command as three repeated params: sh -c <command>', () => {
      const url = new URL(buildExecUrl(base));
      expect(url.searchParams.getAll('command')).toEqual(['sh', '-c', 'echo hi']);
    });

    it('should set stdout/stderr/tty/stdin flags', () => {
      const url = new URL(buildExecUrl(base));
      expect(url.searchParams.get('stdout')).toBe('1');
      expect(url.searchParams.get('stderr')).toBe('1');
      expect(url.searchParams.get('tty')).toBe('0');
      expect(url.searchParams.get('stdin')).toBe('0');
    });

    it('should omit container when not specified', () => {
      const url = new URL(buildExecUrl(base));
      expect(url.searchParams.has('container')).toBe(false);
    });

    it('should include container when specified', () => {
      const url = new URL(buildExecUrl({ ...base, container: 'sidecar' }));
      expect(url.searchParams.get('container')).toBe('sidecar');
    });

    it('should URL-encode special characters in the command', () => {
      const command = 'echo "a b" && ls $HOME; printf \'%s\\n\' done';
      const raw = buildExecUrl({ ...base, command });
      expect(raw).not.toContain('echo "a b"');
      const url = new URL(raw);
      expect(url.searchParams.getAll('command')[2]).toBe(command);
    });

    it('should encode namespace and pod path segments', () => {
      const url = new URL(
        buildExecUrl({ ...base, namespace: 'kube system', pod: 'p od/0' }),
      );
      expect(url.pathname).toContain('/namespaces/kube%20system/pods/p%20od%2F0/exec');
    });

    it('should tolerate a trailing slash on baseUrl', () => {
      const url = new URL(buildExecUrl({ ...base, baseUrl: 'https://rancher.example.com/' }));
      expect(url.pathname.startsWith('/k8s/clusters/')).toBe(true);
      expect(url.pathname).not.toContain('//k8s');
    });
  });
});
