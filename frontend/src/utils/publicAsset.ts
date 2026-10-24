/**
 * URL of a file in public/, which Vite doesn't rewrite when it's referenced from code.
 * The app can be served under a path prefix (VITE_BASE=/omnistore/), so '/icons.svg' would miss it.
 */
export const publicAsset = (path: string): string => import.meta.env.BASE_URL + path.replace(/^\//, '');
