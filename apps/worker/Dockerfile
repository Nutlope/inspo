## Inspo capture worker — Playwright + Node on a real VM.
##
## Built off Microsoft's Playwright image so Chromium and its system
## libraries are present without us managing apt packages by hand.

FROM mcr.microsoft.com/playwright:v1.49.1-noble

ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

# pnpm via corepack — pinned to keep CI deterministic
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace metadata first so dependency install can be cached
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/taxonomy/package.json packages/taxonomy/

RUN pnpm install --frozen-lockfile --filter @inspo/worker...

# Copy the rest
COPY apps/worker apps/worker
COPY packages packages

WORKDIR /app/apps/worker

# Captures are written here — mount a Fly volume to persist them
VOLUME /app/apps/worker/captures

# Default: open a shell. Run a one-off capture via:
#   fly ssh console -C "pnpm capture https://example.com"
CMD ["bash"]
