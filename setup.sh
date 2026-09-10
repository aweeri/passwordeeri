#!/usr/bin/env bash
# passwordeeri — one-shot server setup
# Usage: ./setup.sh
#
# Creates config.env from .env.example if missing,
# generates MASTER_KEY and SESSION_SECRET for you,
# then builds and starts the container.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f config.env ]; then
  echo "==> Creating config.env from .env.example"
  cp .env.example config.env

  echo "==> Generating MASTER_KEY and SESSION_SECRET"
  MASTER_KEY=$(openssl rand -hex 32)
  SESSION_SECRET=$(openssl rand -hex 32)

  # Replace in-place (portable to macOS sed)
  sed -i.bak "s/^MASTER_KEY=.*/MASTER_KEY=${MASTER_KEY}/" config.env
  sed -i.bak "s/^SESSION_SECRET=.*/SESSION_SECRET=${SESSION_SECRET}/" config.env
  rm -f config.env.bak

  echo "==> Now edit config.env and set your LDAP_* values (host, bind DN, password, search base, filters)."
  echo "    Then re-run: ./setup.sh"
  exit 0
else
  echo "==> config.env already exists, skipping secret generation"
fi

echo "==> Building and starting..."
docker compose up -d --build

echo ""
echo "Done. App is at http://$(hostname -I 2>/dev/null | awk '{print $1}'):3000"
echo "If you haven't set LDAP_* yet: vim config.env && docker compose up -d --build"