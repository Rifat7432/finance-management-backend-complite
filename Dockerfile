# syntax=docker/dockerfile:1

# Build stage
FROM node:18.18.2-slim AS builder
WORKDIR /app

# Set build-time environment
ENV NODE_ENV=development

# Copy only package.json and package-lock.json for dependency installation
COPY --link package.json package-lock.json ./

# Install dependencies with cache for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application source code
COPY --link . .

# Build the TypeScript code with fixed memory limits for 1GB VPS
RUN --mount=type=cache,target=/root/.npm \
    NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=128" \
    npm run build

# Switch to production and reinstall dependencies
ENV NODE_ENV=production
RUN --mount=type=cache,target=/root/.npm \
    rm -rf node_modules && \
    npm ci --only=production --ignore-scripts

# Production stage
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create a non-root user and group
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy built app and production dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create an (optional) views directory at runtime. If your project includes
# `views` in the source, you can change this back to a COPY. Many setups
# prefer creating the directory and mounting/adding templates during CI/CD.
RUN mkdir -p /app/views \
    && chown -R appuser:appgroup /app/views

# Copy any other runtime assets (e.g., winston logs directory structure)
# Do not copy host log files into the image (they're excluded via .dockerignore).
# Create the winston log directory structure at build time so runtime logging
# has the expected folders, and set ownership to the non-root appuser.
RUN mkdir -p /app/winston/error /app/winston/success \
    && chown -R appuser:appgroup /app/winston

# If your project includes a firebase service account JSON in the repo root,
# copy it into the final image so the firebase helper can require it at runtime.
# (File name must match the import path used in source.)
COPY --from=builder /app/finace-management-72997-firebase-adminsdk-fbsvc-4bf112f98e.json ./
RUN chown appuser:appgroup /app/finace-management-72997-firebase-adminsdk-fbsvc-4bf112f98e.json || true

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

USER appuser

CMD ["node", "dist/server.js"]
