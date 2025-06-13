# IAM Backend

A Java Spring Boot backend for Identity & Access Management (IAM).  
PostgreSQL is containerized using Docker for easy local setup.

## 🚀 Features

- ✅ Spring Boot backend with REST APIs
- ✅ PostgreSQL database via Docker
- ✅ Java Persistence API (JPA) with Hibernate
- ✅ GitHub-based version control
- 🔜 Coming soon: User, Role, and Permission logic

## 🐳 Docker Setup

Run this in a terminal to launch the database:

```bash
docker run --name iam-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=iamdb -p 5432:5432 -d postgres