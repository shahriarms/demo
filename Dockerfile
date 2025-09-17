# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json ./
# Use npm ci for faster, more reliable installs in CI/CD environments
RUN npm ci

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
# Copy installed dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Set Next.js telemetry to disabled
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application for production
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set Next.js telemetry to disabled
ENV NEXT_TELEMETRY_DISABLED 1

# Set the environment to production
ENV NODE_ENV production

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# The server is now started on port 3000 by default.
# The following command is not needed as the server.js file is automatically run.
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
# CMD ["node", "server.js"]
EXPOSE 3000

# The start command is now implicitly handled by the standalone output.
# You can customize the start command by creating a server.js file if needed.
CMD ["node", "server.js"]
