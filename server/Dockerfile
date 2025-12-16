FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 4000

# Use tsx for development (hot reload)
CMD ["npm", "run", "dev"]

