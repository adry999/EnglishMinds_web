#!/usr/bin/env bash
set -euo pipefail

: "${TARGET:?missing}" "${REF:?missing}" "${GITHUB_REPOSITORY:?missing}" "${GITHUB_OUTPUT:?missing}"

REQUIRED_CHECKS=(verify browser)

case "$TARGET" in
  production) BRANCH=main ;;
  staging) BRANCH=staging ;;
  *)
    echo "rollback: target must be production or staging (got: $TARGET)" >&2
    exit 1
    ;;
esac

if [[ ! "$REF" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$ || "$REF" == *..* ]]; then
  echo "rollback: ref must be a commit SHA or a tag name (got: $REF)" >&2
  exit 1
fi

git fetch --quiet --tags origin "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"

if ! SHA=$(git rev-parse --verify --quiet "${REF}^{commit}"); then
  echo "rollback: $REF is not a commit in this repository" >&2
  exit 1
fi

if ! git merge-base --is-ancestor "$SHA" "origin/${BRANCH}"; then
  echo "rollback: $SHA is not on $BRANCH, so it was never published to $TARGET; only commits already on $BRANCH can be published again" >&2
  exit 1
fi

CONCLUSIONS=$(gh api "repos/${GITHUB_REPOSITORY}/commits/${SHA}/check-runs" --paginate --jq '.check_runs[] | "\(.name)=\(.conclusion)"')
for check in "${REQUIRED_CHECKS[@]}"; do
  if ! grep -qx "${check}=success" <<<"$CONCLUSIONS"; then
    echo "rollback: CI check '$check' did not pass on $SHA, pick a commit with green CI" >&2
    exit 1
  fi
done

echo "sha=$SHA" >> "$GITHUB_OUTPUT"
echo "rollback: publishing $SHA from $BRANCH to $TARGET"
