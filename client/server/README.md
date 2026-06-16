# MessReduction - Hostel Mess Reduction Management System

A Spring Boot application for managing hostel mess reduction requests with separate authentication flows for students and staff members (Wardens, Deputy Wardens, and Office staff).

## Table of Contents
- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Database Configuration](#database-configuration)
- [Authentication Flows](#authentication-flows)
  - [Student Authentication](#student-authentication)
  - [Staff Authentication](#staff-authentication)
- [API Endpoints](#api-endpoints)
- [Staff Accounts](#staff-accounts)
- [Running the Application](#running-the-application)
- [Swagger Documentation](#swagger-documentation)
- [Project Structure](#project-structure)

## Overview

MessReduction is a web application designed to manage hostel mess reduction requests. It supports:
- **Students**: Can submit mess reduction requests
- **Staff**: Can view and manage reduction forms based on their roles
  - **Wardens**: Manage warden-level approvals
  - **Deputy Wardens**: Handle deputy warden responsibilities
  - **Office Staff**: Process office-level tasks

## Technologies Used

- **Java 21**
- **Spring Boot 4.0.2**
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Data persistence
- **MySQL** - Database
- **JWT (JSON Web Tokens)** - Stateless authentication
- **Lombok** - Reduces boilerplate code
- **Swagger/OpenAPI** - API documentation
- **Maven** - Build tool

## Prerequisites

Before running this application, ensure you have:

1. **Java 21** installed
2. **MySQL Server** installed and running
3. **Maven** installed (or use the included Maven wrapper)
4. **Git** (optional, for cloning)

## Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MessReduction
```

### 2. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE hostelmessreduction;
```

### 3. Configure Application Properties

Edit `src/main/resources/application.properties`:

```properties
spring.application.name=MessReduction
server.port=8084

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/hostelmessreduction
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=update

# JWT Configuration
jwt.secret=MySecretKeyForJWTTokenGenerationMessReductionApp2024
jwt.expiration=86400000
```

## Database Configuration

The application uses **MySQL** as the primary database. Key entities:

| Entity | Description |
|--------|-------------|
| `StudentDetails` | Student information (name, email, registerNo, rollNo, DOB, department, phone) |
| `StaffUsers` | Staff accounts (username, password, role, email) |
| `ReductionForm` | Mess reduction requests |
| `PresentDate` | Attendance tracking |

### Staff Roles
- `Warden` - 4 warden accounts
- `DeputyWarden` - 1 deputy warden account
- `Office` - 1 office account

## Authentication Flows

### Student Authentication

Students authenticate using their **emailId** and **date of birth (DOB)**.

**Login Endpoint:**
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "emailId": "student@example.com",
  "dob": "2004-06-15"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "studentId": 1,
  "name": "John Doe"
}
```

**Note:** DOB format must be `yyyy-MM-dd`

### Staff Authentication

Staff members authenticate using **role**, **username**, and **password**.

**Login Endpoint:**
```
POST /api/staff/login
```

**Request Body:**
```json
{
  "role": "WARDEN",
  "userName": "warden1",
  "password": "warden123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userName": "warden1",
  "role": "WARDEN"
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Student login |
| `/api/staff/login` | POST | Staff login |
| `/api/student/reg` | POST | Student registration |
| `/swagger-ui.html` | GET | Swagger UI |
| `/v3/api-docs/**` | GET | OpenAPI docs |

### Protected Endpoints (JWT Authentication Required)

#### Student Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/student/**` | Various | Student-specific operations |

#### Staff Endpoints
| Endpoint | Method | Description | Role Required |
|----------|--------|-------------|---------------|
| `/api/hostelStaff/staff/warden/**` | Various | Warden operations | Warden |
| `/api/hostelStaff/staff/deputyWarden/**` | Various | Deputy warden ops | DeputyWarden |
| `/api/hostelStaff/staff/office/**` | Various | Office operations | Office |
| `/api/hostelStaff/staff/dashboard-count` | GET | Dashboard statistics | Any Staff |
| `/api/hostelStaff/staff/deputyWarden/year-count` | GET | Year count | DeputyWarden |
| `/api/hostelStaff/staff/office/year-count` | GET | Year count | Office |

## Staff Accounts

The application automatically creates default staff accounts on startup:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| warden1 | warden123 | Warden | warden1@gmail.com |
| warden2 | warden123 | Warden | warden2@gmail.com |
| warden3 | warden123 | Warden | warden3@gmail.com |
| warden4 | warden123 | Warden | warden4@gmail.com |
| deputyWarden | deputy123 | DeputyWarden | deputy@gmail.com |
| office | office123 | Office | office@gmail.com |

**Note:** Passwords are BCrypt-encoded in the database.

## Running the Application

### Using Maven Wrapper

```bash
# Clean and compile
./mvnw.cmd clean compile

# Run the application
./mvnw.cmd spring-boot:run
```

### Using Maven (if installed)

```bash
# Clean and compile
mvn clean compile

# Run the application
mvn spring-boot:run
```

### Access the Application

Once running, access:
- **Application**: http://localhost:8084
- **Swagger UI**: http://localhost:8084/swagger-ui.html

## Swagger Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:8084/swagger-ui.html
```

This provides:
- Full API endpoint listing
- Request/response schemas
- Try-it-out functionality
- Authentication token input for protected endpoints

## Project Structure

```
MessReduction/
├── src/main/java/com/hostel/MessReduction/
│   ├── Config/
│   │   └── StaffDataInitializer.java    # Initializes default staff accounts
│   ├── Controller/
│   │   ├── AuthController.java          # Student authentication
│   │   ├── StaffUsersController.java    # Staff operations
│   │   └── ...                          # Other controllers
│   ├── CustomException/
│   │   ├── InvalidCredentialsException.java
│   │   └── ...                          # Custom exceptions
│   ├── DTO/
│   │   ├── ReqDTO/                      # Request DTOs
│   │   └── ResDTO/                      # Response DTOs
│   ├── Entity/
│   │   ├── StudentDetails.java
│   │   ├── StaffUsers.java
│   │   ├── ReductionForm.java
│   │   └── ...                          # Other entities
│   ├── Repo/
│   │   └── ...                          # JPA repositories
│   ├── security/
│   │   ├── JwtFilter.java               # JWT authentication filter
│   │   ├── JwtUtil.java                 # Student JWT utility
│   │   ├── StaffJwtUtil.java            # Staff JWT utility
│   │   ├── SecurityConfig.java          # Security configuration
│   │   └── ...                          # Other security classes
│   ├── Service/
│   │   ├── StudentAuthService.java      # Student authentication service
│   │   ├── StaffAuthService.java        # Staff authentication service
│   │   └── ...                          # Other services
│   └── MessReductionApplication.java    # Main application class
├── src/main/resources/
│   └── application.properties           # Application configuration
├── pom.xml                              # Maven dependencies
└── README.md                            # This file
```

## Authentication Implementation Details

### JWT Token Structure

Both student and staff JWT tokens include:
- **Subject**: username/email
- **Role**: STUDENT, Warden, DeputyWarden, or Office
- **Issued At**: Token creation time
- **Expiration**: 24 hours (configurable)

### Security Configuration

The `SecurityConfig` class:
- Disables CSRF (for stateless JWT)
- Configures stateless session management
- Sets up role-based access control
- Adds JWT filter before UsernamePasswordAuthenticationFilter

### Custom Password Encoder

The application uses a custom password encoder that supports:
- **BCrypt**: For staff passwords (encoded in database)
- **Plain text**: For student DOB authentication

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change `server.port` in application.properties (e.g., 8085, 8086, 8087)

2. **Database connection failed**
   - Verify MySQL is running
   - Check database credentials in application.properties
   - Ensure database `hostelmessreduction` exists

3. **JWT authentication fails**
   - Check JWT secret is configured
   - Verify token is included in Authorization header: `Bearer <token>`
   - Ensure token hasn't expired

4. **Staff login fails**
   - Use correct role (WARDEN, DEPUTY_WARDEN, OFFICE)
   - Check username and password match default accounts
   - Verify staff accounts are initialized (check logs)

## License

This project is for demonstration purposes.

## Contact

For issues or questions, please contact the development team.
