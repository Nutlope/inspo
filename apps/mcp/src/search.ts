/**
 * Re-export the canonical lexical search from @inspo/db so the gallery
 * and the MCP server use one ranker. The shim stays for back-compat
 * with smoke.ts which imports `lexicalSearch` from this path.
 */

export { lexicalSearch, findByHostname, isUrl, hostnameOf } from "@inspo/db";
