#!/bin/sh
set -e

json-server data-fetching/db.json --port 3000 --host 127.0.0.1 &

exec nginx -g 'daemon off;'
