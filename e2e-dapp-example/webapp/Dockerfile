# Use node 16.14.2
FROM node:16.14.2

WORKDIR /app

# copy files from the app
COPY . /app/webapp

WORKDIR /app/webapp

# Install dependencies
RUN npm install --legacy-peer-deps

# Start SQLITE database
RUN npx prisma migrate dev --name init

# Expose API port to the outside
EXPOSE 4202

# Launch application
CMD ["npm", "run", "dev"]
