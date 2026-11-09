# syntax=docker/dockerfile:1
FROM node:24-bookworm AS builder
WORKDIR /app
COPY --parents package.json package-lock.json ./
COPY --parents apps/blog/package.json apps/console/package.json ./
COPY --parents packages/*/package.json packages/modules/*/package.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --workspace blog --workspace console --include-workspace-root=true --no-audit --fund=false
COPY apps/blog ./apps/blog
COPY apps/console ./apps/console
COPY configs ./configs
COPY packages ./packages
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/ssg
ENV PATH="/opt/ssg/bin:${PATH}"
RUN pip install --no-cache-dir -r apps/blog/scripts/requirements.txt && python -m playwright install --with-deps chromium
ARG SSG_API_BASE_URL=https://www.sakurakugu.com/api/v1
ARG SITE_URL=https://www.sakurakugu.com
ENV SSG_API_BASE_URL=${SSG_API_BASE_URL} SITE_URL=${SITE_URL} VITE_API_BASE=/api/v1 VITE_TWIKOO_ENV_ID=/twikoo
RUN npm run build --workspace console && npm run build --workspace blog
FROM nginx:alpine
COPY --from=builder /app/apps/blog/dist /usr/share/nginx/html
COPY --from=builder /app/apps/console/dist /usr/share/nginx/html/admin
COPY apps/cloud/nginx.conf /etc/nginx/conf.d/default.conf
