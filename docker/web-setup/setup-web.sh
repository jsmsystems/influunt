#!/usr/bin/env bash

set -euo pipefail

mkdir -p /workspace/influunt-app
cp -a /opt/influunt-app-src/. /workspace/influunt-app/

cd /workspace/influunt-app

if [[ ! -x node_modules/.bin/gulp ]]; then
  echo "Instalando dependencias npm..."
  npm install
else
  echo "Dependencias npm ja instaladas."
fi

if [[ ! -f bower_components/angular/angular.js ]]; then
  echo "Instalando dependencias bower..."
  bower install --allow-root --config.interactive=false
else
  echo "Dependencias bower ja instaladas."
fi

cat > app/scripts/ngConstants.js <<EOF
'use strict';
angular.module('environment', [])
.constant('APP_ROOT', '${LOCAL_APP_ROOT}')
.constant('ENV', '${LOCAL_ENV_NAME}')
.constant('PLACES_API', {"baseUrl":"http://egocet.prefeitura.sp.gov.br:8280/cet/geo"})
.constant('MAP', {"url":"http://cetsp1.cetsp.com.br:10084/geoserver/cetmdc/wms?tiled=true","options":{"layers":["cetmdc:mdcViario_lg","cetmdc:mdcRotulos_lg"],"transparent":true,"format":"image/png8"}})
.constant('MQTT_ROOT', {"url": window.location.hostname || '${LOCAL_MQTT_HOST}' || 'localhost', "port":${LOCAL_MQTT_PORT}})
.constant('ROOT_API_SMEE', 'http://appprod.cetsp.com.br/smee.webapicentraltempofixo/api');
EOF

echo "Gerando templates do Angular..."
./node_modules/.bin/gulp templates
