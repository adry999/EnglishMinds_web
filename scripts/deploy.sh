#!/usr/bin/env bash
# Uploads the built site (dist/) and the Node server (dist-server/) over SFTP, then restarts Passenger.
# Never deletes the Passenger app folder (api/), SSL challenges (.well-known/) or cgi-bin/ on the server.
set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=true; fi

: "${DEPLOY_HOST:?missing}" "${DEPLOY_USER:?missing}" "${DEPLOY_WEB_ROOT:?missing}" "${DEPLOY_APP_ROOT:?missing}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

for required in dist/index.html dist-server/app.cjs dist-server/purge-expired-leads.cjs; do
  [[ -f "$required" ]] || { echo "deploy: $required is missing, build first" >&2; exit 1; }
done

# Passenger restarts the app when the date of tmp/restart.txt changes; uploading an empty file does that.
: > dist-server/restart.txt

COMMANDS=$(cat <<COMMANDS_END
set net:max-retries 2
set net:timeout 30
mirror --reverse --delete --verbose --exclude-glob api/ --exclude-glob .well-known/ --exclude-glob cgi-bin/ dist/ ${DEPLOY_WEB_ROOT}
mkdir -p -f ${DEPLOY_APP_ROOT}/tmp
put -O ${DEPLOY_APP_ROOT} dist-server/app.cjs
put -O ${DEPLOY_APP_ROOT} dist-server/purge-expired-leads.cjs
put -O ${DEPLOY_APP_ROOT}/tmp dist-server/restart.txt
bye
COMMANDS_END
)

if $DRY_RUN; then
  echo "deploy (dry run) to sftp://${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PORT}"
  echo "$COMMANDS"
  exit 0
fi

: "${DEPLOY_KEY_FILE:?missing}" "${DEPLOY_KNOWN_HOSTS_FILE:?missing}"
lftp -u "${DEPLOY_USER}," -p "${DEPLOY_PORT}" \
  -e "set sftp:connect-program 'ssh -a -x -i ${DEPLOY_KEY_FILE} -o UserKnownHostsFile=${DEPLOY_KNOWN_HOSTS_FILE} -o StrictHostKeyChecking=yes'; ${COMMANDS}" \
  "sftp://${DEPLOY_HOST}"
