#!/usr/bin/env bash

set -euo pipefail

DB_HOST="${DB_HOST:-mysql}"
DB_NAME="${DB_NAME:-influuntdev}"
DB_USER="${DB_USER:-influunt}"
DB_PASSWORD="${DB_PASSWORD:-influunt}"
SEED_FILE="/workspace/influunt-api/influunt_seed.sql"

export MYSQL_PWD="${DB_PASSWORD}"

mysql_cmd=(
  mysql
  --protocol=TCP
  -h"${DB_HOST}"
  -u"${DB_USER}"
  "${DB_NAME}"
)

count_query() {
  "${mysql_cmd[@]}" -Nse "$1" | tr -d '\r'
}

echo "Aguardando MySQL aceitar conexoes..."
until mysqladmin --protocol=TCP -h"${DB_HOST}" -u"${DB_USER}" ping --silent >/dev/null 2>&1; do
  sleep 2
done

echo "Aguardando tabelas principais da aplicacao..."
until "${mysql_cmd[@]}" -Nse "SHOW TABLES LIKE 'usuarios';" | grep -q '^usuarios$'; do
  sleep 2
done

until "${mysql_cmd[@]}" -Nse "SHOW TABLES LIKE 'permissoes_app';" | grep -q '^permissoes_app$'; do
  sleep 2
done

root_count="$(count_query "SELECT COUNT(*) FROM usuarios WHERE login = 'root';")"
user_count="$(count_query "SELECT COUNT(*) FROM usuarios;")"
perfil_count="$(count_query "SELECT COUNT(*) FROM perfis;")"
permissao_app_count="$(count_query "SELECT COUNT(*) FROM permissoes_app;")"

if [[ "${root_count}" == "1" && "${user_count}" == "1" && "${perfil_count}" == "0" && "${permissao_app_count}" == "0" ]]; then
  echo "Detectado bootstrap minimo sem seed completo; recriando carga inicial..."
  "${mysql_cmd[@]}" <<'SQL'
SET FOREIGN_KEY_CHECKS=0;
DELETE FROM sessoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE login = 'root');
DELETE FROM usuarios WHERE login = 'root';
SET FOREIGN_KEY_CHECKS=1;
SQL

  root_count="0"
fi

if [[ "${root_count}" == "0" ]]; then
  echo "Carregando seed inicial..."
  if ! "${mysql_cmd[@]}" < "${SEED_FILE}"; then
    echo "Seed completo falhou; criando bootstrap minimo para acesso local..."
  fi

  root_count="$(count_query "SELECT COUNT(*) FROM usuarios WHERE login = 'root';")"
  perfil_count="$(count_query "SELECT COUNT(*) FROM perfis;")"
  permissao_app_count="$(count_query "SELECT COUNT(*) FROM permissoes_app;")"

  if [[ "${root_count}" == "0" || "${perfil_count}" == "0" || "${permissao_app_count}" == "0" ]]; then
    "${mysql_cmd[@]}" <<'SQL'
INSERT INTO usuarios (
  id,
  id_json,
  login,
  senha,
  email,
  nome,
  root,
  data_criacao,
  data_atualizacao
) VALUES (
  UUID(),
  UUID(),
  'root',
  '$2a$10$EzudGIqkxquJjLGawuMrOu9K6S28yc/R/YSAVxsvb5bSryOYWd5eq',
  'root@influunt.com.br',
  'Administrador Geral',
  true,
  NOW(),
  NOW()
);
SQL

    echo "Usuario root criado com senha 1234."
  fi
else
  echo "Seed ja presente, nada a fazer."
fi
