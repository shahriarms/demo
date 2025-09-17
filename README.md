
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
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **POS Printing**: [Next.js API Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) with direct device communication.

---

## Getting Started

There are two primary ways to run this application. Using Docker is highly recommended as it automates the entire setup, including the database.

### Option 1: Running with Docker (Recommended One-Click Setup)

This is the simplest and most reliable way to run the application and its database. It bundles all services and configurations into a single, easy-to-manage environment.

#### **1. Prerequisites (পূর্বশর্ত)**
- **Docker**: You must have Docker and Docker Compose installed. Download Docker Desktop from the official website, as it includes both: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).

#### **2. Clone the Repository (রিপোজিটরি ক্লোন করুন)**
If you haven't already, open your terminal and clone the project to your computer:
```bash
git clone https://github.com/your-username/stockpilot.git
cd stockpilot
```
*(Replace `your-username/stockpilot.git` with your actual repository URL)*

#### **3. Build and Run Everything (অ্যাপ এবং ডেটাবেস চালান)**
Run a single command from your terminal in the project's root directory:
```bash
docker-compose up --build
```
- **`docker-compose up`**: This command reads the `docker-compose.yml` file and starts all the services defined in it (your `web` app and the `db` database).
- **`--build`**: This flag tells Docker Compose to build the application's Docker image from scratch using the `Dockerfile`. You should use this the first time you run the command or whenever you make changes to your source code or dependencies.

Docker will now download the PostgreSQL image, build your application's image, install all `npm` dependencies, and start both the database and the Next.js application inside separate, networked containers.

#### **4. Set Up the Database Table (প্রথমবার)**
The first time you run the application, you need to create the database tables. Open a **new terminal window** (leave Docker Compose running in the first one) and run the following command:
```bash
npm run db:setup
```
This command connects to the **running Docker database container** and automatically creates the necessary `products` table. You only need to do this once.

#### **5. Access the Application (অ্যাপটি দেখুন)**
Once the build is complete and the containers are running, open your web browser and navigate to:
[http://localhost:3000](http://localhost:3000)

To stop the entire system (app and database), press `Ctrl + C` in the terminal where Docker Compose is running.

---

### Option 2: Local Setup with Node.js (Manual Database)

Follow these steps if you prefer to run the application directly on your machine and manage the PostgreSQL database yourself.

#### **1. Prerequisites (পূর্বশর্ত)**

- **Node.js**: `v18.x` or later.
- **npm**: Comes with Node.js.
- **Git**: For cloning the repository.
- **PostgreSQL**: You must have a PostgreSQL server installed and running on your machine or use a cloud-hosted service.

#### **2. Clone and Install Dependencies (রিপোজিটরি ও প্যাকেজ)**
```bash
git clone https://github.com/shahriarms/stockpilot.git
cd stockpilot
npm install
```

#### **3. Set Up Environment Variables (ডেটাবেস কানেকশন)**
For security, your database connection string should be stored in an environment file.

1.  In the root of the project, create a file named `.env.local`.
2.  Open it and add your PostgreSQL connection string:
    ```
    POSTGRES_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
    *Replace with your actual database credentials.*

#### **4. Set Up the Database Table (টেবিল তৈরি)**
Run this command to connect to your specified database and create the `products` table.
```bash
npm run db:setup
```

#### **5. Run the Development Server (প্রজেক্ট চালান)**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Fully Functional POS Printing System

This application includes a powerful backend printing system that communicates directly with thermal printers.

### How It Works
- The **Invoice** page sends order data to a Next.js API route (`/api/print`).
- The Node.js backend receives the JSON, formats a receipt, and sends raw ESC/POS commands to the printer.

### Setting Up Your Printer

Configure your printer on the **Settings** page within the application.

1.  Navigate to **Settings** from the sidebar.
2.  Under **Print Settings**, select **POS Receipt**.
3.  Choose your printer's connection type (**USB** or **Network**) and provide the details.

#### **Option 1: USB Printer**
Select "USB" in the Settings. For troubleshooting, especially on Windows, you might need to use a tool like **Zadig** to replace the default driver with `libusb-win32` or `WinUSB`. This allows Node.js to communicate directly with the printer.

#### **Option 2: Network (TCP/IP) Printer**
Select "Network (TCP)" and enter your printer's IP address (e.g., `192.168.1.123`) and port (usually `9100`).

---

## How to Push Your Code to GitHub (কোড পুশ করার নিয়ম)

To push your project to your own GitHub repository for the first time:
```bash
git init
git add .
git commit -m "Initial project commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```
