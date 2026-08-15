FROM eclipse-temurin:17-alpine
WORKDIR /app
COPY . .
RUN javac Server.java
EXPOSE 8086
CMD ["java", "Server"]
