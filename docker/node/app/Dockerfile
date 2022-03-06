FROM node:16-alpine

ARG CACHE_BUST

RUN apk update && apk upgrade

WORKDIR /srv

# Copy stuff - refine this later on
COPY . /srv

RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/
RUN npm config set "//npm.fontawesome.com/:_authToken" ${FONT_AWESOME_KEY}
