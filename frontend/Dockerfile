# Frontend (React + Vite) build + Nginx static server
#
# Vite environment variables (like VITE_API_URL) are normally baked into the
# static build output at *build time*.
#
# That means if you change the API URL, you typically rebuild this image.

# ---- Build stage ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite reads `VITE_*` variables at build time and bakes them into the static output.
# We pass `VITE_API_URL` as a build argument from docker-compose.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Runtime stage (serving static files) ----
FROM nginx:1.27-alpine

# Copy built static files to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Custom Nginx config:
# - Serves the SPA correctly (React Router deep links won't 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
