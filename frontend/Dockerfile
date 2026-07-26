FROM node:24-slim

WORKDIR /app/frontend

COPY /frontend/package*.json ./

RUN npm install

COPY /frontend .

COPY shared/ ../shared
WORKDIR /app/shared
RUN npm install

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev"]