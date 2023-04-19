FROM node:12-alpine AS BUILD_IMAGE

# couchbase sdk requirements
RUN apk update
RUN apk add yarn curl bash
RUN rm -rf /var/cache/apk/*

# install node-prune (https://github.com/tj/node-prune)
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

# install dependencies
RUN yarn --frozen-lockfile

COPY . .

# lint & test
# RUN yarn lint & yarn test

# build application
RUN yarn build

# remove development dependencies
RUN npm prune --production --json

# run node prune
RUN node-prune

RUN yarn --production

FROM node:12-alpine

WORKDIR /usr/src/app

# copy from build image
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

CMD [ "node", "./dist/main.js" ]
