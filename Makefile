# Makefile in the project root (same level as docker-compose.yml)

# Variables (optional, you can customize)
COMPOSE_CMD = docker compose
BACKEND_SERVICE = backend
FRONTEND_SERVICE = frontend
APP ?=

# Default target: show help
.DEFAULT_GOAL := help

## —— Docker Commands —————————————————————————————————————

.PHONY: build
build:  ## Build all Docker images
	$(COMPOSE_CMD) build

.PHONY: up
up:  ## Start all services in foreground
	$(COMPOSE_CMD) up

.PHONY: up-d
up-d:  ## Start all services in detached mode
	$(COMPOSE_CMD) up -d

.PHONY: down
down:  ## Stop all running services
	$(COMPOSE_CMD) down

.PHONY: logs
logs:  ## Tail logs from all services (Ctrl-C to exit)
	$(COMPOSE_CMD) logs -f

## —— Django Commands (Run in the Backend Container) —————————————————

.PHONY: migrate
migrate:  ## Run Django migrations
	$(COMPOSE_CMD) run --rm $(BACKEND_SERVICE) python manage.py migrate

.PHONY: makemigrations
makemigratoins:
	$(COMPOSE_CMD) run --rm $(BACKEND_SERVICE) python manage.py makemigrations $(APP)

.PHONY: createsuperuser
createsuperuser:  ## Create a Django superuser
	$(COMPOSE_CMD) run --rm $(BACKEND_SERVICE) python manage.py createsuperuser

.PHONY: shell
shell:  ## Open Django shell in the container
	$(COMPOSE_CMD) run --rm $(BACKEND_SERVICE) python manage.py shell

.PHONY: test
test:  ## Run Django tests
	$(COMPOSE_CMD) run --rm $(BACKEND_SERVICE) python manage.py test

## —— Frontend Commands (If you want to add some) ————————————————

.PHONY: frontend-install
frontend-install: ## Install frontend NPM packages
	$(COMPOSE_CMD) run --rm $(FRONTEND_SERVICE) npm install

.PHONY: frontend-build
frontend-build: ## Build the frontend for production
	$(COMPOSE_CMD) run --rm $(FRONTEND_SERVICE) npm run build

## —— Help —————————————————————————————————————————————

.PHONY: help
help:
	@echo "Available make targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
