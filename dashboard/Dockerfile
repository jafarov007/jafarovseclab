FROM node:20-alpine

RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8777

CMD ["node", "server.js"]
