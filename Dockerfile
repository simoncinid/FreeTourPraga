FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
FROM base AS build
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG NEXT_PUBLIC_FACEBOOK_URL
ARG NEXT_PUBLIC_TIKTOK_URL
ARG NEXT_PUBLIC_YOUTUBE_URL
ARG NEXT_PUBLIC_TRIPADVISOR_URL
ARG NEXT_PUBLIC_TRIPADVISOR_WIDGET_SCRIPT_SRC
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL \
    NEXT_PUBLIC_FACEBOOK_URL=$NEXT_PUBLIC_FACEBOOK_URL \
    NEXT_PUBLIC_TIKTOK_URL=$NEXT_PUBLIC_TIKTOK_URL \
    NEXT_PUBLIC_YOUTUBE_URL=$NEXT_PUBLIC_YOUTUBE_URL \
    NEXT_PUBLIC_TRIPADVISOR_URL=$NEXT_PUBLIC_TRIPADVISOR_URL \
    NEXT_PUBLIC_TRIPADVISOR_WIDGET_SCRIPT_SRC=$NEXT_PUBLIC_TRIPADVISOR_WIDGET_SCRIPT_SRC
RUN npm run build && npm prune --omit=dev --ignore-scripts
FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN groupadd -g 1001 app && useradd -m -u 1001 -g app app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/scripts/worker.mjs ./scripts/worker.mjs
COPY --from=build --chown=app:app /app/scripts/sync-preview-content.mjs ./scripts/sync-preview-content.mjs
COPY --from=build --chown=app:app /app/scripts/seo-content-merge.mjs /app/scripts/seo-editorial-merge.mjs /app/scripts/sync-seo-preview.mjs ./scripts/
COPY --from=build --chown=app:app /app/src/content/seo-import.json /app/src/content/seo-editorial.json ./src/content/
USER app
EXPOSE 3000
CMD ["node","server.js"]
