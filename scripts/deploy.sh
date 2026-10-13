#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=true; fi

: "${DEPLOY_HOST:?missing}" "${DEPLOY_USER:?missing}" "${DEPLOY_WEB_ROOT:?missing}" "${DEPLOY_APP_ROOT:?missing}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

require_safe_deploy_path() {
  local name="$1" value="$2" segments
  if [[ ! "$value" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
    echo "deploy: $name may only contain letters, digits, '.', '_', '-' and '/', and must start with '/' (got: $value)" >&2
    exit 1
  fi
  if [[ "$value" == *//* || "$value" == */ || "$value" =~ (^|/)\.\.?(/|$) ]]; then
    echo "deploy: $name must not have a trailing '/', empty segments or '.' / '..' segments (got: $value)" >&2
    exit 1
  fi
  segments=$(awk -F/ '{ n = 0; for (i = 1; i <= NF; i++) if ($i != "") n++; print n }' <<<"$value")
  if (( segments < 3 )); then
    echo "deploy: $name is too shallow, it needs at least 3 path segments like /home/user/public_html (got: $value)" >&2
    exit 1
  fi
}
require_safe_deploy_path DEPLOY_WEB_ROOT "$DEPLOY_WEB_ROOT"
require_safe_deploy_path DEPLOY_APP_ROOT "$DEPLOY_APP_ROOT"
WEB_ROOT="$DEPLOY_WEB_ROOT"
APP_ROOT="$DEPLOY_APP_ROOT"
if [[ "$WEB_ROOT" == "$APP_ROOT" || "$APP_ROOT/" == "$WEB_ROOT/"* ]]; then
  echo "deploy: DEPLOY_APP_ROOT must not be DEPLOY_WEB_ROOT or inside it, mirror --delete would wipe the app" >&2
  exit 1
fi
HTPASSWD_FILE="${DEPLOY_HTPASSWD_FILE:-}"
if [[ -n "$HTPASSWD_FILE" ]]; then require_safe_deploy_path DEPLOY_HTPASSWD_FILE "$HTPASSWD_FILE"; fi

for required in dist/index.html dist-server/app.cjs dist-server/purge-expired-leads.cjs dist-server/notify-pending-leads.cjs; do
  [[ -f "$required" ]] || { echo "deploy: $required is missing, build first" >&2; exit 1; }
done

RESTART_TRIGGER=dist-server/restart.txt
PROTECTED=(api/ .well-known/ cgi-bin/ .user.ini error_log .htpasswds/)
EXCLUDES=""
for entry in "${PROTECTED[@]}"; do EXCLUDES+=" --exclude-glob ${entry}"; done
MIRROR_ADD="mirror --reverse --verbose${EXCLUDES} dist/ ${WEB_ROOT}"
MIRROR_PRUNE="mirror --reverse --delete --verbose${EXCLUDES} dist/ ${WEB_ROOT}"

COMMANDS=$(cat <<COMMANDS_END
mkdir -p -f ${APP_ROOT}/tmp
set cmd:fail-exit yes
set net:max-retries 2
set net:timeout 30
${MIRROR_ADD}
${MIRROR_PRUNE}
put -O ${APP_ROOT} dist-server/app.cjs
put -O ${APP_ROOT} dist-server/purge-expired-leads.cjs
put -O ${APP_ROOT} dist-server/notify-pending-leads.cjs
put -O ${APP_ROOT}/tmp ${RESTART_TRIGGER}
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

: > "$RESTART_TRIGGER"
if [[ -n "$HTPASSWD_FILE" ]]; then
  HTACCESS_BACKUP="$(mktemp)"
  HAD_HTACCESS=false
  if [[ -f dist/.htaccess ]]; then cp dist/.htaccess "$HTACCESS_BACKUP"; HAD_HTACCESS=true; fi
  restore_htaccess() {
    if $HAD_HTACCESS; then cp "$HTACCESS_BACKUP" dist/.htaccess; else rm -f dist/.htaccess; fi
    rm -f "$HTACCESS_BACKUP"
  }
  trap restore_htaccess EXIT
  if ! grep -qs AuthUserFile dist/.htaccess; then
    printf '%s\n' \
      '' \
      'SetEnvIf Request_URI "^/\.well-known/" acme_challenge' \
      'AuthType Basic' \
      'AuthName "Staging"' \
      "AuthUserFile ${HTPASSWD_FILE}" \
      '<RequireAny>' \
      '  Require env acme_challenge' \
      '  Require valid-user' \
      '</RequireAny>' >> dist/.htaccess
  fi
fi

lftp -u "${DEPLOY_USER}," -p "${DEPLOY_PORT}" \
  -e "set sftp:connect-program 'ssh -a -x -i ${DEPLOY_KEY_FILE} -o UserKnownHostsFile=${DEPLOY_KNOWN_HOSTS_FILE} -o StrictHostKeyChecking=yes -o BatchMode=yes'; ${COMMANDS}" \
  "sftp://${DEPLOY_HOST}"
