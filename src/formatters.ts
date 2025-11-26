export type FleetGitRepoSummary = {
  name?: string;
  namespace?: string;
  repo?: string;
  branch?: string;
  paths?: string[];
  paused?: boolean;
  revision?: string;
  lastSynced?: string;
  conditions?: any;
  readyClusters?: number;
  desiredReadyClusters?: number;
};

export type FleetBundleDeploymentSummary = {
  name?: string;
  namespace?: string;
  ready?: boolean;
  nonReady?: number;
  desiredReady?: number;
  summary?: any;
  display?: any;
};

export function pickFields<T extends Record<string, any>>(source: T, fields?: string[]): Partial<T> {
  if (!fields || fields.length === 0) return source;
  return fields.reduce<Partial<T>>((acc, key) => {
    if (key in source) {
      (acc as any)[key] = (source as any)[key];
    }
    return acc;
  }, {});
}

export function summarizeFleetGitRepo(repo: any, fields?: string[]): FleetGitRepoSummary {
  const summary: FleetGitRepoSummary = {
    name: repo?.metadata?.name,
    namespace: repo?.metadata?.namespace,
    repo: repo?.spec?.repo,
    branch: repo?.spec?.branch,
    paths: repo?.spec?.paths,
    paused: repo?.spec?.paused || false,
    revision: repo?.status?.commit || repo?.status?.commitId,
    lastSynced: repo?.status?.lastSynced,
    conditions: repo?.status?.conditions,
    readyClusters: repo?.status?.readyClusters,
    desiredReadyClusters: repo?.status?.desiredReadyClusters
  };

  const defaultFields = ['name', 'namespace', 'repo', 'branch', 'paths', 'paused', 'revision', 'lastSynced'];
  const targetFields = fields && fields.length ? fields : defaultFields;
  return pickFields(summary, targetFields) as FleetGitRepoSummary;
}

export function summarizeFleetBundleDeployment(bd: any, fields?: string[]): FleetBundleDeploymentSummary {
  const summary: FleetBundleDeploymentSummary = {
    name: bd?.metadata?.name,
    namespace: bd?.metadata?.namespace,
    ready: bd?.status?.ready,
    nonReady: bd?.status?.nonReady,
    desiredReady: bd?.status?.desiredReady,
    summary: bd?.status?.summary,
    display: bd?.status?.display
  };

  const defaultFields = ['name', 'namespace', 'ready', 'nonReady', 'desiredReady', 'summary', 'display'];
  const targetFields = fields && fields.length ? fields : defaultFields;
  return pickFields(summary, targetFields) as FleetBundleDeploymentSummary;
}
