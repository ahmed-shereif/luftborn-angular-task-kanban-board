## ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

## ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# mock API: json-server serves data-fetching/db.json behind nginx's /api proxy (see nginx.conf)
RUN apk add --no-cache nodejs npm && npm install -g json-server@1.0.0-beta.15

COPY --from=build /app/dist/luftborn-task/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY data-fetching/db.json /app/data-fetching/db.json
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /app
EXPOSE 8080
CMD ["/start.sh"]
