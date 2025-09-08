FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY ../../package.json ../../package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy app sources
COPY . .

# Build static Next.js app
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app .
EXPOSE 3004
CMD ["npm", "run", "start"]
