# Backend (Express + TypeScript) Docker image
#
# This image includes compilers/runtimes because this project executes user code:
# - C++: g++
# - Java: javac/java
# - Python: python3
#
# NOTE: Running untrusted code inside the same container as your API is NOT safe.
# See the docs in `docker/README-devops.md` for how to isolate code execution.

FROM node:20-bookworm-slim

# Install language toolchains used by `src/services/codeExecutor.ts`.
# - build-essential includes g++ and related tools
# - openjdk provides javac/java
# - python3 for Python submissions
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    openjdk-17-jdk-headless \
    python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy only package files first to maximize Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies exactly as pinned in package-lock.json
RUN npm ci

# Copy the rest of the backend source
COPY . .

# Build TypeScript -> dist/
RUN npm run build

# For production, Node will use dist/index.js (see package.json "start")
ENV NODE_ENV=production

# The server reads PORT from env; 3001 is the default in `.env.example`.
EXPOSE 3001

CMD ["npm","run","start"]
