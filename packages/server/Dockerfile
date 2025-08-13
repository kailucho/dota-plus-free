# Node 20 Alpine for small image
FROM node:20-alpine

WORKDIR /app

# Install deps only for server + shared as needed
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev --workspace=@dba/server --workspace=@dba/shared

# Copy source
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Build shared and server
RUN npm run -w @dba/shared build \
 && npm run -w @dba/server build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "run", "-w", "@dba/server", "start"]
