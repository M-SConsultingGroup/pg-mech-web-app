# Use the official Node.js image.
FROM node:18-slim

# Create and change to the app directory.
WORKDIR /app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install all dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Set environment variables for Next.js
ENV NEXT_PUBLIC_API_BASE_URL=https://pgmechanical.us

# Build the Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 8081

# Run the Next.js app
CMD ["npm", "start"]