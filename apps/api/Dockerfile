FROM node:22-alpine AS base

FROM base AS rustup

RUN apk add --no-cache \
        musl-dev \
        libressl-dev \
        pkgconfig \
        libc6-compat \
        ca-certificates \
        gcc \
        git

ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUST_VERSION=nightly-2025-07-20

RUN set -eux; \
    apkArch="$(apk --print-arch)"; \
    case "$apkArch" in \
        x86_64) rustArch='x86_64-unknown-linux-musl'; rustupSha256='e6599a1c7be58a2d8eaca66a80e0dc006d87bbcf780a58b7343d6e14c1605cb2' ;; \
        aarch64) rustArch='aarch64-unknown-linux-musl'; rustupSha256='a97c8f56d7462908695348dd8c71ea6740c138ce303715793a690503a94fc9a9' ;; \
        ppc64le) rustArch='powerpc64le-unknown-linux-musl'; rustupSha256='08423383d36362d93f8d85f208aa5004a7cef77b69b29fb779ba03ed0544e4f1' ;; \
        *) echo >&2 "unsupported architecture: $apkArch"; exit 1 ;; \
    esac; \
    url="https://static.rust-lang.org/rustup/archive/1.28.2/${rustArch}/rustup-init"; \
    wget "$url"; \
    echo "${rustupSha256} *rustup-init" | sha256sum -c -; \
    chmod +x rustup-init; \
    ./rustup-init -y --no-modify-path --profile minimal --default-toolchain $RUST_VERSION --default-host ${rustArch}; \
    rm rustup-init; \
    chmod -R a+w $RUSTUP_HOME $CARGO_HOME; \
    rustup --version; \
    cargo --version; \
    rustc --version;

FROM rustup AS midenup

WORKDIR /home/node
RUN git clone https://github.com/0xMiden/compiler
WORKDIR /home/node/compiler
RUN cargo install --path midenc --locked
RUN cargo install --path tools/cargo-miden --locked

FROM rustup AS runner

# COPY --from=midenup /usr/local/cargo/bin/rustup /usr/local/bin
# COPY --from=midenup /usr/local/cargo/bin/cargo /usr/local/bin
COPY --from=midenup /usr/local/cargo/bin/midenc /usr/local/bin
COPY --from=midenup /usr/local/cargo/bin/cargo-miden /usr/local/bin

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

WORKDIR /home/node/app
COPY server.js .
CMD ["node", "server.js"]
