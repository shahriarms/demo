
# StockPilot - Inventory Management System

StockPilot is a modern, responsive inventory management application designed to streamline stock, invoice, and expense tracking for small businesses. Built with Next.js, Firebase, and Tailwind CSS.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: PostgreSQL (optional, with fallback to `localStorage`)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **POS Printing**: [Next.js API Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) with direct device communication.

---

## Getting Started

There are two ways to run this application: using Docker (recommended for production and easy setup) or running it locally with Node.js.

### Option 1: Running with Docker (Recommended)

This is the simplest and most reliable way to run the application, as it bundles all dependencies and configurations into a single container.

#### **Prerequisites**
- **Docker**: Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).

#### **Run the Application**
1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/your-username/stockpilot.git
   cd stockpilot
   ```
2. **(Optional) Configure PostgreSQL**: If you want to use a PostgreSQL database, create a `.env.local` file and add your `POSTGRES_URL`. See the "Backend Development" section for more details. If you skip this, the app will use `localStorage`.

3. **Start the application with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
   This command will build the Docker image and start the application container.

4. **Access the app**: Open [http://localhost:3000](http://localhost:3000) in your browser.

To stop the application, press `Ctrl + C` in the terminal.

---

### Option 2: Local Setup with Node.js

Follow these steps to get a local copy up and running on your machine for development.

#### **1. Prerequisites (পূর্বশর্ত)**

Before you begin, ensure you have the following installed on your local machine:

- **Node.js**: `v18.x` or later is recommended. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: This comes automatically with Node.js.
- **Git**: You need Git to clone the repository. You can download it from [git-scm.com](https://git-scm.com/).

#### **2. Clone the Repository (রিপোজিটরি ক্লোন করুন)**

Open your terminal (like Git Bash, PowerShell, or Command Prompt) and run the following command to clone the project to your computer:

```bash
git clone https://github.com/shahriarms/stockpilot.git
```

After the clone is complete, navigate into the project directory:
```bash
cd stockpilot
```

#### **3. Install Dependencies (প্যাকেজ ইনস্টল করুন)**

Inside the `stockpilot` folder, run this command to install all the necessary libraries and packages for the project.

```bash
npm install
```
This might take a few minutes.

#### **4. Run the Development Server (প্রজেক্ট চালান)**

Once the installation is complete, you can start the development server with this command:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The app will initially run using your browser's `localStorage` for data storage.

---

## Backend Development: PostgreSQL Integration (Optional)

This project is configured to automatically switch from `localStorage` to a live **PostgreSQL** database. The application's server actions will detect if a `POSTGRES_URL` environment variable is present and use it. Otherwise, it will fall back to using `localStorage`.

### 1. PostgreSQL Prerequisites

- **Install PostgreSQL**: Ensure PostgreSQL is installed on your local machine or use a cloud-hosted service like [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or [Vercel Postgres](https://vercel.com/storage/postgres).
- **Create a Database**: Create a new database for this project (e.g., `stockpilot_db`).
- **Get Connection String**: Obtain your database connection string. It will look something like this:
  ```
  postgresql://USER:PASSWORD@HOST:PORT/DATABASE
  ```

### 2. Set Up Environment Variables

For security, your database connection string should not be hard-coded.

1.  In the root of the project, create a copy of the `.env.local.example` file and rename it to `.env.local`.
2.  Open the new `.env.local` file and add your PostgreSQL connection string:
    ```
    POSTGRES_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
    The `.gitignore` file is already configured to ignore `.env.local`, so your credentials will not be committed to Git. If you are using Docker, `docker-compose.yml` will automatically load this file.

### 3. Set Up the Database Table

Instead of running SQL commands manually, you can now run a single command to set up your database.

In your terminal, run the following command:
```bash
npm run db:setup
```

This command will connect to your PostgreSQL database using the URL from your `.env.local` file and automatically create the necessary `products` table.

### 4. Restart and Verify

After setting up the `.env.local` file and running the `db:setup` command, **restart your development server** (`npm run dev` or `docker-compose up`). The application will now automatically perform all product operations directly on your PostgreSQL database. No other code changes are needed.

---

## Fully Functional POS Printing System

This application includes a powerful backend printing system that communicates directly with thermal printers, bypassing browser limitations for a seamless POS experience.

### How It Works
- The frontend (the **Invoice** page) sends order data as JSON to a Next.js API route (`/api/print`) when you choose the POS print option.
- The Node.js backend receives the JSON, formats a receipt, and sends raw ESC/POS commands to the printer.
- This allows for printing text, images, barcodes, QR codes, and controlling the cash drawer and cutter.

### Setting Up Your Printer

The printer configuration is managed from within the application on the **Settings** page.

1.  Navigate to the **Settings** page from the sidebar.
2.  Under **Print Settings**, select **POS Receipt**. This will reveal the POS printer configuration options.
3.  Choose your printer's connection type (**USB** or **Network**) and provide the necessary details.

#### **Option 1: USB Printer (Recommended)**
This is the simplest method for many printers. In the Settings page, simply select "USB".

**Troubleshooting USB on Windows:**
1.  Connect your thermal printer via USB. Windows may install its own driver.
2.  Download **Zadig** ([https://zadig.akeo.ie/](https://zadig.akeo.ie/)).
3.  In Zadig, go to `Options > List All Devices` and select your printer from the dropdown (e.g., "POS-80", "TM-T20II", or "Unknown Device").
4.  Select the **libusb-win32** or **WinUSB** driver from the list on the right.
5.  Click "Replace Driver". This allows Node.js to communicate directly with the printer.

**Troubleshooting USB on Linux/macOS:**
- You might need to grant Node.js permission to access the USB device. Create a file at `/etc/udev/rules.d/99-usb-thermal.rules` and add the following line, replacing `VENDOR_ID` and `PRODUCT_ID` with your printer's IDs (use `lsusb` to find them):
  ```
  SUBSYSTEM=="usb", ATTRS{idVendor}=="VENDOR_ID", ATTRS{idProduct}=="PRODUCT_ID", MODE="0666", GROUP="dialout"
  ```
- Run `sudo udevadm control --reload-rules` and unplug/replug the printer.

#### **Option 2: Network (TCP/IP) Printer**
For printers connected to your router via Ethernet or WiFi.

1.  In the Settings page, select **Network (TCP)**.
2.  Enter your printer's IP address in the "Printer IP Address" field (e.g., `192.168.1.123`).
3.  Enter the port number. `9100` is the default for most raw printing.

### Testing the Printer
1.  Configure your printer in the **Settings** page.
2.  Run the application (`npm run dev` or `docker-compose up`).
3.  Navigate to the **Invoice** page from the sidebar.
4.  Add a customer and at least one item to the invoice.
5.  Click the **"Save & Print"** button.

If everything is set up correctly, your thermal printer should print a detailed receipt. If it fails, check the terminal where you are running the app for detailed error messages.

---

## How to Push Your Code to GitHub (সম্পূর্ণ প্রজেক্ট পুশ করার নিয়ম)

If you are starting a new project in Firebase Studio and want to push it to your own GitHub repository for the first time, follow these steps very carefully.

```bash
# Initialize a new Git repository
git init
# Add ALL files to Git's tracking
git add .
# Create a "commit" - a snapshot of your entire project
git commit -m "Initial project commit with all files"
# Set the default branch name to 'main'
git branch -M main
# Connect your local project to your GitHub repository
# (আপনার রিপোজিটরির URL এখানে ব্যবহার করুন)
git remote add origin https://github.com/your-username/your-repo-name.git
# IMPORTANT: Push all your code to GitHub
git push -u origin main
```
