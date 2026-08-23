# FoodFreshness Application Runbook

Welcome to the **FoodFreshness** project! This repository contains an AI-Powered Food Freshness and Shelf-Life Prediction System, consisting of three main modules:
1. **Backend Service** (`/backend`): Node.js & Express REST API.
2. **Web Frontend** (`/frontend`): React + Vite + TypeScript web interface.
3. **Mobile Client** (`/mobile`): Cross-platform Flutter mobile application.

---

## 🛠️ Prerequisites

Before getting started, make sure you have the following installed on your machine:
* **Node.js** (v18.x or higher)
* **npm** (comes bundled with Node.js)
* **Flutter SDK** (stable channel)
* **Android Studio** (for Android Emulator / SDK tools) or **Xcode** (for iOS Simulator, macOS only)
* **MongoDB** (Optional; the backend features an automatic local in-memory fallback if MongoDB is not running)

---

## 🚀 Getting Started

### 1. Backend Server Setup (`/backend`)

The backend acts as the central API gateway. It handles user authentication, OTP email delivery via Brevo, food item metadata parsing, and scanner operations.

1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables. A `.env` file should be located in the `/backend` folder with the following settings:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/foodfreshness
   NODE_ENV=development

   # For email verification & OTPs (Brevo SMTP API)
   BREVO_API_KEY=YOUR_BREVO_API_KEY
   BREVO_SENDER_EMAIL=your-verified-sender@example.com
   BREVO_SENDER_NAME="FoodFreshness Support"
   ```
   > **Note:** If you do not have MongoDB running locally, the backend will display a warning on startup and **automatically fall back to a dynamic mock/in-memory database**. All APIs (scans, auth, inventory tracking, analytics) remain fully operational for demonstration.

4. Start the server in development mode:
   ```bash
   npm run dev
   ```
   *The backend server will run on **`http://localhost:5000`**.*

---

### 2. Web Frontend Setup (`/frontend`)

The web app is a responsive dashboard where users can scan food receipts, check inventory, look up recipes, coordinate chores, and view carbon footprint metrics.

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install the client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
   *The Vite server will launch (usually on **`http://localhost:5173`** or **`http://localhost:3000`**).*
4. Open the displayed URL in your browser. 
   > **Important:** Ensure the backend server is running on port `5000` so that API calls from the frontend succeed.

---

### 3. Flutter Mobile App Setup (`/mobile`)

The mobile client is built with Flutter and supports standard receipt/barcode scanning, expiration countdowns, push notifications, and community catalog management.

1. Navigate to the `mobile` directory:
   ```bash
   cd ../mobile
   ```
2. Fetch the Flutter packages and dependencies:
   ```bash
   flutter pub get
   ```
3. **Configure API Endpoints:**
   Open [lib/main.dart](file:///c:/Users/ksara/Downloads/FoodFreshness/mobile/lib/main.dart) and look for the connection variable (around line 45):
   ```dart
   String _backendUrl = "http://10.0.2.2:5000/api";
   ```
   * **Android Emulator:** Leave as `http://10.0.2.2:5000/api` (this is the special loopback IP to access the host machine's localhost).
   * **iOS Simulator:** Update to `http://localhost:5000/api`.
   * **Physical Device:** Update to `http://<YOUR_HOST_IP_ADDRESS>:5000/api` and ensure both your host computer and mobile device are connected to the same Wi-Fi network.

4. Launch an emulator or connect a physical device, and run:
   ```bash
   flutter run
   ```
   > **Note:** If the backend server is unreachable, the mobile app will notify you but will automatically fall back to local mock data to allow immediate UI exploration.

---

## ⚡ Production Builds & Deployment

### Backend
* Start in production mode: `npm start`
* Ensure your cloud provider sets the matching environment variables in `.env`.

### Web Frontend
* Build the optimized static assets:
  ```bash
  npm run build
  ```
* The static files will be generated in `/frontend/dist` and can be served by any static host (Netlify, Vercel, AWS S3, Nginx, etc.).

### Mobile Client
* Build Android App Bundle (AAB):
  ```bash
  flutter build appbundle
  ```
* Build iOS App Store Package (IPA):
  ```bash
  flutter build ipa
  ```
