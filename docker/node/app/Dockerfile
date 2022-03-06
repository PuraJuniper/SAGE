FROM node:16-alpine

ARG CACHE_BUST

RUN apk update && apk upgrade

WORKDIR /srv

# Copy stuff - refine this later on
COPY . /srv
