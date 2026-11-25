#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/speakids-pronunciation
exec 9>.deploy.lock
flock -n 9 || { echo 'Deployment already running'; exit 1; }
image="${1:?Image digest required}"
[[ "$image" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$ ]] || exit 1
test -s .env
test -d model_cache/phoneme
previous=''
if [[ -f current-image ]]; then previous="$(cat current-image)"; fi
export SPEAKIDS_IMAGE="$image"
compose=(docker compose --project-name speakids-pronunciation --file compose.production.yaml)
"${compose[@]}" config --quiet
"${compose[@]}" pull pronunciation
if "${compose[@]}" up -d --no-deps --wait --wait-timeout 300 pronunciation; then
  if [[ -n "$previous" ]]; then printf '%s\n' "$previous" > previous-image; fi
  printf '%s\n' "$image" > current-image
  echo 'SpeaKids ready; deployment complete'
else
  echo 'Deployment failed readiness check'
  if [[ -n "$previous" ]]; then
    export SPEAKIDS_IMAGE="$previous"
    "${compose[@]}" up -d --no-deps --wait --wait-timeout 300 pronunciation
    echo 'Previous image restored'
  fi
  exit 1
fi
