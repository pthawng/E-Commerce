# --- Stage 1: Build Shared Package ---
FROM node:20-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm install
COPY shared/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Copy shared build results
COPY --from=shared-builder /app/shared /app/shared

# Copy backend files
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS App
RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app/backend

# Copy built app and dependencies
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copy shared for runtime resolution (if needed by path aliases)
COPY --from=shared-builder /app/shared/dist ../shared/dist
COPY --from=shared-builder /app/shared/package*.json ../shared/

# Install only production dependencies (optional, already copied node_modules)
# If you want a smaller image, you could do: 
# RUN npm install --omit=dev

# Script to run migrations, seed, and start app
RUN echo '#!/bin/sh' > start.sh && \
    echo 'npx prisma migrate deploy' >> start.sh && \
    echo 'npx prisma db seed' >> start.sh && \
    echo 'node dist/main' >> start.sh && \
    chmod +x start.sh

EXPOSE 4000
CMD ["./start.sh"]
