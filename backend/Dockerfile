# ---- Build Stage ----
  FROM maven:3.9.4-eclipse-temurin-21 AS build
  WORKDIR /app
  
  # Copy Maven files first for dependency caching
  COPY pom.xml .
  COPY mvnw .
  COPY .mvn .mvn
  RUN chmod +x ./mvnw
  
  # Download dependencies (so they are cached unless pom.xml changes)
  RUN ./mvnw dependency:go-offline
  
  # Copy source code
  COPY src ./src
  
  # Build the application (skip tests for faster builds in Render)
  RUN ./mvnw clean package -DskipTests
  
  # ---- Runtime Stage ----
  FROM eclipse-temurin:21-jdk-alpine
  WORKDIR /app
  
  # Copy JAR from build stage
  COPY --from=build /app/target/*.jar app.jar
  
  # Expose port (Render maps $PORT automatically)
  EXPOSE 8080
  
  # Run the app
  CMD ["java", "-jar", "app.jar"]
  