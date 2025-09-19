# StockPilot - Inventory Management System

This project is a modern inventory management system built with Next.js, TypeScript, Tailwind CSS, ShadCN UI, and PostgreSQL, containerized with Docker for easy setup and deployment.

## Getting Started: The Easiest 2-Step Setup

This project is configured to run as a complete, isolated system using Docker. Follow these two simple steps to get everything running. **You do not need to create any `.env` file.**

### 1. Prerequisites

- **Docker Desktop**: You must have Docker and Docker Compose installed. Docker Desktop includes both. Download it from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).

### Step 1: Build and Run the Entire System

Open your terminal (e.g., Windows PowerShell) in the project's root directory and run this single command. It will build and start your application, the database, and the database management tool all at once.

```bash
docker-compose up -d --build
```
- `--build`: Use this flag the very first time you run the command.
- `-d`: Runs everything in the background (detached mode).

To stop the entire system later, run: `docker-compose down`

### Step 2: Set Up the Database (First-Time Only)

After the command in Step 1 is finished, run this second command in the same terminal. This will create all the necessary tables (products, invoices, etc.) inside your running database.

```bash
npm run db:setup
```

**That's it! Your setup is complete.**

You can now access your services:
- **StockPilot Web App**: [http://localhost:3000](http://localhost:3000)
- **pgAdmin (Optional Database Tool)**: [http://localhost:8080](http://localhost:8080)
  - **Email**: `admin@stockpilot.com`
  - **Password**: `password`
  - To connect to your database in pgAdmin, use `db` as the host name.

