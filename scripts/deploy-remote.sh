#!/usr/bin/env bash
#
# The body of a deploy, run on the server by GitHub Actions.
#
# This file is the reference copy. The one that actually runs lives OUTSIDE the
# repository, at ~/retropad-deploy.sh, and is installed by hand:
#
#     cp ~/retropad/scripts/deploy-remote.sh ~/retropad-deploy.sh
#     chmod 700 ~/retropad-deploy.sh
#
# Outside on purpose: ~/.ssh/authorized_keys pins this path as the forced
# command for the deploy key, and the script itself runs `git pull`. Were it
# the in-repo copy, a deploy would be able to rewrite the very command the
# restricted key is limited to — and the restriction would be theatre.
# Cost of that: changes here reach the server only when you copy them over.

set -euo pipefail

cd ~/retropad

git pull --ff-only
docker compose -f docker-compose.prod.yml pull backend frontend
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# New containers get new IPs, and nginx resolves upstream names once at
# startup — without this it serves 502 to a healthy backend.
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload

docker image prune -f

for i in $(seq 1 30); do
    if curl -fsS -k -o /dev/null \
        --resolve api-retropad.dkhomutov.dev:8443:127.0.0.1 \
        https://api-retropad.dkhomutov.dev:8443/health; then
        echo "health check passed after ${i} attempt(s)"
        exit 0
    fi
    sleep 2
done

echo "health check never passed — the stack is not serving"
docker compose -f docker-compose.prod.yml logs --tail 50 backend
exit 1
