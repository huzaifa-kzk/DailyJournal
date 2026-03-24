FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy frontend files to the location expected by app.js
# Your app.js uses: path.join(__dirname, "../frontend")
COPY frontend/ /app/../frontend/

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]