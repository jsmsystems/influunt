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

WORKDIR /workspace/influunt-api
