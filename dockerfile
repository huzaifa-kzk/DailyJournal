# Use official Node.js image
FROM node:18-alpine

# Install Nginx
RUN apk add --no-cache nginx

# Create app directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend code
COPY backend/ ./

# Copy frontend files
COPY frontend/ /var/www/html/

# Copy Nginx config
COPY nginx/default.conf /etc/nginx/http.d/default.conf

# Create .env file from build args
ARG DB_HOST
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME
ARG JWT_SECRET
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION
ARG AWS_BUCKET_NAME

ENV DB_HOST=$DB_HOST \
    DB_USER=$DB_USER \
    DB_PASSWORD=$DB_PASSWORD \
    DB_NAME=$DB_NAME \
    JWT_SECRET=$JWT_SECRET \
    AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    AWS_REGION=$AWS_REGION \
    AWS_BUCKET_NAME=$AWS_BUCKET_NAME

# Expose ports
EXPOSE 80 3000

# Start both Nginx and Node.js
CMD sh -c "nginx && node app.js"