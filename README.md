# Fuelizer - Fuel Station Management System

Fuelizer is a comprehensive, full-stack solution designed to streamline the operations of fuel stations. It integrates real-time monitoring, inventory management, point-of-sale (POS) operations, and detailed accounting into a single, unified platform.

## 🚀 Key Features

### 🏢 FuelAdmin Dashboard
A powerful command center for station managers and administrators:
-   **Inventory Management**: Track fuel stock in tanks and non-fuel products in the warehouse.
-   **Product Master**: Manage product details, categories, and pricing with detailed tax configurations (GST, VAT).
-   **Sales Management**: comprehensive sales tracking, credit customer management, and automated invoicing.
-   **Decantation Logs**: Record and monitor fuel deliveries from tankers to underground tanks.

### 💻 Operator Point of Sale (POS)
A dedicated interface for fuel attendants:
-   **Quick Sales**: Fast processing of fuel and product sales.
-   **Shift Management**: Track operator shifts, nozzle readings, and cash handes.
-   **Payment Flexibility**: Support for Cash, Card, UPI, and Credit sales.

### 📊 Live Monitoring
Real-time visibility into station operations:
-   **Booth Monitoring**: Live status of all fuel dispensers and nozzles.
-   **Tank Monitoring**: Real-time fuel levels, temperature, and water detection.

### 📈 Accounting & Finance
Integrated financial management system:
-   **General Ledger**: Automated posting of sales and purchase transactions.
-   **Vouchers**: Receipt, Payment, and Journal vouchers.
-   **Financial Reports**: Balance Sheet, Profit & Loss, and Trial Balance.

## 🛠️ Technology Stack

### Frontend
-   **Framework**: [React](https://reactjs.org/) (powered by [Vite](https://vitejs.dev/))
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management & UI**: Context API, Custom Hooks
-   **Key Libraries**:
    -   `@fullcalendar/react`: For shift and schedule management.
    -   `apexcharts` / `recharts`: For data visualization and analytics.
    -   `axios`: For API communication.
    -   `lucide-react`: For modern UI icons.

### Backend
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Sequelize](https://sequelize.org/)
-   **Caching**: [Redis](https://redis.io/) (via `ioredis`)
-   **Authentication**: JSON Web Tokens (JWT) & bcrypt
-   **Key Services**:
    -   `node-cron`: For scheduled tasks (daily closing, reports).
    -   `winston`: For centralized logging.
    -   `multer`: For file uploads.

## 📂 Project Structure

-   **`frontend/`**: Contains the React application source code.
    -   `src/pages/`: Main application views (FuelAdmin, Operator, Auth).
    -   `src/components/`: Reusable UI components.
    -   `src/context/`: Global state providers.
-   **`backend/`**: Contains the Express API server.
    -   `controller/`: Handles incoming HTTP requests.
    -   `services/`: Business logic layer.
    -   `repository/`: Database interaction layer.
    -   `models/`: Sequelize database schemas.
    -   `route/`: API endpoint definitions.

## ⚙️ Setup & Installation

### Prerequisites
-   Node.js (v18+ recommended)
-   PostgreSQL
-   Redis (optional, for caching features)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` directory based on your configuration (example):
    ```env
    PORT=3000
    DB_NAME=fuelizer_db
    DB_USER=postgres
    DB_PASSWORD=yourpassword
    DB_HOST=localhost
    JWT_SECRET=your_jwt_secret
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.