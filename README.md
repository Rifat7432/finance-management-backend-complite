## Running the Project with Docker

This project provides a multi-stage Dockerfile and a Docker Compose setup for streamlined development and production deployment.

### Project-Specific Docker Requirements
- **Node.js Version:** The Dockerfile uses `node:22.13.1-slim` (set via `ARG NODE_VERSION=22.13.1`).
- **Build Process:**
  - Installs dependencies with `npm ci`.
  - Builds TypeScript sources (`npm run build`).
  - Removes dev dependencies for the production image.
- **Non-root User:** The final image runs as a non-root user (`appuser`).
- **Runtime Assets:** The `views` and `winston` directories are included in the final image for runtime use.
- **Memory Limit:** Sets `NODE_OPTIONS="--max-old-space-size=4096"` for increased memory allocation.

### Environment Variables
- The Docker Compose file includes a commented-out `env_file: ./.env` line. If your application requires environment variables, create a `.env` file in the project root and uncomment this line in `docker-compose.yml`.

### Build and Run Instructions
1. **(Optional) Configure Environment Variables:**
   - If your app requires environment variables, create a `.env` file in the project root.
2. **Build and Start the Application:**
   ```sh
   docker compose up --build
   ```
   This will build the Docker image and start the `ts-app` service.

### Ports
- **No ports are exposed by default.**
  - If your application listens on a specific port (e.g., 3000), uncomment and adjust the `ports:` section in `docker-compose.yml`:
    ```yaml
    ports:
      - "3000:3000"
    ```

### Additional Configuration
- **Database:**
  - The Compose file includes an example MongoDB service (commented out). If your app requires MongoDB, uncomment and configure the `mongo` service and the `depends_on` section.
- **Networks:**
  - All services are attached to the `appnet` bridge network.
- **Volumes:**
  - If you enable the MongoDB service, also uncomment the `volumes:` section for persistent storage.

---

**Note:**
- The application entrypoint is `node dist/server.js`.
- Only production dependencies are included in the final image for efficiency and security.
- For any additional runtime assets, ensure they are copied in the Dockerfile as needed.
