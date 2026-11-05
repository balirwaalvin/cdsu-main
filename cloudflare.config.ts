import { defineConfig } from "cf/config";

// The CDSU website: static files only, served by Cloudflare. See "Hosting" in README.md.
export default defineConfig({
  accountId: "4b57c679812476bf27dafdf5c3a3f1fb",
  worker: {
    name: "cdsu-site",
    compatibilityDate: "2026-11-05",
    observability: { enabled: true },
    domains: ["cdsu.online", "www.cdsu.online"],
  },
});
