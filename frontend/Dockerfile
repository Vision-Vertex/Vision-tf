FROM node:current-alpine3.22

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE ${PORT}
CMD ["npm", "run", "start"]
