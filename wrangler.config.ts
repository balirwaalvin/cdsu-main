import { defineWranglerConfig } from "wrangler/experimental-config";

// dist/ is produced by `npm run build`, which copies only the website's own files.
export default defineWranglerConfig({
  assetsDirectory: "dist",
});
