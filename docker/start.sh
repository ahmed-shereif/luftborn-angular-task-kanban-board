#!/bin/sh
set -e

# starts the mock API on localhost:3000 in the background (only reachable via nginx's /api proxy, not exposed outside the container); container exits if this fails since it's backgrounded before `set -e` would catch it
json-server data-fetching/db.json --port 3000 --host 127.0.0.1 &

# runs nginx in the foreground so it stays PID 1 and keeps the container alive
exec nginx -g 'daemon off;'
