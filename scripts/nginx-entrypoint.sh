#!/bin/sh
set -e

# If Let's Encrypt certificates exist (mounted from host), use them
if [ -f /etc/letsencrypt/live/176.12.72.246.nip.io/fullchain.pem ] && [ -f /etc/letsencrypt/live/176.12.72.246.nip.io/privkey.pem ]; then
  echo "Using Let's Encrypt SSL certificate for 176.12.72.246.nip.io"
else
  mkdir -p /etc/nginx/ssl
  if [ ! -f /etc/nginx/ssl/bunker.crt ] || [ ! -f /etc/nginx/ssl/bunker.key ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/bunker.key \
      -out /etc/nginx/ssl/bunker.crt \
      -subj "/C=RU/ST=Moscow/L=Moscow/O=Bunker/CN=176.12.72.246"
    echo "SSL certificate generated."
  fi
fi

exec nginx -g "daemon off;"
