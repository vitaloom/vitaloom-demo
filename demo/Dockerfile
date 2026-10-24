# syntax=docker/dockerfile:1.7

# Stage 1: Build with JDK 21 and the repository's Maven Wrapper.
FROM eclipse-temurin:21-jdk-alpine-3.24 AS build

WORKDIR /workspace

# Cache the Maven wrapper, build descriptor, and dependency graph separately
# from the application source so source edits do not invalidate dependency layers.
COPY --chmod=0755 mvnw ./mvnw
COPY .mvn/ .mvn/
COPY pom.xml ./pom.xml

RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp dependency:go-offline

# Only source changes should invalidate the packaging layer.
COPY src/ ./src/

RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp package \
    && mkdir -p /out \
    && cp target/*.jar /out/app.jar

# Stage 2: Run with JRE only; Maven, the compiler, and source files stay in the build stage.
FROM eclipse-temurin:21-jre-alpine-3.24 AS runtime

WORKDIR /app

RUN addgroup -S app && adduser -S -G app app

COPY --from=build --chown=app:app /out/app.jar /app/app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
