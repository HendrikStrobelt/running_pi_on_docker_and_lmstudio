# pi in Docker on Apple Silicon

Run [`pi`](https://github.com/earendil-works/pi-coding-agent) (the `@earendil-works/pi-coding-agent` CLI) inside a sandboxed Docker container on an M-series Mac, with a local model served by LM Studio. Optionally use Anthropic models by providing an API key.

**This setup allows you to use the same config/skills/extensions inside and outside the container**
## Repo contents

| File | Purpose |
| --- | --- |
| `Dockerfile.pi` | Builds the `pi-sandbox` image: Node 24 + `pi` + basic CLI tools (`git`, `ripgrep`, `curl`), entrypoint `pi`. |
| `models.json` | Registers an `lmstudio` provider/model (`qwen/qwen3.6-35b-a3b`) so `pi` can talk to LM Studio over the OpenAI-compatible API. |
| `lmstudio-baseurl-override.ts` | A `pi` extension that overrides the `lmstudio` provider's `baseUrl` at runtime from the `LM_STUDIO_BASE_URL` env var — this is what lets the container reach LM Studio running on the Mac host via `host.docker.internal`. |

## 0. Install the prerequisites

- **pi** — install with pnpm (or npm/yarn):
  ```bash
  pnpm add -g @earendil-works/pi-coding-agent
  ```
- **Rancher Desktop** (Docker runtime for macOS): <https://rancherdesktop.io/>
- **LM Studio**: <https://lmstudio.ai/>

## 1. Downloads & build

1. In LM Studio, download the **Qwen 3.6-35B-A3B** model and load it so it's served on `http://localhost:1234/v1`.

   > **IMPORTANT:** In LM Studio, go to **Developer → Local Server → Server Settings** and turn on **CORS** and **Serve on Local Network**. Without these, the container won't be able to reach LM Studio on the host via `host.docker.internal`.

2. Build the sandbox image from this repo:
   ```bash
   docker build -t pi-sandbox -f Dockerfile.pi .
   ```

## 2. Install the pi extension on the host

`pi` keeps its config/extensions under `~/.pi/agent`, and that directory gets bind-mounted into the container in step 3 — so set it up on the host first.

1. Run `pi` once and quit immediately, just to let it create `~/.pi/agent`:
   ```bash
   pi
   # then exit
   ```
2. Copy this repo's model config into place:
   ```bash
   cp models.json ~/.pi/agent/models.json
   ```
3. Copy the LM Studio base-URL override extension into place:
   ```bash
   mkdir -p ~/.pi/agent/extensions
   cp lmstudio-baseurl-override.ts ~/.pi/agent/extensions/
   ```

## 3. Run the container

Optionally export `ANTHROPIC_API_KEY` in your shell (e.g. `export ANTHROPIC_API_KEY=sk-ant-...`) if you want to use Anthropic models. Then from the project/workspace directory you want mounted in:

```bash
docker run --rm -it \
  -v "$PWD:/workspace" \
  -v "$HOME/.pi/agent:/root/.pi/agent" \
 -e LM_STUDIO_BASE_URL="http://host.docker.internal:1234/v1" \
 -p 8787:8787 \
 -e PI_WEB_HOST=0.0.0.0 \
 pi-sandbox
```

> **Optional:** To use Anthropic models, add `-e ANTHROPIC_API_KEY` to the command above (make sure `ANTHROPIC_API_KEY` is exported in your shell).

- `-v "$PWD:/workspace"` mounts your current project into the sandbox at `/workspace`.
- `-v "/Users/hen/.pi/agent:/root/.pi/agent"` shares the host's `pi` config (including `models.json` and the extension you just copied) with the container.
- `LM_STUDIO_BASE_URL` points the `lmstudio` provider at LM Studio running on the Mac host, reachable from inside the container via Docker's `host.docker.internal` DNS name.

## Testing the connection

Once you're inside the running container's `pi` prompt, check that it can reach LM Studio on the host:

```
!!curl http://host.docker.internal:1234/v1/models
```

You should get back a JSON list that includes `qwen/qwen3.6-35b-a3b`. If it hangs or errors, confirm LM Studio is running and serving on port `1234` on the host, and that Rancher Desktop's VM has `host.docker.internal` resolution enabled (default on recent versions).
