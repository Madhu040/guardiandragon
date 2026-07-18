import "./db/migrate.js";
import { serve } from "@hono/node-server";
import { app } from "./index.js";
import { serverConfig } from "./config.js";

serve({ fetch: app.fetch, port: serverConfig.port }, () => {
  console.log(`TruNorth API running on http://localhost:${serverConfig.port}`);
});
