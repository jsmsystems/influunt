FROM mysql:5.7

COPY docker/bootstrap/bootstrap.sh /workspace/docker/bootstrap/bootstrap.sh
COPY influunt-api/influunt_seed.sql /workspace/influunt-api/influunt_seed.sql

RUN sed -i 's/\r$//' /workspace/docker/bootstrap/bootstrap.sh && \
    chmod +x /workspace/docker/bootstrap/bootstrap.sh

WORKDIR /workspace
