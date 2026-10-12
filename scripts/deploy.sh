#!/usr/bin/env bash
# Uploads the built site (dist/) and the Node server (dist-server/) over SFTP, then restarts Passenger.
# Never deletes the Passenger app folder (api/), SSL challenges (.well-known/) or cgi-bin/ on the server.
set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=true; fi

: "${DEPLOY_HOST:?missing}" "${DEPLOY_USER:?missing}" "${DEPLOY_WEB_ROOT:?missing}" "${DEPLOY_APP_ROOT:?missing}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

# mirror --delete wipes whatever is not in dist/, so the roots must be plain absolute paths that cannot overlap.
BAD_CHARS=$'[[:space:];\'"`$]'
check_path() {
  local name="$1" value="$2" segments
  if [[ "$value" != /* || "$value" == *..* || "$value" =~ $BAD_CHARS ]]; then
    echo "deploy: $name must be an absolute path without '..', spaces, quotes, ';' or '\$' (got: $value)" >&2
    exit 1
  fi
  segments=$(awk -F/ '{ n = 0; for (i = 1; i <= NF; i++) if ($i != "") n++; print n }' <<<"$value")
  if (( segments < 3 )); then
    echo "deploy: $name is too shallow, it needs at least 3 path segments like /home/user/public_html (got: $value)" >&2
    exit 1
  fi
}
check_path DEPLOY_WEB_ROOT "$DEPLOY_WEB_ROOT"
check_path DEPLOY_APP_ROOT "$DEPLOY_APP_ROOT"
WEB_ROOT="${DEPLOY_WEB_ROOT%/}"
APP_ROOT="${DEPLOY_APP_ROOT%/}"
if [[ "$WEB_ROOT" == "$APP_ROOT" || "$APP_ROOT/" == "$WEB_ROOT/"* ]]; then
  echo "deploy: DEPLOY_APP_ROOT must not be DEPLOY_WEB_ROOT or inside it, mirror --delete would wipe the app" >&2
  exit 1
fi
HTPASSWD_FILE="${DEPLOY_HTPASSWD_FILE:-}"
if [[ -n "$HTPASSWD_FILE" ]]; then check_path DEPLOY_HTPASSWD_FILE "$HTPASSWD_FILE"; fi

for required in dist/index.html dist-server/app.cjs dist-server/purge-expired-leads.cjs; do
  [[ -f "$required" ]] || { echo "deploy: $required is missing, build first" >&2; exit 1; }
done

COMMANDS=$(cat <<COMMANDS_END
set cmd:fail-exit yes
set net:max-retries 2
set net:timeout 30
mirror --reverse --delete --verbose --exclude-glob api/ --exclude-glob .well-known/ --exclude-glob cgi-bin/ --exclude-glob .user.ini --exclude-glob error_log --exclude-glob .htpasswds/ dist/ ${WEB_ROOT}
mkdir -p -f ${APP_ROOT}/tmp
put -O ${APP_ROOT} dist-server/app.cjs
put -O ${APP_ROOT} dist-server/purge-expired-leads.cjs
put -O ${APP_ROOT}/tmp dist-server/restart.txt
bye
COMMANDS_END
)

if $DRY_RUN; then
  echo "deploy (dry run) to sftp://${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PORT}"
  if [[ -n "$HTPASSWD_FILE" ]]; then
    echo "would append a Basic auth block (AuthUserFile ${HTPASSWD_FILE}) to dist/.htaccess"
  fi
  echo "$COMMANDS"
  exit 0
fi

: "${DEPLOY_KEY_FILE:?missing}" "${DEPLOY_KNOWN_HOSTS_FILE:?missing}"

# Passenger restarts the app when the date of tmp/restart.txt changes; uploading an empty file does that.
: > dist-server/restart.txt
if [[ -n "$HTPASSWD_FILE" ]]; then
  # mirror overwrites the docroot .htaccess, so the staging password is injected here instead of relying on cPanel Directory Privacy.
  printf '\nAuthType Basic\nAuthName "Staging"\nAuthUserFile %s\nRequire valid-user\n' "$HTPASSWD_FILE" >> dist/.htaccess
fi

lftp -u "${DEPLOY_USER}," -p "${DEPLOY_PORT}" \
  -e "set sftp:connect-program 'ssh -a -x -i ${DEPLOY_KEY_FILE} -o UserKnownHostsFile=${DEPLOY_KNOWN_HOSTS_FILE} -o StrictHostKeyChecking=yes -o BatchMode=yes'; ${COMMANDS}" \
  "sftp://${DEPLOY_HOST}"
