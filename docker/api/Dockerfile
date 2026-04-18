FROM eclipse-temurin:8-jdk

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      bash \
      ca-certificates \
      curl \
      mysql-client \
      netcat-openbsd \
      procps \
      unzip \
      wkhtmltopdf && \
    rm -rf /var/lib/apt/lists/*

COPY influunt-api /workspace/influunt-api
COPY docker/api/run-api.sh /workspace/docker/api/run-api.sh

RUN sed -i 's/\r$//' /workspace/docker/api/run-api.sh /workspace/influunt-api/bin/activator && \
    chmod +x /workspace/docker/api/run-api.sh /workspace/influunt-api/bin/activator && \
    cd /workspace/influunt-api && \
    ./bin/activator -Dsbt.log.noformat=true compile

WORKDIR /workspace/influunt-api
