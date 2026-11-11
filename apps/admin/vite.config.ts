import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { authConfiguration } from "./src/lib/auth/config.ts";
import path from "node:path";

const config = defineConfig(({ command }) => {
  // Builds contain no deployment credentials; validate Node development only.
  if (command !== "build") authConfiguration(process.env);
  return {
    resolve: {
      alias: { "zod/v4": path.resolve("node_modules/zod/v4/index.js") },
      tsconfigPaths: true,
    },
    plugins: [
      devtools({
        injectSource: {
          enabled: true,
          ignore: {
            components: ["FullCalendar"],
          },
        },
      }),
      tailwindcss(),
      tanstackStart(),
      nitro({
        preset: command === "build" ? "vercel" : undefined,
      }),
      viteReact(),
    ],
  };
});

export default config;
