FROM oven/bun:1 AS build

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (Bun will create bun.lockb if it doesn't exist)
RUN bun install

# Copy source code
COPY ./src ./src
COPY ./tsconfig.json ./
COPY ./drizzle.config.ts ./

# Build the application
ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

# Production stage
FROM gcr.io/distroless/base

WORKDIR /app

# Copy the compiled server
COPY --from=build /app/server server

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run the server
CMD ["./server"]
