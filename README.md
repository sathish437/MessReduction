# MessReduction - Hostel Mess Reduction Management System

## Overview
MessReduction is a full-stack hostel mess reduction management system designed to digitize reduction requests and streamline the approval workflow between students and hostel administration. The application eliminates paper-based forms, ensures policy compliance, and provides request status tracking and audit logging.

## Features
- **Student Registration & Verification**: Institutional verification and student profile management.
- **JWT Authentication**: Stateless token-based authentication for students and staff.
- **Role-Based Authorization**: Fine-grained access control across different operational tiers.
- **Multi-Level Approval Workflow**: Sequential review pipeline for mess reduction requests with configurable auto-approval support.
- **Request Tracking & Status Management**: Request lifecycle tracking with status updates (Pending, Approved, Rejected, Completed).
- **Staff Dashboard & Statistics**: Summarized metrics, pending request counts, and department/year-wise analytics.
- **Activity & Audit Tracking**: Logging of administrative actions, credential updates, and request transitions.
- **Notification System**: Web Push and FCM-based notifications for request updates.
- **Swagger / OpenAPI Documentation**: Interactive API documentation and testing endpoint.

## Tech Stack
### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT

### Frontend
- React.js
- Tailwind CSS

### Database
- PostgreSQL

### Tools
- Maven
- Swagger / OpenAPI
- Git

## User Roles
- **Student**: Submits mess reduction requests and monitors application status.
- **Deputy Warden**: First-level authority reviewing and approving/rejecting initial reduction requests.
- **Warden / Associate Warden**: Second-level authority performing secondary review and authorization.
- **Office**: Administrative authority finalizing approved requests and processing mess billing adjustments.

## Workflow
```text
Student
  ↓ Submit Reduction Request
Deputy Warden Review
  ↓ Approved (Manual or Configured Auto-Approval)
Warden Review
  ↓ Approved (Manual or Configured Auto-Approval)
Office Processing
  ↓ Processed
Final Status (Approved / Completed)
```
*(Requests rejected at any stage transition to Rejected status with reviewer remarks).*

## Architecture
```text
React.js Frontend
        ↓ (HTTP / REST API)
Spring Boot REST Controllers
        ↓
Spring Security + JWT Authentication
        ↓
Service Layer (Business Logic & Validation)
        ↓
Repository Layer (Spring Data JPA)
        ↓
PostgreSQL Database
```

## Key Backend Implementation
- **RESTful APIs**: Resource-oriented endpoints with standard HTTP status codes and structured payloads.
- **Layered Architecture**: Separation of concerns across Controller, Service, and Repository layers.
- **DTO-Based Data Transfer**: Decoupled domain models using dedicated Request/Response DTOs and Mappers.
- **JWT Authentication**: Stateless authentication with custom filters and role claim extraction.
- **Role-Based Access Control (RBAC)**: Method-level and URL-based security constraints for students and staff roles.
- **JPA / Hibernate Persistence**: Entity mapping and database persistence using Spring Data JPA and Hibernate.
- **Global Exception Handling**: Centralized exception handler providing consistent error responses.
- **Swagger / OpenAPI**: Automated interactive API schema generation.

## Setup

### Prerequisites
- Java 21+
- Node.js 18+ & npm
- PostgreSQL 14+
- Maven 3.9+ (or included Maven Wrapper)

### 1. Clone the Repository
```bash
git clone https://github.com/sathish437/MessReduction.git
cd MessReduction
```

### 2. Configure Database & Environment
Set the following environment variables (or define them in a local `.env` file):

```properties
# Server
PORT=8080

# Database
SPRING_DATABASE_URL=jdbc:postgresql://localhost:5432/mess_reduction
SPRING_DATABASE_USERNAME=your_username
SPRING_DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRATION=86400000

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Run Backend (Spring Boot)
```bash
cd server
./mvnw spring-boot:run
```
The server will start at `http://localhost:8080`.

### 4. Run Frontend (React)
```bash
cd ../client
npm install
npm run dev
```
The client application will start at `http://localhost:5173`.

## API Documentation
When the backend is running, Swagger UI and OpenAPI documentation are accessible at:
- **Swagger UI**: `http://localhost:8080/swagger-ui/index.html`
- **OpenAPI Schema**: `http://localhost:8080/v3/api-docs`

## Project Structure
```text
MessReduction/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── api/                # API client & services
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   └── services/           # Authentication & app services
│   └── package.json
│
├── server/                     # Spring Boot backend application
│   ├── src/main/java/com/hostel/MessReduction/
│   │   ├── Config/             # Security, CORS & app configurations
│   │   ├── Controller/         # REST API Controllers
│   │   ├── CustomException/    # Custom exception classes & handlers
│   │   ├── DTO/                # Request & Response DTOs
│   │   ├── Entity/             # JPA entity models
│   │   ├── MappingDTO/         # Entity-DTO mappers
│   │   ├── Repo/               # Spring Data JPA repositories
│   │   ├── Service/            # Business logic & schedulers
│   │   ├── security/           # JWT filters & user details services
│   │   └── utils/              # Helper utilities
│   └── pom.xml
└── README.md
```
