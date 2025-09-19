
# 1. Base Image
FROM node:18-alpine AS base

# 2. Builder Stage
FROM base AS builder
# Set working directory
WORKDIR /app
# Install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install
# Copy source files
COPY . .
# Build the Next.js app
RUN npm run build

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The aports and environment variables are defined in docker-compose.yml
# EXPOSE 3000
# ENV PORT 3000

# Run the app
# The user will be created in the base image
CMD ["node", "server.js"]
