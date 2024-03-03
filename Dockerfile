# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

ARG TOKEN
ARG CLIENT_ID
ARG OWNER=["719815864135712799","483359783831732255"]
ARG GUILD_ID_LOGS
ARG CHANNEL_ID_LOGS
ARG GEMINI_API_KEY
ARG XPRODIAKEY
ARG BLOCK_NSFW_IMAGES="true"

ENV TOKEN=${TOKEN}
ENV CLIENT_ID=${CLIENT_ID}
ENV OWNER=${OWNER}
ENV GUILD_ID_LOGS=${GUILD_ID_LOGS}
ENV CHANNEL_ID_LOGS=${CHANNEL_ID_LOGS}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV XPRODIAKEY=${XPRODIAKEY}
ENV BLOCK_NSFW_IMAGES=${BLOCK_NSFW_IMAGES}

# Install the application's dependencies inside the Docker image
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Run bot.js when the container launches
CMD ["npm", "start"]