export * as schema from "./schema";
export { hasDatabase, getDb } from "./client";
export {
  getAllScreens,
  findScreen,
  findSimilar,
  findSite,
  getMultiPageSites,
  getAllSites,
  findComponents,
  type SiteTile,
  type ComponentHit,
  getAllCollections,
  findCollection,
  screensInCollection,
  getPendingScreens,
  updateScreenStatus,
  updateScreenCuratorNote,
  getReferenceComponents,
  findReferenceComponent,
  type ScreenFilter,
  type ScreenSort,
  type SiteSummary,
} from "./queries";
export { renderDesignMd } from "./design-md";
export {
  lexicalSearch,
  searchScreens,
  findByHostname,
  hostnameOf,
  isUrl,
} from "./search";
export { embedQuery, loadSidecar, setSidecar, cosineSim, EMBEDDING_DIMS } from "./vector";
export { setCatalogue } from "./queries";
export { loadCatalogueFromUrl, ensureCatalogue, type CatalogueLoadResult } from "./load-remote";
export { screens, collections } from "./fixtures";
