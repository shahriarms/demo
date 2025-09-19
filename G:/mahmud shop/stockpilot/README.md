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

## Getting Started: The Easiest 2-Step Setup

This project is configured to run as a complete, isolated system using Docker. Follow these two simple steps to get everything running. **You do not need to create any `.env` file.**

### 1. Prerequisites (পূর্বশর্ত)

- **Docker Desktop**: You must have Docker and Docker Compose installed. Docker Desktop includes both. Download it from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).

### Step 1: Build and Run the Entire System

Open your terminal (like **Windows PowerShell**) in the project's root directory and run this single command. It will build and start your application, the database, and the database management tool all at once.

```bash
docker-compose up -d --build
```

- **`--build`**: Use this flag the very first time you run the command. It builds the necessary Docker images.
- **`-d`**: Runs everything in the background (detached mode).

To stop the entire system later, run: `docker-compose down`

### Step 2: Set Up the Database (First-Time Only)

After the command in Step 1 is finished (it might take a minute), run this second command in the same terminal. This will create all the necessary tables (products, invoices, buyers, expenses, etc.) inside your running database.

```bash
npm run db:setup
```

**That's it! Your setup is complete.**

You can now access your services:
- **StockPilot Web App**: [http://localhost:3000](http://localhost:3000)
- **pgAdmin (Optional Database Tool)**: [http://localhost:8080](http://localhost:8080)
  - **Email**: `admin@stockpilot.com`
  - **Password**: `password`

---

## How to Start the Application Automatically on PC Startup
*(পিসি চালু করার সাথে সাথে অ্যাপ্লিকেশন স্বয়ংক্রিয়ভাবে চালু করার পদ্ধতি)*

You can configure Docker to automatically start your StockPilot application every time you turn on your computer. This is possible because we've set `restart: always` in our `docker-compose.yml` file.

You just need to enable one setting in Docker Desktop:

1.  **Open Docker Desktop Settings:**
    - Find the Docker icon in your system tray (usually at the bottom-right of your screen).
    - Right-click the icon and select **Settings**.

2.  **Enable "Start Docker Desktop when you log in":**
    - In the Settings window, go to the **General** tab.
    - Make sure the checkbox for **"Start Docker Desktop when you log in"** is checked.
    - Click **"Apply & restart"**.



That's it! Now, whenever you log in to your PC, Docker will start automatically, and because of the `restart: always` policy, it will automatically start your StockPilot app, database, and pgAdmin containers.

---

## Database Management (ডেটাবেস পরিচালনা)

Your data is valuable. Here’s how to interact with, back up, and restore your database.

### Accessing the Database via CLI (psql)

For developers who prefer the command line, `psql` is a powerful tool for interacting with your PostgreSQL database. It is already included in your database container.

To open an interactive `psql` session, run the following command in your terminal:

```bash
docker exec -it stockpilot_db psql -U user -d stockpilot_db
```

This command does the following:
- `docker exec`: Executes a command inside a running container.
- `-it`: Runs the command in interactive mode, connecting your terminal to the container's terminal.
- `stockpilot_db`: The name of your database container.
- `psql -U user -d stockpilot_db`: The command to run inside the container, which starts `psql` with username `user` connected to the `stockpilot_db` database.

You will now have a `psql` prompt (e.g., `stockpilot_db=>`) where you can run SQL queries directly (e.g., `SELECT * FROM products;`). Type `\q` to exit.

### Backup and Restore

#### Option 1: Using pgAdmin (Graphical Interface)

This is the easiest method for most users.

**How to Connect to Your Database in pgAdmin:**
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

**Backing Up with pgAdmin:**
1.  In the pgAdmin browser, expand **Servers** -> **StockPilot Docker DB** -> **Databases**.
2.  Right-click on the `stockpilot_db` database.
3.  Select **Backup...**.
4.  **Filename**: Choose a location on your computer and name the file (e.g., `stockpilot_backup_YYYY-MM-DD.sql`).
5.  **Format**: Select **Plain**.
6.  Click the **Backup** button. A `.sql` file will be saved to your specified location.

**Restoring with pgAdmin:**
**Important:** Restoring will overwrite the current database.
1.  First, it's safest to drop and re-create the database. Right-click `stockpilot_db` and select **Delete/Drop**.
2.  Then, right-click **Databases** -> **Create** -> **Database...** and create a new database named `stockpilot_db` (owner should be `user`).
3.  Right-click on the newly created, empty `stockpilot_db`.
4.  Select **Query Tool**.
5.  Click the "Open File" icon in the Query Tool toolbar.
6.  Find and select your `.sql` backup file. The SQL content will load into the editor.
7
.  Click the "Execute/Run" icon (the lightning bolt). The commands will run and restore your data.

---

#### Option 2: Using Command Line (`pg_dump` & `psql`)

This method is faster and great for automation. These commands should be run from your host machine's terminal.

**Backing Up with CLI:**
This single command connects to the running Docker container and executes `pg_dump` to create a backup file on your desktop.

```bash
# Command structure:
# docker exec -t <container_name> pg_dump -U <username> -d <database_name> > path/on/your/computer/backup.sql

docker exec -t stockpilot_db pg_dump -U user -d stockpilot_db > backup.sql
```
This will create a `backup.sql` file in your current directory.

**Restoring with CLI:**
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
*This README provides a comprehensive guide for the recommended Docker ecosystem, ensuring simplicity and reliability.*
