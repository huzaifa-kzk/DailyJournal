# DailyChat - Cloud-Native Application Deployment on AWS

## Overview
# DailyChat

## 1. Project Overview

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
Custom Domain (ice.bio)
  |
  v
AWS Application Load Balancer
  |
  v
Target Group
  |
  v
Auto Scaling Group
  |
  v
Private EC2 Instance
  |
  v
Nginx Reverse Proxy + SSL Termination
  |
  v
Dockerized Node.js / Express Application
  |
  +--> Amazon RDS MySQL
  |
  +--> Amazon S3
```

Private subnet outbound access:

```text
Private EC2 Instance
  |
  v
NAT Gateway
  |
  v
Internet
```

Deployment flow:

```text
GitHub Repository
  |
  v
GitHub Actions
  |
  v
AWS Systems Manager
  |
  v
Private EC2 Instances
  |
  v
Docker Build + Container Restart + Nginx Reload
```

## 3. Architecture Diagram Reference

The architecture is designed around a custom domain routed through an AWS Application Load Balancer. The ALB forwards traffic to a target group connected to EC2 instances managed by an Auto Scaling Group. EC2 instances are placed inside a private application subnet and do not expose public IP addresses.

Nginx runs on each EC2 instance and forwards requests to the Dockerized Node.js application. The application communicates with Amazon RDS MySQL for structured data and Amazon S3 for image storage. Outbound access from private instances is provided through a NAT Gateway.

## 4. AWS Services Used

| AWS Service | Purpose |
| --- | --- |
| Amazon EC2 | Hosts the application runtime inside private subnets |
| Auto Scaling Group | Maintains desired capacity and scales instances based on CPU usage |
| Application Load Balancer | Routes external traffic to healthy application instances |
| Target Group | Connects the ALB to EC2 instances |
| Amazon RDS MySQL | Managed relational database for users and posts |
| Amazon S3 | Durable object storage for uploaded images |
| AWS Systems Manager | Executes deployment commands without SSH access |
| NAT Gateway | Provides outbound internet access for private EC2 instances |
| IAM | Controls permissions for deployment and AWS service access |

## 5. DevOps Features

- Fully automated CI/CD pipeline using GitHub Actions.
- Deployment through AWS Systems Manager instead of SSH keys.
- Dockerized backend service for consistent runtime environments.
- Nginx reverse proxy for request routing and SSL termination.
- Let's Encrypt certificates for HTTPS.
- Auto Scaling Group for capacity management.
- CPU-based scaling policy at 50%.
- Private EC2 instances with no public IP addresses.
- Environment-based configuration for secrets and runtime settings.
- Managed database layer using Amazon RDS MySQL.
- Object storage integration using Amazon S3.

## 6. Security Features

| Security Area | Implementation |
| --- | --- |
| Network Isolation | EC2 instances run in a private application subnet |
| Public Access Control | Traffic enters through the Application Load Balancer |
| Server Access | Deployments use AWS SSM instead of SSH |
| Authentication | JWT-based authentication |
| Password Security | Passwords are hashed with bcrypt |
| Secrets Management | Runtime secrets are stored in environment variables and GitHub Secrets |
| HTTPS | Nginx performs SSL termination using Let's Encrypt certificates |
| API Protection | Authenticated routes protect user-specific operations |
| Media Storage | Images are stored in Amazon S3 instead of local server storage |

## 7. CI/CD Pipeline

Deployment is automated with GitHub Actions and AWS Systems Manager.

Pipeline sequence:

1. Code is pushed to the `main` branch.
2. GitHub Actions workflow starts.
3. AWS credentials are configured through GitHub Secrets.
4. AWS SSM sends deployment commands to the target EC2 instances.
5. Existing application files and containers are replaced.
6. Docker image is rebuilt on the instance.
7. Application containers are restarted.
8. Nginx is reloaded.
9. Updated application becomes available through the ALB.

CI/CD flow:

```text
Developer Push
  |
  v
