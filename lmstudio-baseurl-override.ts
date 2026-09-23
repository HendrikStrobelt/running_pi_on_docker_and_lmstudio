/**
 * LM Studio Base URL Override Extension
 *
 * Overrides the LM Studio provider's baseUrl with a configurable
 * value from the LM_STUDIO_BASE_URL environment variable.
 *
 * Usage:
 *   # Override to a different server/port
 *   export LM_STUDIO_BASE_URL=http://192.168.1.100:1234/v1
 *   pi
 *
 *   # Or inline
 *   LM_STUDIO_BASE_URL=http://remote-server:1234/v1 pi
 *
 *   # If the env var is not set, the default (localhost:1234) is used.
 *
 * Reload the extension with /reload after changing the env var.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_BASE_URL = "http://localhost:1234/v1";

export default function (pi: ExtensionAPI) {
  const baseUrl = process.env.LM_STUDIO_BASE_URL || DEFAULT_BASE_URL;

  pi.registerProvider("lmstudio", {
    baseUrl,
    apiKey: "lmstudio",
    api: "openai-completions",
  });
}
