FROM alpine:latest
WORKDIR /app

# Install Python
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip

# Trust CDiscount CA certificate
COPY cert.pem /usr/local/share/ca-certificates/cert.crt
RUN cat /usr/local/share/ca-certificates/cert.crt >> /etc/ssl/certs/ca-certificates.crt && \
    apk --no-cache add \
    curl

# Install K6
ADD https://github.com/loadimpact/k6/releases/download/v0.27.1/k6-v0.27.1-linux64.tar.gz /app/k6-v0.27.1-linux64.tar.gz
RUN tar -xzf k6-v0.27.1-linux64.tar.gz
RUN mv k6-v0.27.1-linux64/k6 /usr/bin/k6

# Copy sources
COPY ./src /app/src
COPY ./tests /app/tests

# Launch run script
CMD python3 /app/src/loadTesting.py