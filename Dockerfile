# Stage 1: Install production deps
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN bun install --production --no-cache

# Stage 2: Runtime
FROM oven/bun:1-alpine
WORKDIR /app
# Production mode: disables Bun's dev error overlay (which leaks cwd, paths,
# and stack frames) and enables other production behaviors.
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ src/
COPY public/ public/

# Run as non-root user
RUN adduser -D -H appuser && chown -R appuser /app
USER appuser

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]