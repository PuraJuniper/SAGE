-include .env
SHELL := /bin/bash
PROJECT_NAME?=sage

USER_ID:=$(shell id -u $$USER)

NODE_APP_IMG=sage:node-app
NODE_WORKER_IMG=sage:node-worker

# Use the docker buildkit enhancements, see https://docs.docker.com/develop/develop-images/build_enhancements/
export DOCKER_BUILDKIT=1

EXPOSE_PORT?=8083

# Run Docker compose (with CI overrides)
DOCKER_COMPOSE:=EXPOSE_PORT=$(EXPOSE_PORT) \
	COMPOSE_DOCKER_CLI_BUILD=1 \
	docker-compose \
	-p $(PROJECT_NAME) \
	-f docker-compose.yml \
	-f docker-compose.dev.yml

# Builds all Docker images
docker-images:
	docker build --pull -t $(NODE_APP_IMG) -f docker/node/app/Dockerfile .
	docker build --pull -t $(NODE_WORKER_IMG) -f docker/node/worker/Dockerfile .

dev-build: docker-images

# Starts containers and runs migrations
dev-up:
	$(DOCKER_COMPOSE) up --remove-orphans

dev-down:
	$(DOCKER_COMPOSE) down

dev-clean:
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) rm -s -v --force

dev-shell-node:
	$(DOCKER_COMPOSE) run --entrypoint /bin/sh node-app

# Grab a shell on the node test running worker
dev-shell-node-worker:
	$(DOCKER_COMPOSE) run --entrypoint /bin/sh node-worker

artifacts-dir:
	mkdir -p artifacts
