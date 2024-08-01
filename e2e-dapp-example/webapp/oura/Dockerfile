# Interemediate image to install oura
# Use rust base image necessary for cargo
FROM rust:1.70.0 as build-oura

WORKDIR /oura-daemon

# update and install necessary tools to build oura
RUN apt-get update && apt-get -y install cmake protobuf-compiler

# clone oura from source
RUN git clone --depth 1 https://github.com/txpipe/oura.git oura-app

# move to the repo
WORKDIR /oura-daemon/oura-app

# build oura with just n¿the necessary features
RUN cargo build --release --features=sink-webhook,deno

# final image
FROM rust:1.70.0

WORKDIR /oura-daemon

# copy files from the intermediate stage
# files from the app
# copy files from app to the container
COPY . /oura-daemon/oura/
# oura executable
COPY --from=build-oura /oura-daemon/oura-app/target/release/oura /oura-daemon/app/

# start oura daemon
CMD ["app/oura", "daemon", "--config", "oura/daemon.toml"]
