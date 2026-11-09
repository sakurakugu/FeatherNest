# syntax=docker/dockerfile:1
FROM node:24-bookworm AS builder
WORKDIR /app

# 腾讯云内网软件源：本机在腾讯云 VPC 内解析到内网链路，避免跨境访问 debian/pypi 官方源。
ARG TENCENT_MIRROR=http://mirrors.tencentyun.com
# Playwright 浏览器镜像
ARG PLAYWRIGHT_MIRROR_CDN=https://cdn.npmmirror.com/binaries/chrome-for-testing
ARG PLAYWRIGHT_MIRROR_PW=https://cdn.npmmirror.com/binaries/playwright
# Playwright 版本需与 apps/blog/scripts/requirements.txt 中的版本保持一致。
ARG PLAYWRIGHT_VERSION=1.58.0

# 先装系统依赖与 Playwright，再拷贝业务代码：
# 业务代码变动不会让这层缓存失效，日常改前端无需重装浏览器。
RUN sed -i "s|http://deb.debian.org|${TENCENT_MIRROR}|g; s|http://security.debian.org|${TENCENT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv unzip \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/ssg \
    && /opt/ssg/bin/pip install --no-cache-dir -i "${TENCENT_MIRROR}/pypi/simple" --trusted-host mirrors.tencentyun.com playwright==${PLAYWRIGHT_VERSION}
ENV PATH="/opt/ssg/bin:${PATH}"

# ffmpeg 在 npmmirror 上位于 playwright 前缀下，与 chromium 的 chrome-for-testing 前缀不同，
# 而 PLAYWRIGHT_DOWNLOAD_HOST 会作用于全部下载，因此先手动解压进缓存目录，后续安装即跳过下载。
# 注意：这里不能用 --mount=type=cache，缓存目录不会写进镜像层，SSG 运行时会找不到浏览器。
RUN mkdir -p /root/.cache/ms-playwright/ffmpeg-1011 \
    && curl -fsSL "${PLAYWRIGHT_MIRROR_PW}/builds/ffmpeg/1011/ffmpeg-linux.zip" -o /tmp/ffmpeg.zip \
    && unzip -q -o /tmp/ffmpeg.zip -d /root/.cache/ms-playwright/ffmpeg-1011 \
    && touch /root/.cache/ms-playwright/ffmpeg-1011/INSTALLATION_COMPLETE \
    && chmod +x /root/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux \
    && rm -f /tmp/ffmpeg.zip \
    && PLAYWRIGHT_DOWNLOAD_HOST="${PLAYWRIGHT_MIRROR_CDN}" playwright install --with-deps chromium

COPY --parents package.json package-lock.json ./
COPY --parents apps/blog/package.json apps/console/package.json ./
COPY --parents packages/*/package.json packages/modules/*/package.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --workspace blog --workspace console --include-workspace-root=true --no-audit --fund=false
COPY apps/blog ./apps/blog
COPY apps/console ./apps/console
COPY configs ./configs
COPY packages ./packages
ARG SSG_API_BASE_URL=https://www.sakurakugu.com/api/v1
ARG SITE_URL=https://www.sakurakugu.com
ENV SSG_API_BASE_URL=${SSG_API_BASE_URL} SITE_URL=${SITE_URL} VITE_API_BASE=/api/v1 VITE_TWIKOO_ENV_ID=/twikoo
RUN npm run build --workspace console && npm run build --workspace blog
FROM nginx:alpine
COPY --from=builder /app/apps/blog/dist /usr/share/nginx/html
COPY --from=builder /app/apps/console/dist /usr/share/nginx/html/admin
COPY apps/cloud/nginx.conf /etc/nginx/conf.d/default.conf
