#!/usr/bin/env bash

set -euo pipefail

wait_for_tcp() {
  local host="$1"
  local port="$2"
  local label="$3"

  echo "Aguardando ${label} em ${host}:${port}..."
  while ! nc -z "${host}" "${port}" >/dev/null 2>&1; do
    sleep 2
  done
}

wait_for_tcp mysql 3306 "MySQL"
wait_for_tcp mongo 27017 "MongoDB"
wait_for_tcp mosquitto 1883 "Mosquitto"

cd /workspace/influunt-api

# The repository is checked out on Windows in many setups, so normalize the
# launcher before executing it inside Linux containers.
sed -i 's/\r$//' ./bin/activator

exec ./bin/activator \
  -Dsbt.log.noformat=true \
  -Dconfig.file=/workspace/influunt-api/conf/docker.conf \
  -Dhttp.address=0.0.0.0 \
  -Dpidfile.path=/dev/null \
  run
