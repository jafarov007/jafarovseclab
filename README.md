# JafarovSecLab

## Overview
JafarovSecLab is a comprehensive, hands-on security research and penetration testing platform. It offers multiple distinct vulnerability categories (IDOR, XSS, SSRF, SQLi, etc.), each containing various isolated scenarios. By working through these scenarios, you can practice exploiting real-world application flaws and learn how they are mitigated across different programming languages (Node.js, Python, PHP, Go, Java, GraphQL).

## Features
- **Real-World Scenarios:** Scenarios are designed to replicate actual business logic flaws and architectural vulnerabilities rather than standard CTF challenges.
- **White-Box & Black-Box Approaches:** You can attack the applications blindly through the frontend interfaces or use the built-in Source Code Reviewer (`/code`) to analyze the backend logic before exploiting.
- **Microservice Architecture:** Each scenario runs as its own isolated application, complete with a unique web interface and separate backend logic.

## Installation & Setup
The entire laboratory is orchestrated using Docker and Docker Compose. 

1. Clone the repository:
   ```bash
   git clone https://github.com/jafarov/jafarovseclab.git
   cd jafarovseclab
   ```
2. Start the main dashboard:
   ```bash
   docker compose up -d --build
   ```
3. Access the dashboard:
   Open your web browser and navigate to `http://localhost:8777`.

4. Stop the environment (CLI):
   If you prefer to stop or completely remove the platform from the terminal instead of the web dashboard, you can use:
   ```bash
   docker compose down      # Stops and removes containers
   docker compose down -v   # Stops and removes containers AND deletes database volumes
   ```

## Usage & Resource Management
From the JafarovSecLab Dashboard (Port 8777), you can browse available vulnerability categories.

- **Starting a Lab:** Click "Start Lab" on a category to spin up the specific Docker containers for those scenarios.
- **Default Credentials:** Each scenario comes with pre-seeded test accounts (User A and User B). The default password for all test accounts is `password123`.

### Important: Optimizing System Resources (RAM & Disk)
Because each vulnerability category runs multiple isolated backend containers, running all labs simultaneously will consume significant system resources.

- When you finish practicing a category (for example, IDOR) and want to move on to a new one (like XSS or SQL Injection), **always click the "Tear Down Lab" button** on the dashboard for the finished lab.
- This action will stop and remove the containers, freeing up RAM and disk space, ensuring your machine continues to run smoothly.

## Disclaimer / Legal Notice
This project is built strictly for educational purposes, security research, and authorized penetration testing practice. The vulnerabilities and exploitation techniques demonstrated within JafarovSecLab must only be tested in closed laboratory environments. Utilizing the knowledge gained from this platform against unauthorized systems or third-party applications is completely illegal. The developers and contributors of this platform cannot be held responsible for any damages or legal violations that may arise. By using this laboratory, every individual agrees to comply with all applicable local and international laws.

## Contributing
JafarovSecLab is an open-source community project. We gladly welcome contributions if you want to add new vulnerability scenarios, improve existing ones, or report bugs!

1. Fork this repository (`Fork`).
2. Create a new feature/scenario branch (`git checkout -b feature/new-xss-scenario`).
3. Commit your changes (`git commit -m 'feat: Add CSP bypass scenario'`).
4. Push your branch (`git push origin feature/new-xss-scenario`).
5. Open a **Pull Request (PR)**.

### Strict Contribution Rules
- **100% Local Execution:** No code updates are allowed to make outbound requests (HTTP/DNS, etc.) to any external sources. Redirecting users to external URLs is strictly prohibited. All vulnerabilities must operate completely locally.
- **Genuine Logic:** Do not use fake or mocked HTTP responses to simulate a vulnerability. The code must contain real architectural flaws and genuine business logic vulnerabilities that naturally lead to the exploit.

For detailed contribution guidelines and the new scenario template, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Acknowledgments & References
Many of the scenarios in this laboratory are modeled after real-world vulnerabilities discovered by security researchers and public bug bounty reports shared in the [Pentester Land Writeups](https://pentester.land/writeups/) archive. We extend our gratitude to all community members who openly share their knowledge.
