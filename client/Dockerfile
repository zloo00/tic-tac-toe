FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

EXPOSE 3000

# Development mode with hot reload
CMD ["npm", "run", "dev"]

