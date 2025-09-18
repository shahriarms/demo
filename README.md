# StockPilot - Inventory Management System

StockPilot is a modern, responsive inventory management application designed to streamline stock, invoice, and expense tracking for small businesses. Built with Next.js, Firebase, and Tailwind CSS.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: PostgreSQL (managed by Docker)
- **Database GUI**: pgAdmin (managed by Docker)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## Getting Started: The Docker Ecosystem

This project is configured to run as a complete, isolated ecosystem using Docker. This is the highly recommended approach as it manages the web application, the database, and the database management tool in a single, cohesive environment.

### 1. Prerequisites (পূর্বশর্ত)

- **Docker Desktop**: You must have Docker and Docker Compose installed. Docker Desktop includes both and is the easiest way to get started. Download it from the official website: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).

### 2. Clone the Repository (রিপোজিটরি ক্লোন করুন)

If you haven't already, open your terminal and clone the project to your computer:
```bash
git clone https://github.com/your-username/stockpilot.git
cd stockpilot
```
*(Replace `your-username/stockpilot.git` with your actual repository URL)*

### 3. Build and Run the Entire Stack (অ্যাপ, ডেটাবেস ও pgAdmin চালান)

Run a single command from your terminal in the project's root directory. The `-d` flag runs the containers in "detached" mode (in the background).
```bash
docker-compose up -d --build
```
- **`docker-compose up`**: Reads the `docker-compose.yml` file and starts all services (`web`, `db`, `pgadmin`).
- **`--build`**: Builds the application's Docker image from the `Dockerfile`. Use this the first time or after changing source code/dependencies.
- **`-d`**: Runs the containers in the background, so your terminal is free.

To stop the entire system, run: `docker-compose down`

### 4. First-Time Database Setup (শুধুমাত্র প্রথমবার)

The very first time you run the application, you need to create the necessary database tables inside the running Docker container.

1.  Open a **new terminal window** (leave Docker running).
2.  Run the setup script:
    ```bash
    npm run db:setup
    ```
    This script connects to your Dockerized PostgreSQL database and creates the `products` table. You only need to do this once.

### 5. Accessing the Services (পরিষেবাগুলি অ্যাক্সেস করা)

Once the containers are running, you can access the different parts of your application:
- **StockPilot Web App**: [http://localhost:3000](http://localhost:3000)
- **pgAdmin (Database GUI)**: [http://localhost:8080](http://localhost:8080)
  - **Email**: `admin@stockpilot.com`
  - **Password**: `password`

---

## Database Backup and Restore (ডেটাবেস ব্যাকআপ এবং পুনরুদ্ধার)

Your data is valuable. Here’s how to back it up and restore it using both pgAdmin and the command line.

### Option 1: Using pgAdmin (Graphical Interface)

This is the easiest method for most users.

#### How to Connect to Your Database in pgAdmin:
1.  Open pgAdmin at [http://localhost:8080](http://localhost:8080) and log in.
2.  Right-click on **Servers** -> **Create** -> **Server...**.
3.  In the **General** tab, give it a name (e.g., `StockPilot Docker DB`).
4.  Switch to the **Connection** tab and fill in the details:
    - **Host name/address**: `db` (This is the service name from `docker-compose.yml`)
    - **Port**: `5432`
    - **Maintenance database**: `stockpilot_db`
    - **Username**: `user`
    - **Password**: `password`
5.  Click **Save**. You should now see your `stockpilot_db` database in the sidebar.

#### Backing Up with pgAdmin:
1.  In the pgAdmin browser, expand **Servers** -> **StockPilot Docker DB** -> **Databases**.
2.  Right-click on the `stockpilot_db` database.
3.  Select **Backup...**.
4.  **Filename**: Choose a location on your computer and name the file (e.g., `stockpilot_backup_YYYY-MM-DD.sql`).
5.  **Format**: Select **Plain**.
6.  Click the **Backup** button. A `.sql` file will be saved to your specified location.

#### Restoring with pgAdmin:
**Important:** Restoring will overwrite the current database.
1.  First, it's safest to drop and re-create the database. Right-click `stockpilot_db` and select **Delete/Drop**.
2.  Then, right-click **Databases** -> **Create** -> **Database...** and create a new database named `stockpilot_db` (owner should be `user`).
3.  Right-click on the newly created, empty `stockpilot_db`.
4.  Select **Restore...**.
5.  **Format**: Select **Custom or tar**. (Wait, if you backed up as Plain, you need to use the Query Tool).
    *Correction for `Plain` format:*
1.  Right-click the new `stockpilot_db` and select **Query Tool**.
2.  Click the "Open File" icon in the Query Tool toolbar.
3.  Find and select your `.sql` backup file. The SQL content will load into the editor.
4.  Click the "Execute/Run" icon (the lightning bolt). The commands will run and restore your data.

---

### Option 2: Using Command Line (`pg_dump` & `psql`)

This method is faster and great for automation. These commands should be run from your host machine's terminal.

#### Backing Up with CLI:
This single command connects to the running Docker container and executes `pg_dump` to create a backup file on your desktop.

```bash
# Command structure:
# docker exec -t <container_name> pg_dump -U <username> -d <database_name> > path/on/your/computer/backup.sql

docker exec -t stockpilot_db pg_dump -U user -d stockpilot_db > backup.sql
```
This will create a `backup.sql` file in your current directory.

#### Restoring with CLI:
This command pushes the `backup.sql` file into the `psql` command inside the Docker container, restoring the database.

**First, drop the public schema to start fresh:**
```bash
docker exec -t stockpilot_db psql -U user -d stockpilot_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

**Then, run the restore command:**
```bash
# Command structure:
# cat path/on/your/computer/backup.sql | docker exec -i <container_name> psql -U <username> -d <database_name>

cat backup.sql | docker exec -i stockpilot_db psql -U user -d stockpilot_db
```
Your database is now restored from the `backup.sql` file.

---
*This README provides a comprehensive guide for both Docker-based and local setups, with a strong recommendation for using the Docker ecosystem for its simplicity and reliability.*
