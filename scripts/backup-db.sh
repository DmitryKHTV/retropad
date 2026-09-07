#!/usr/bin/env bash
#
# Dumps the Retropad database to a gzipped SQL file and prunes old ones.
# Meant to be run from cron on the server. See the "Backups" section of
# DEPLOY.md for installation, restore and off-site copies.
#
# Overridable: BACKUP_DIR, KEEP_DAYS, COMPOSE_FILE.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="${COMPOSE_FILE:-$repo_root/docker-compose.prod.yml}"
backup_dir="${BACKUP_DIR:-/var/backups/retropad}"
keep_days="${KEEP_DAYS:-7}"

target="$backup_dir/retropad-$(date +%F-%H%M).sql.gz"
tmp="$target.part"

trap 'rm -f "$tmp"' EXIT

mkdir -p "$backup_dir"

# Credentials never leave the container: POSTGRES_USER/PASSWORD/DB are already
# in its environment, so nothing here has to read .env or appear in `ps`.
docker compose -f "$compose_file" exec -T postgres \
  sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  | gzip -9 >"$tmp"

# A dump that died halfway still gzips into a perfectly valid archive, so the
# only honest check is on the payload.
if [ ! -s "$tmp" ] || ! gzip -t "$tmp"; then
  echo "$(date -Is) FAILED: empty or corrupt dump, kept nothing" >&2
  exit 1
fi

mv "$tmp" "$target"
find "$backup_dir" -name 'retropad-*.sql.gz' -mtime "+$keep_days" -delete

echo "$(date -Is) ok $target ($(du -h "$target" | cut -f1))"
