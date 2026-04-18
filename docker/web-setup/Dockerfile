FROM node:8

RUN sed -i 's|deb.debian.org/debian|archive.debian.org/debian|g' /etc/apt/sources.list && \
    sed -i 's|security.debian.org/debian-security|archive.debian.org/debian-security|g' /etc/apt/sources.list && \
    sed -i '/stretch-updates/d' /etc/apt/sources.list && \
    printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99archive && \
    apt-get update -o Acquire::Check-Valid-Until=false && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      git \
      make \
      g++ \
      python && \
    npm install -g bower gulp-cli && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/influunt-app
