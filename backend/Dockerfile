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

CMD ["node", "dist/main.js"]