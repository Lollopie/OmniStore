# Stage 1: Development / Build
FROM node:24-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production Execution
FROM node:24-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

RUN apk add shadow

RUN usermod -a -G 1000 node

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main.js"]