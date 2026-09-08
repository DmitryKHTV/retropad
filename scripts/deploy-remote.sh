#!/usr/bin/env bash
#
# Everything GitHub Actions is allowed to do on this server.
#
# This file is the reference copy. The one that actually runs lives OUTSIDE the
# repository, at ~/retropad-deploy.sh, and is installed by hand:
#
#     cp ~/retropad/scripts/deploy-remote.sh ~/retropad-deploy.sh
#     chmod 700 ~/retropad-deploy.sh
#
# ~/.ssh/authorized_keys pins that path as the forced command for the deploy
# key, so this script — and nothing else — runs whatever the caller asks for.
# What they asked for arrives in $SSH_ORIGINAL_COMMAND, and the case below is
# the whole vocabulary: an unknown word is refused, never interpreted.

set -euo pipefail

cd ~/retropad

compose() {
    docker compose -f docker-compose.prod.yml "$@"
}

# nginx resolves upstream names once at startup, so a container that came back
# with a new IP is a 502 until nginx is told to look again.
reload_nginx() {
    compose exec -T nginx nginx -s reload
}

wait_until_healthy() {
    for i in $(seq 1 30); do
        if curl -fsS -k -o /dev/null \
            --resolve api-retropad.dkhomutov.dev:8443:127.0.0.1 \
            https://api-retropad.dkhomutov.dev:8443/health; then
            echo "health check passed after ${i} attempt(s)"
            return 0
        fi
        sleep 2
    done

    echo "health check never passed — the stack is not serving"
    compose logs --tail 50 backend
    return 1
}

case "${SSH_ORIGINAL_COMMAND:-}" in
    deploy)
        git pull --ff-only
        compose pull backend frontend
        compose up -d --remove-orphans
        reload_nginx
        docker image prune -f
        wait_until_healthy
        ;;

    stop)
        # Postgres and nginx stay up: the data keeps its volume either way, and
        # a running nginx answers 502 instead of leaving the name dead.
        compose stop backend frontend
        echo "backend and frontend stopped"
        ;;

    start)
        compose start backend frontend
        reload_nginx
        wait_until_healthy
        ;;

    *)
        echo "refused: expected one of deploy, stop, start" >&2
        exit 1
        ;;
esac
