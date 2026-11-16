import { createApp } from "@/lib/app";
import { API_COMPILE_URL, API_REGISTRY_URL, WEB_URL } from "@/lib/constants";
import { createWakeHandler } from "@/lib/wake";

const root = createApp()
  .get("/", (c) =>
    c.json({
      timestamp: Date.now(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        WEB_URL,
        API_COMPILE_URL,
        API_REGISTRY_URL,
      },
    }),
  )
  // Wakes api-compile before a compile, called by the web's script page. Not
  // rate-limited: it's bounded by its own interval (lib/wake.ts).
  .post("/wake", createWakeHandler());

export default root;
