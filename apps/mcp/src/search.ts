/**
 * Re-export the canonical ranker from @inspo/db so the gallery and
 * the MCP server use one search path. `searchScreens` is the hybrid
 * lexical + cosine entry; `lexicalSearch` stays exported for the
 * pure-lexical use cases and smoke-test back-compat.
 */

export {
  lexicalSearch,
  searchScreens,
  findByHostname,
  isUrl,
  hostnameOf,
} from "@inspo/db";
