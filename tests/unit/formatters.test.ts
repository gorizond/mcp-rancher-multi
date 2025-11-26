import { describe, expect, it } from 'vitest';
import { pickFields, summarizeFleetBundleDeployment, summarizeFleetGitRepo } from '../../src/formatters.js';

describe('formatters', () => {
  it('pickFields should return source when no fields provided', () => {
    const source = { a: 1, b: 2 };
    expect(pickFields(source)).toBe(source);
  });

  it('pickFields should select only requested fields', () => {
    const source = { a: 1, b: 2, c: 3 };
    expect(pickFields(source, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('summarizeFleetGitRepo should return default summary fields', () => {
    const repo = {
      metadata: { name: 'r1', namespace: 'fleet-default' },
      spec: { repo: 'https://example/repo.git', branch: 'main', paths: ['k8s/'], paused: false },
      status: { commit: 'abcd', lastSynced: 'now', readyClusters: 2, desiredReadyClusters: 3 }
    };
    const summary = summarizeFleetGitRepo(repo);
    expect(summary).toEqual({
      name: 'r1',
      namespace: 'fleet-default',
      repo: 'https://example/repo.git',
      branch: 'main',
      paths: ['k8s/'],
      paused: false,
      revision: 'abcd',
      lastSynced: 'now'
    });
  });

  it('summarizeFleetGitRepo should honor custom fields', () => {
    const repo = {
      metadata: { name: 'r1', namespace: 'fleet-default' },
      spec: { repo: 'https://example/repo.git', branch: 'main' },
      status: { conditions: [{ type: 'Ready' }] }
    };
    const summary = summarizeFleetGitRepo(repo, ['name', 'conditions']);
    expect(summary).toEqual({
      name: 'r1',
      conditions: [{ type: 'Ready' }]
    });
  });

  it('summarizeFleetBundleDeployment should return default fields', () => {
    const bd = {
      metadata: { name: 'bd1', namespace: 'fleet-default' },
      status: { ready: true, nonReady: 0, desiredReady: 2, summary: { ready: 2 }, display: { readyBundleDeployments: '2/2' } }
    };
    const summary = summarizeFleetBundleDeployment(bd);
    expect(summary).toEqual({
      name: 'bd1',
      namespace: 'fleet-default',
      ready: true,
      nonReady: 0,
      desiredReady: 2,
      summary: { ready: 2 },
      display: { readyBundleDeployments: '2/2' }
    });
  });

  it('summarizeFleetBundleDeployment should pick requested fields', () => {
    const bd = { metadata: { name: 'bd1' }, status: { ready: true, nonReady: 1 } };
    const summary = summarizeFleetBundleDeployment(bd, ['name', 'ready']);
    expect(summary).toEqual({ name: 'bd1', ready: true });
  });
});
