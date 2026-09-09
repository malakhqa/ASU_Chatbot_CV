# syntax=docker/dockerfile:1
# ============================================================
# Frontend image — build the Vite bundle, serve it with nginx.
# nginx also reverse-proxies /api to the backend container, so the
# browser bundle talks to the same origin (no CORS, backend port
# need not be published).
# ============================================================

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty base URL => the axios client calls "/api" on the current origin,
# which nginx proxies to the backend. Override only if the API lives elsewhere.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Use 127.0.0.1 (not "localhost" — that resolves to ::1 in the container and
# nginx only listens on IPv4).
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
