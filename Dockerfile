# ==========================================
# STAGE 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# ==========================================
# STAGE 2: Build Spring Boot Backend
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /app/server

COPY server/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy Spring Boot source code
COPY server/src ./src

# Copy built React frontend into Spring Boot's static resources
COPY --from=frontend-build /app/client/dist ./src/main/resources/static

# Build single runnable JAR
RUN mvn clean package -DskipTests -B


# ==========================================
# STAGE 3: Final Single Container Runtime
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd appgroup && useradd -r -g appgroup appuser

COPY --from=backend-build /app/server/target/*.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
