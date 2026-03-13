export const APP_VERSION_STORAGE_KEY = "provodnik.app-version";

function resolveAppVersion() {
  const explicitVersion = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  if (explicitVersion) return explicitVersion;

  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID?.trim();
  if (deploymentId) return deploymentId;

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (commitSha) return commitSha.slice(0, 12);

  return "dev";
}

export const APP_VERSION = resolveAppVersion();
