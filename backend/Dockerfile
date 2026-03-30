# --- Stage 1: Build Shared Package ---
FROM node:22-bookworm-slim AS shared-builder
WORKDIR /app/shared
# Copy only package files first to cache dependencies
COPY shared/package*.json ./
RUN npm ci
# Now copy the source code (will be filtered by root .dockerignore)
COPY shared/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:22-bookworm-slim AS backend-builder
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend

# Copy shared build results
COPY --from=shared-builder /app/shared /app/shared

# Copy backend files
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./

# Generate Prisma Client (Set dummy DATABASE_URL to pass validation during build)
# Explicitly run generate to establish types for the build
RUN DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy ./node_modules/.bin/prisma generate

# Build NestJS App
RUN npm run build

# --- Stage 3: Runner ---
FROM node:22-bookworm-slim AS runner
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend

# Copy built app and dependencies
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/src ./src
COPY --from=backend-builder /app/backend/tsconfig.json ./

# Copy shared for runtime resolution
COPY --from=shared-builder /app/shared/dist ../shared/dist
COPY --from=shared-builder /app/shared/package*.json ../shared/

# Re-generate Prisma Client in the final environment ensuring correctly linked binaries
RUN DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy ./node_modules/.bin/prisma generate

# Script to run migrations, seed, and start app
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "Applying Database Migrations (Production Mode)..."' >> start.sh && \
    echo './node_modules/.bin/prisma migrate deploy || echo "Migration failed, continuing..."' >> start.sh && \
    echo 'echo "Seeding database..."' >> start.sh && \
    echo './node_modules/.bin/prisma db seed || echo "Seeding failed, continuing..."' >> start.sh && \
    echo 'echo "Starting application..."' >> start.sh && \
    echo 'node dist/main' >> start.sh && \
    chmod +x start.sh

EXPOSE 4000
CMD ["./start.sh"]
