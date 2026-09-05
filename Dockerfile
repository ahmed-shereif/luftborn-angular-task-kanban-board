## ---- Build stage ----
# use Node 22 alpine image, named "build" so later stages can copy from it
FROM node:22-alpine AS build
# all subsequent instructions run from /app inside the container
WORKDIR /app

# copy only manifest files first so this layer is cached unless dependencies change
COPY package.json package-lock.json ./
# clean, reproducible install driven by the lockfile
RUN npm ci

# copy the rest of the source now that deps are cached
COPY . .
# compile the Angular app in production mode into dist/
RUN npm run build -- --configuration production

## ---- Runtime stage ----
# lightweight nginx image, discarding the Node build tools from the previous stage
FROM nginx:1.27-alpine AS runtime

# mock API: json-server serves data-fetching/db.json behind nginx's /api proxy (see nginx.conf)
# install Node/npm just to run json-server, then install json-server globally
RUN apk add --no-cache nodejs npm && npm install -g json-server@1.0.0-beta.15

# pull the compiled Angular browser bundle from the build stage into nginx's web root
COPY --from=build /app/dist/luftborn-task/browser /usr/share/nginx/html
# overwrite the default nginx site config with the app's own (handles SPA routing + /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# mock data file consumed by json-server at runtime
COPY data-fetching/db.json /app/data-fetching/db.json
# entrypoint script that launches json-server and nginx together
COPY docker/start.sh /start.sh
# make the entrypoint script executable
RUN chmod +x /start.sh

# working directory for the startup script (relative paths in start.sh resolve here)
WORKDIR /app
# document the port the container listens on
EXPOSE 8080
# container entrypoint: starts both the mock API and nginx
CMD ["/start.sh"]
