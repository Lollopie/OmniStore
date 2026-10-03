# Stage 1: Development / Build
FROM node:24-alpine AS development

WORKDIR /usr/src/

COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

WORKDIR /usr/src/shared
RUN npm install
COPY shared/ .
RUN npm run build

WORKDIR /usr/src/backend
RUN npm install
COPY backend/ .
RUN npm run build


# Stage 2: Production Execution
FROM node:24-alpine AS production

WORKDIR /usr/src/backend

COPY --from=development /usr/src/shared /usr/src/shared
COPY --from=development /usr/src/backend/.env.prod ./
COPY --from=development /usr/src/backend/package*.json ./
COPY --from=development /usr/src/backend/dist ./dist

RUN npm ci --only=production

RUN apk add shadow && usermod -a -G 1000 node

# Render's free plan has no pre-deploy step, so migrations run on startup. A
# failed migration stops the container before the app starts; exec hands
# signals straight to node.
CMD ["sh", "-c", "npm run migration:run:prod && exec node dist/main.js"]