import { createApp } from "@/lib/app";
import { API_COMPILE_URL, API_REGISTRY_URL, WEB_URL } from "@/lib/constants";

const root = createApp().get("/", (c) =>
  c.json({
    timestamp: Date.now(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WEB_URL,
      API_COMPILE_URL,
      API_REGISTRY_URL,
    },
  }),
);

export default root;
