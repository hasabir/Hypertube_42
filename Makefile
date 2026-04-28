.PHONY: help build up down restart logs shell migrate makemigrations createsuperuser test clean

help:
	@echo "Hypertube - Development Commands"
	@echo "=================================="
	@echo "make build            - Build Docker containers"
	@echo "make up               - Start all services"
	@echo "make down             - Stop all services"
	@echo "make restart          - Restart all services"
	@echo "make logs             - View logs"
	@echo "make shell            - Open Django shell"
	@echo "make bash             - Open bash in backend container"
	@echo "make migrate          - Run database migrations"
	@echo "make makemigrations   - Create new migrations"
	@echo "make createsuperuser  - Create Django superuser"
	@echo "make test             - Run tests"
	@echo "make prune            - Remove unused Docker resources"
	@echo "make setup            - Initial setup (build, up, migrate, createsuperuser)"
	@echo "make clean_images     - Remove all Docker images (use with caution)"
	@echo "make clean_volumes    - Remove all Docker volumes (use with caution)"
	@echo "make clean_containers - Remove all Docker containers (use with caution)"
	@echo "make clean            - Remove all containers, images, and volumes (use with caution)"

build:
	docker-compose build

up:
	docker-compose up --build
# 	@echo "Services started. Backend: http://localhost:8000"

down:
	docker-compose down

restart: down up

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

restart_backend:
	docker-compose restart backend

shell:
	docker-compose exec backend python manage.py shell

bash:
	docker-compose exec backend bash

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

test:
	docker-compose exec backend python manage.py test

prune:
	docker system prune -f

clean_images:
	docker rmi  -f $(docker images -q)

clean_volumes:
	docker volume rm  -f $(docker volume ls -q)

clean_containers:
	docker rm -f $(docker ps -aq)

clean:
	docker-compose down --rmi all -v --remove-orphans
	docker rm -f $(docker ps -aq)
	docker rmi -f $(docker images -q)
	docker volume rm -f $(docker volume ls -q)
# 	docker system prune -f


# Initial setup
setup: build up migrate createsuperuser
	@echo "Setup complete!"

# Development workflow
dev: up logs
