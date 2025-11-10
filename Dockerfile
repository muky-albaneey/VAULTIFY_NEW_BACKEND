# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy source code
# COPY . .

# # Build the application
# RUN npm run build

# # Expose port
# EXPOSE 3000

# # Start the application
# CMD ["npm", "run", "start:prod"]
# 1) Install all deps (incl. dev)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# If you don't already have it, ensure @nestjs/cli is a devDependency
# and that "build": "nest build" exists in package.json
RUN npm run build

# 3) Runtime: only production deps + built files
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Install all deps (including dev) for running migrations with TypeScript
RUN npm ci && npm cache clean --force
COPY --from=builder /app/dist ./dist
# Copy source files needed for migrations (TypeORM needs TS files to run migrations)
COPY --from=builder /app/src/database ./src/database
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/src/entities ./src/entities
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# keep your uploads dir writeable
RUN mkdir -p /app/uploads
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
