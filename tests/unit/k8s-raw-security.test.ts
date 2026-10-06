import { describe, it, expect } from 'vitest';
import { isMutatingMethod, assertWriteAllowed, maskSensitiveData } from '../../src/k8s-raw-security.js';

describe('k8s_raw security helpers', () => {
  describe('isMutatingMethod', () => {
    it('should detect mutating methods case-insensitively', () => {
      expect(isMutatingMethod('POST')).toBe(true);
      expect(isMutatingMethod('put')).toBe(true);
      expect(isMutatingMethod('Patch')).toBe(true);
      expect(isMutatingMethod('DELETE')).toBe(true);
    });

    it('should treat GET as non-mutating', () => {
      expect(isMutatingMethod('GET')).toBe(false);
      expect(isMutatingMethod('get')).toBe(false);
    });
  });

  describe('assertWriteAllowed', () => {
    it('should throw for mutating methods without allowWrite', () => {
      expect(() => assertWriteAllowed('DELETE', false)).toThrow(
        'mutations disabled; pass allowWrite: true in this call',
      );
      expect(() => assertWriteAllowed('POST', undefined)).toThrow(
        'mutations disabled; pass allowWrite: true in this call',
      );
      expect(() => assertWriteAllowed('PATCH', false)).toThrow();
      expect(() => assertWriteAllowed('PUT', false)).toThrow();
    });

    it('should pass mutating methods when allowWrite is true', () => {
      expect(() => assertWriteAllowed('DELETE', true)).not.toThrow();
      expect(() => assertWriteAllowed('POST', true)).not.toThrow();
    });

    it('should always pass GET', () => {
      expect(() => assertWriteAllowed('GET', false)).not.toThrow();
      expect(() => assertWriteAllowed('GET', undefined)).not.toThrow();
    });
  });

  describe('maskSensitiveData', () => {
    const singleSecret = {
      kind: 'Secret',
      metadata: { name: 'test', namespace: 'default' },
      data: { password: 'c2VjcmV0', token: 'YWJj' },
      stringData: { apiKey: 'plain-key' },
    };

    it('should mask single Secret data and stringData', () => {
      const masked: any = maskSensitiveData(singleSecret);
      expect(masked.data.password).toBe('***');
      expect(masked.data.token).toBe('***');
      expect(masked.stringData.apiKey).toBe('***');
    });

    it('should not mutate the original object', () => {
      maskSensitiveData(singleSecret);
      expect(singleSecret.data.password).toBe('c2VjcmV0');
      expect(singleSecret.stringData.apiKey).toBe('plain-key');
    });

    it('should mask Secrets inside a list (items[])', () => {
      const list = {
        kind: 'SecretList',
        items: [
          { ...singleSecret, metadata: { name: 'a' } },
          { ...singleSecret, metadata: { name: 'b' } },
        ],
      };
      const masked: any = maskSensitiveData(list);
      expect(masked.items[0].data.password).toBe('***');
      expect(masked.items[1].stringData.apiKey).toBe('***');
    });

    it('should mask list items WITHOUT kind (real K8s list shape: kind only on the list)', () => {
      // Live-подтверждено: элементы SecretList не несут kind/apiVersion.
      const list = {
        kind: 'SecretList',
        apiVersion: 'v1',
        items: [
          { metadata: { name: 'a' }, type: 'Opaque', data: { tls: 'LS0tLS1C' } },
          { metadata: { name: 'b' }, type: 'kubernetes.io/tls', data: { 'tls.crt': 'LS0t', 'tls.key': 'LS0t' } },
        ],
      };
      const masked: any = maskSensitiveData(list);
      expect(masked.items[0].data.tls).toBe('***');
      expect(masked.items[1].data['tls.crt']).toBe('***');
      expect(masked.items[1].data['tls.key']).toBe('***');
    });

    it('should mask kind:Secret items inside a generic List', () => {
      const list = {
        kind: 'List',
        items: [
          { kind: 'Secret', metadata: { name: 's' }, data: { k: 'raw' } },
          { kind: 'ConfigMap', metadata: { name: 'c' }, data: { k: 'raw' } },
        ],
      };
      const masked: any = maskSensitiveData(list);
      expect(masked.items[0].data.k).toBe('***');
      // ConfigMap data must stay untouched
      expect(masked.items[1].data.k).toBe('raw');
    });

    it('should mask SecretList items regardless of nesting depth', () => {
      const payload = {
        spec: {
          kind: 'SecretList',
          items: [{ metadata: {}, data: { nested: 'value' } }],
        },
      };
      const masked: any = maskSensitiveData(payload);
      expect(masked.spec.items[0].data.nested).toBe('***');
    });

    it('should leave non-Secret objects untouched', () => {
      const pod = {
        kind: 'Pod',
        metadata: { name: 'p' },
        spec: { containers: [{ name: 'c' }] },
      };
      const masked: any = maskSensitiveData(pod);
      expect(masked).toEqual(pod);
    });

    it('should mask Secret nested deeper (e.g. inside managedFields-free trees)', () => {
      const nested = {
        kind: 'SomeList',
        items: [{ foo: { bar: singleSecret } }],
      };
      const masked: any = maskSensitiveData(nested);
      expect(masked.items[0].foo.bar.data.password).toBe('***');
    });

    it('should handle objects without data/stringData gracefully', () => {
      const emptySecret = { kind: 'Secret', metadata: { name: 'empty' } };
      const masked: any = maskSensitiveData(emptySecret);
      expect(masked).toEqual(emptySecret);
    });
  });
});