GitHub main Branch
  |
  v
GitHub Actions Workflow
  |
  v
AWS SSM Send Command
  |
  v
Private EC2 Instance
  |
  v
Docker Rebuild + Restart
  |
  v
Nginx Reload
  |
  v
Application Live Behind ALB
```

## 8. Containerization

The backend service runs inside Docker containers. This ensures that the runtime environment is consistent across development, testing, and production deployments.

Containerization benefits:

- Reproducible builds
- Consistent dependency management
- Faster deployment cycles
- Cleaner separation between host and application runtime
- Easier rollback and replacement of application instances

Docker workflow:

```text
Source Code
  |
  v
Docker Build
  |
  v
Application Image
  |
  v
Running Container
  |
  v
Nginx Reverse Proxy
```

## 9. Scaling Strategy

DailyJournal uses an Auto Scaling Group to manage EC2 capacity.

| Setting | Value |
| --- | --- |
| Minimum Capacity | 1 instance |
| Desired Capacity | 1 instance |
| Maximum Capacity | 4 instances |
| Scaling Policy | CPU-based |
| CPU Target | 50% |

The Application Load Balancer distributes traffic across healthy instances in the target group. As CPU utilization increases, the Auto Scaling Group can add capacity up to the configured maximum of four instances.

## 10. Technology Stack

| Category | Technologies |
| --- | --- |
| Cloud | AWS EC2, ALB, Auto Scaling Group, RDS MySQL, S3, SSM, NAT Gateway |
| DevOps | Docker, GitHub Actions, Nginx, PM2, Linux |
| Backend | Node.js, Express.js |
| Database | MySQL on Amazon RDS |
| Storage | Amazon S3 |
| Security | JWT, bcrypt, Let's Encrypt, environment variables, GitHub Secrets |
| Frontend | HTML, CSS, JavaScript |

## 11. Application Features

- User registration and login
- Secure password hashing with bcrypt
- JWT-based authentication
- Create journal/chat posts
- Upload images with posts
- Store uploaded images in Amazon S3
- View authenticated post feed
- Delete only owned posts
- Backend API served through a reverse proxy

## 12. Deployment Workflow

The deployment process is designed to avoid manual server access and reduce operational friction.

```text
Push to main
  |
  v
GitHub Actions starts
  |
  v
AWS SSM connects to private EC2
  |
  v
Application repository is refreshed
  |
  v
Docker image is rebuilt
  |
  v
Old container is stopped
  |
  v
New container starts
  |
  v
Nginx reloads
  |
  v
Traffic continues through ALB
```

This approach removes the need for SSH keys, keeps EC2 instances private, and keeps deployments repeatable.

## 13. Learning Outcomes

This project demonstrates practical experience with:

- Designing AWS application infrastructure
- Deploying applications into private EC2 subnets
- Configuring ALB, target groups, and Auto Scaling Groups
- Automating deployments with GitHub Actions
- Using AWS Systems Manager for secure remote execution
- Containerizing Node.js applications with Docker
- Configuring Nginx as a reverse proxy with SSL termination
- Integrating Amazon RDS MySQL with a backend service
- Storing media assets in Amazon S3
- Managing cloud runtime configuration through environment variables
- Applying DevOps and cloud security best practices

## 14. Future Improvements

- Define infrastructure using Terraform
- Add centralized logging with CloudWatch Logs
- Add monitoring and alerting for application and infrastructure metrics
- Implement blue-green or rolling deployments
- Add automated database migrations
- Move container runtime to Amazon ECS or EKS
- Add AWS WAF in front of the Application Load Balancer
- Use AWS Secrets Manager or SSM Parameter Store for application secrets
- Expand to a Multi-AZ deployment model

## 15. Author

Huzaifa Kazim

DevOps Engineer | AWS | Docker | Linux | CI/CD | Cloud Infrastructure
