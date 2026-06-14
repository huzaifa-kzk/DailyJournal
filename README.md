# DailyChat - Cloud-Native Application Deployment on AWS

## Overview

DailyChat is a cloud-hosted journal and messaging platform designed to demonstrate modern DevOps practices, AWS infrastructure design, automated deployments, containerized application delivery, and secure application hosting.

The project focuses on building a production-style deployment environment using AWS services, Docker, GitHub Actions, Linux server administration, and cloud-native architecture. The application supports user authentication, public message posting, image uploads, and secure media storage.

## Architecture

DailyChat is deployed on AWS with a cloud architecture that separates application hosting, database storage, media storage, and deployment automation.

### Infrastructure Components

- Amazon EC2 for application hosting
- Amazon RDS MySQL for relational data storage
- Amazon S3 for image and media storage
- Application Load Balancer for traffic routing
- Docker for application containerization
- Nginx as a reverse proxy
- GitHub Actions for CI/CD automation
- Linux-based server administration
- Environment-based secrets and configuration management

### Request Flow

```text
User
  |
  v
Application Load Balancer
  |
  v
EC2 Instance
  |
  v
Nginx Reverse Proxy
  |
  v
Dockerized Node.js Application
  |
  v
Amazon RDS MySQL
```

For media uploads:

```text
Node.js Application -> Amazon S3
```

## Key Contributions

- Architected and deployed a cloud-hosted application on AWS using EC2, RDS MySQL, and S3.
- Containerized the backend service using Docker for consistent and reproducible deployments.
- Configured Nginx as a reverse proxy for request routing and application access management.
- Built a GitHub Actions CI/CD pipeline to automate deployments to AWS infrastructure.
- Automated deployment workflows to reduce manual intervention and improve release consistency.
- Integrated Amazon S3 for scalable image upload, storage, and retrieval.
- Managed Linux-based cloud servers and application deployment lifecycle.
- Implemented secure authentication using JWT and encrypted password storage with bcrypt.
- Configured environment-based application settings and deployment secrets management.
- Applied DevOps best practices to improve maintainability, security, and operational efficiency.

## DevOps Implementation

### CI/CD Pipeline

Deployment is automated using GitHub Actions.

Pipeline workflow:

1. Code is pushed to the GitHub repository.
2. GitHub Actions workflow is triggered on the `main` branch.
3. AWS credentials are configured using GitHub Secrets.
4. Target EC2 instances are discovered through the AWS load balancer target group.
5. Deployment commands are executed on EC2 through AWS Systems Manager.
6. The latest application code is pulled from GitHub.
7. The Docker image is rebuilt.
8. The previous container is stopped and replaced.
9. The updated application becomes available through the AWS-hosted environment.

Workflow file:

```text
.github/workflows/deploy.yml
```

### Containerization

The backend application is containerized using Docker.

Benefits:

- Consistent deployment environments
- Simplified dependency management
- Reproducible application builds
- Easier application updates and rollbacks
- Cleaner separation between application code and host configuration

Docker file:

```text
dockerfile
```

### Reverse Proxy

Nginx is used as a reverse proxy in the deployment environment.

Responsibilities:

- Route incoming traffic to the Node.js application
- Keep the application service behind a proxy layer
- Support production-style request handling
- Improve operational control over application access

### Security Practices

Implemented security measures include:

- JWT-based authentication
- Password hashing with bcrypt
- Environment variable configuration
- GitHub Secrets for CI/CD credentials
- Ignored local `.env` files
- Auth-protected post APIs
- CORS origin restrictions
- API rate limiting
- S3-backed media storage
- Secure random filenames for uploaded media

## Application Features

### User Authentication

- User registration
- User login
- JWT-based session handling
- Password hashing using bcrypt

### Content Management

- Create text posts
- Upload images
- View authenticated message feed
- Delete owned posts

### Media Storage

Images are uploaded to Amazon S3, providing:

- Durable object storage
- Scalable media handling
- Reduced storage requirements on EC2
- Better separation between application runtime and media files

## Technology Stack

### Cloud Services

- AWS EC2
- AWS S3
- AWS RDS MySQL
- AWS Application Load Balancer
- AWS Systems Manager

### DevOps & Infrastructure

- Docker
- GitHub Actions
- Nginx
- Linux
- CI/CD
- Cloud Infrastructure

### Backend

- Node.js
- Express.js
- MySQL
- mysql2

### Security

- JSON Web Tokens
- bcrypt
- CORS restrictions
- API rate limiting
- Environment-based configuration

### Frontend

- HTML
- CSS
- JavaScript

## Project Structure

```text
DailyJournal/
|-- backend/
|   |-- app.js              # Express server and middleware configuration
|   |-- db.js               # Amazon RDS MySQL connection pool
|   |-- s3.js               # Amazon S3 client configuration
|   |-- package.json        # Backend dependencies
|   `-- routes/
|       |-- auth.js         # Authentication routes
|       `-- posts.js        # Post and image upload routes
|-- frontend/
|   |-- login.html          # Login page
|   |-- signup.html         # Signup page
|   |-- dashboard.html      # Main application dashboard
|   |-- script.js           # Frontend API integration
|   |-- style.css           # Auth page styling
|   `-- dashboard.css       # Dashboard styling
|-- .github/
|   `-- workflows/
|       `-- deploy.yml      # GitHub Actions deployment pipeline
|-- dockerfile              # Docker image definition
`-- README.md
```

## Deployment Environment

| Service | Purpose |
| --- | --- |
| Amazon EC2 | Application hosting |
| Amazon S3 | Image and media storage |
| Amazon RDS MySQL | Relational database |
| Application Load Balancer | Traffic distribution |
| AWS Systems Manager | Remote deployment execution |
| GitHub Actions | CI/CD automation |
| Docker | Containerized application runtime |
| Nginx | Reverse proxy and request routing |

## Environment Variables

Create a `.env` file inside the `backend/` directory for local or server runtime configuration.

```env
PORT=3000

DB_HOST=your_rds_mysql_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

JWT_SECRET=your_jwt_secret

AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET_NAME=your_s3_bucket_name

FRONTEND_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=30
```

## Local Development

Install backend dependencies:

```bash
cd backend
npm install
```

Start the application:

```bash
node app.js
```

Open the app:

```text
http://localhost:3000
```

## Database Schema

Example MySQL schema:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Posts

```http
GET /api/posts
POST /api/posts
DELETE /api/posts/:id
```

Post routes require JWT authentication.

## Learning Outcomes

This project demonstrates practical experience with:

- AWS cloud architecture
- Linux server administration
- Application deployment on EC2
- CI/CD pipeline development
- Docker containerization
- Reverse proxy configuration
- Cloud storage integration with S3
- Relational database integration with RDS MySQL
- Secrets and environment configuration
- Secure authentication implementation
- Production-style deployment automation

## Future Improvements

- Infrastructure as Code using Terraform
- Kubernetes-based deployment
- Centralized logging
- Monitoring with Prometheus and Grafana
- Blue-green deployments
- Multi-AZ high availability architecture
- Automated database migrations
- HTTPS certificate automation

## Author

Huzaifa Kazim

DevOps Engineer | AWS | Docker | Linux | CI/CD | Cloud Infrastructure
