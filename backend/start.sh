#!/bin/bash
set -e

echo "Waiting for database..."
sleep 5

echo "Running migrations..."
python manage.py collectstatic --noinput
python3 manage.py makemigrations --noinput
python3 manage.py migrate --noinput


echo "strating server..."
exec python3 manage.py runserver 0.0.0.0:8000

# echo "Starting Daphne server..."
# exec daphne -b 0.0.0.0 -p 8000 config.asgi:application