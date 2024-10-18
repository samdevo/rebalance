FROM node:23-alpine3.19

WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

CMD ["yarn", "start"]
