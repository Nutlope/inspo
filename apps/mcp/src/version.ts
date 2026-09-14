/**
 * The version the server reports in MCP `serverInfo` and `--version`.
 *
 * The npm bundle gets `__INSPO_VERSION__` defined at build time
 * (scripts/build-npm.mjs). The hosted route on Vercel has no such
 * define, so it reports the deploy's commit instead; anything else is
 * a dev checkout.
 */
declare const __INSPO_VERSION__: string;

export const SERVER_VERSION: string =
  typeof __INSPO_VERSION__ === "string"
    ? __INSPO_VERSION__
    : process.env.VERCEL_GIT_COMMIT_SHA
      ? `hosted-${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
      : "0.0.0-dev";
