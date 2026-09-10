# Stage 1: Install production deps
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN bun install --production

# Stage 2: Runtime
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ src/
COPY public/ public/

# Run as non-root user
RUN adduser -D -H appuser && chown -R appuser /app
USER appuser

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]