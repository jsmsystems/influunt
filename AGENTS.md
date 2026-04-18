# AGENTS

Este arquivo registra os ajustes necessários para subir o projeto localmente via Docker Desktop em outra máquina e os problemas já descobertos durante a preparação do ambiente.

## Objetivo

Executar o projeto localmente sem instalar Java, Node, MongoDB ou MySQL no host, usando apenas Docker Desktop.

## Pré-requisitos

- Docker Desktop em execução
- Porta `8080` livre no host
- Porta `9000` livre no host
- Porta `1883` e `1884` livres no host
- Repositório clonado por completo

## Arquivos que precisam estar no commit

Para outra máquina subir o mesmo ambiente Docker com sucesso, estes arquivos precisam existir no repositório:

- `compose.yaml`
- `docker/api/Dockerfile`
- `docker/api/run-api.sh`
- `docker/bootstrap/bootstrap.sh`
- `docker/web-setup/Dockerfile`
- `docker/web-setup/setup-web.sh`
- `docker/nginx/influunt.conf`
- `docker/mosquitto/mosquitto.conf`
- `influunt-api/conf/docker.conf`
- `influunt-app/app/index.html`
- `influunt-app/app/scripts/paho-compat.js`
- `influunt-app/app/scripts/services/paho-provider.js`
- `influunt-app/app/scripts/controllers/main.js`
- `influunt-app/app/views/common/content_top_navigation.html`
- `README.md`
- `AGENTS.md`

## Comando principal

Na raiz do repositório:

```bash
docker compose up -d --build
```

Depois abrir:

```text
http://localhost:8080
```

Login padrão do ambiente local:

- usuário: `root`
- senha: `1234`

## Comandos úteis

Subir o ambiente:

```bash
docker compose up -d --build
```

Ver logs principais:

```bash
docker compose logs -f api web
```

Parar o ambiente:

```bash
docker compose down
```

Apagar volumes e recriar tudo do zero:

```bash
docker compose down -v
docker compose up -d --build
```

## Serviços usados no Docker

- `mysql:5.7`
- `mongo:3.4`
- `eclipse-mosquitto:2`
- `nginx:1.27-alpine`
- `mailhog/mailhog:v1.0.1`
- `api` customizado com JDK 8 + Activator
- `web-setup` customizado com Node legado para instalar dependências do frontend

## Ajustes necessários já descobertos

### 1. MongoDB compatível

O projeto legado espera MongoDB `3.4`. Com `mongo:3.6`, a rota do dashboard quebrava com erro de aggregate:

- `The 'cursor' option is required`

Por isso o `compose.yaml` deve usar:

- `mongo:3.4`
- comando `mongod --bind_ip 0.0.0.0`

### 2. Paho MQTT legado

O frontend original esperava a API antiga:

- `Paho.MQTT.Client`
- `Paho.MQTT.Message`

Mas o pacote disponível localmente expõe:

- `Paho.Client`
- `Paho.Message`

Solução aplicada:

- carregar `paho-mqtt.js`
- adicionar `scripts/paho-compat.js` para criar a namespace legada `Paho.MQTT`

Sem isso, o login funcionava, mas a tela `#/app/main` ficava branca.

### 3. Referência a `$state` no layout principal

O `MainCtrl` precisava expor `$state` no escopo para o layout e também parar de usar `$scope.$state.get(...)` internamente.

Solução aplicada:

- `MainCtrl` agora faz `$scope.$state = $state`
- `checkRoleForMenus` usa `$state.get(...)`

### 4. Script MQTT inexistente

O projeto referenciava um asset que não existia no pacote atual:

- `/bower_components/paho-mqtt/src/mqttws31.js`

O arquivo válido no ambiente local é:

- `/bower_components/paho-mqtt/src/paho-mqtt.js`

Sem esse ajuste, o frontend gerava `404` já no carregamento inicial.

### 5. Bootstrap do banco local

O ambiente local precisa de um usuário conhecido para acesso rápido.

Se o seed legado falhar parcialmente, o bootstrap cria um usuário mínimo:

- login `root`
- senha `1234`

## Arquivos importantes do ambiente local

- `compose.yaml`
- `docker/api/Dockerfile`
- `docker/api/run-api.sh`
- `docker/bootstrap/bootstrap.sh`
- `docker/web-setup/Dockerfile`
- `docker/web-setup/setup-web.sh`
- `docker/nginx/influunt.conf`
- `docker/mosquitto/mosquitto.conf`
- `influunt-api/conf/docker.conf`
- `influunt-app/app/scripts/paho-compat.js`

## Primeira subida em outra máquina

Na primeira execução em outra máquina, o fluxo recomendado é:

1. clonar o repositório
2. abrir a pasta raiz do projeto no terminal
3. garantir que o Docker Desktop está iniciado
4. executar `docker compose up -d --build`
5. aguardar o download das imagens e o build inicial
6. acompanhar com `docker compose logs -f api web`
7. abrir `http://localhost:8080`
8. entrar com `root / 1234`

Observação:

- a primeira subida pode demorar vários minutos, porque o ambiente precisa baixar imagens antigas e dependências legadas

## Fluxo esperado após subir

1. `docker compose up -d --build`
2. aguardar `api`, `web`, `mysql`, `mongo` e `mosquitto` ficarem de pé
3. abrir `http://localhost:8080`
4. entrar com `root / 1234`
5. a rota deve mudar para `#/app/main`
6. a dashboard deve carregar com menu superior e blocos de resumo

## Troubleshooting

Se a tela abrir em branco:

1. abrir logs:

```bash
docker compose logs -f api web
```

2. fazer hard refresh no navegador:

```text
Ctrl+Shift+R
```

3. testar em aba anônima
4. verificar se o `web` não está servindo referência antiga a `mqttws31.js`
5. verificar se o `mongo` está realmente em `3.4`

Se quiser validar rapidamente pelo terminal se a API principal está saudável:

```bash
curl -I http://127.0.0.1:9000/api/api/v1/permissoes/roles
```

E para validar o dashboard com login:

```bash
TOKEN=$(curl -s -D - -o /tmp/influunt-login-body \
  -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:8080/api/api/v1/login \
  -d '{"login":"root","senha":"1234"}' | tr -d '\r' | awk -F': ' 'tolower($1)=="authtoken"{print $2}')

curl -H "authToken: $TOKEN" \
  http://127.0.0.1:8080/api/api/v1/monitoramento/status_controladores
```

## Observação

Este documento registra o cenário local para avaliação funcional do projeto. Ele não cobre hardening de segurança do sistema para exposição externa.
