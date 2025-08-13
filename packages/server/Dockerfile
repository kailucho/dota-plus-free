########### deps stage ###########
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/shared/package.json packages/shared/package.json
# Install workspaces with dev deps for build
RUN npm ci --workspaces

########### build stage ###########
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# copy root workspace files needed by npm -w
COPY package.json package-lock.json tsconfig.base.json ./
# copy sources
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
RUN npm run -w @dba/shared build \
 && npm run -w @dba/server build

########### runtime stage ###########
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/package.json
COPY packages/shared/package.json packages/shared/package.json
# Install only production deps for needed workspaces
RUN npm ci --omit=dev --workspaces --workspace=@dba/server --workspace=@dba/shared
# Copy built artifacts
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/server/dist ./packages/server/dist

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "run", "-w", "@dba/server", "start"]
