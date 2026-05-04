FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# docker-compose.yml overrides this for local dev
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
