# Interemediate image: install aiken and compile scripts
# Use rust as a base image to install aiken
FROM rust:1.70.0 as onchain

RUN apt-get update

WORKDIR /contract

# copy files from app
COPY /onchain /onchain

WORKDIR /onchain

# install aiken
RUN cargo install aiken --version 1.0.21-alpha --locked

# compile validator scripts using aiken
RUN aiken build

# final image: run contract backend
# Use node 16.14.2
FROM node:16.14.2

WORKDIR /contract

# copy files from app
COPY /offchain /contract/offchain

# copy files from interemeditate image
COPY --from=onchain /onchain /contract/onchain

WORKDIR /contract/offchain

# Install dependencies
RUN npm install

# Launch application
CMD ["npm", "start"]

# Expose API port to the outside
EXPOSE 3001
