FROM node:22.21.0


WORKDIR /app

COPY . ./app

RUN npm install


RUN npm run dev


