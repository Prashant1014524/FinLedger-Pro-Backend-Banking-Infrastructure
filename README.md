# 🏦 FinLedger Pro — Double-Entry Banking & Ledger Infrastructure

FinLedger Pro is a backend banking microservice built with **Node.js, Express.js, and MongoDB**. It implements an **immutable double-entry ledger system**, ensuring financial consistency, balance accuracy without state drift, multi-document **ACID transactions**, **idempotent payment processing**, and JWT session management with token blacklisting.

---

## 🌟 Key Architectural Features

- **Immutable Double-Entry Ledger System (`ledger.model.js` & `account.model.js`):**
  - Account balances are derived dynamically using **MongoDB Aggregation Pipelines** (`$match`, `$group`, `$project`) over `CREDIT` and `DEBIT` ledger entries.
  - Mongoose schema middleware hooks explicitly prevent modification (`updateOne`, `findOneAndUpdate`, `deleteOne`, etc.) or deletion of ledger entries.

- **Idempotency Support (`transaction.model.js`):**
  - Prevents duplicate payments and double-spending vulnerabilities across network retries using unique `idempotencyKey` tracking.

- **ACID Compliant Transfers (`transaction.controller.js`):**
  - Multi-document transactions using MongoDB sessions (`startSession` & `commitTransaction`).
  - Ensures atomic creation of transaction records, DEBIT ledger entries, and CREDIT ledger entries. Session automatically aborts (`abortTransaction`) upon any intermediate failure.

- **JWT Authentication & Token Blacklisting (`auth.middleware.js` & `tokenBlacklist.model.js`):**
  - Token blacklisting on logout using MongoDB **TTL (Time-To-Live) indexes** (`expireAfterSeconds: 3 days`).
  - System vs. Client Role-Based Access Control (`authSystemUserMiddleware`).

- **Automated Email Receipts (`email.service.js`):**
  - Asynchronous transaction receipt and registration emails dispatched via Nodemailer and OAuth2 authentication.

---

## 🏗 System Architecture

```
                                  +-------------------+
                                  |    Client / UI    |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  | Express.js Server |
                                  +---------+---------+
                                            |
                         +------------------+------------------+
                         |                  |                  |
                         v                  v                  v
                   +-----------+      +-----------+      +-----------+
                   |   Auth    |      | Accounts  |      |Transactions|
                   +-----+-----+      +-----+-----+      +-----+-----+
                         |                  |                  |
                         v                  v                  v
                +----------------------------------------------------+
                |                   MongoDB Database                 |
                |  +-------------+  +-------------+  +------------+  |
                |  |    Users    |  |  Accounts   |  |  Ledgers   |  |
                |  +-------------+  +-------------+  +------------+  |
                |  +-------------+  +-------------+                  |
                |  |Blacklisted  |  |Transactions |                  |
                |  |   Tokens    |  |             |                  |
                |  +-------------+  +-------------+                  |
                +----------------------------------------------------+
```

---

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js (v5)
- **Database:** MongoDB & Mongoose ORM
- **Security & Auth:** JSON Web Tokens (JWT), bcryptjs, Cookie-Parser
- **Notifications:** Nodemailer (OAuth2 Gmail Service)

---

## 🚀 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | ❌ No |
| `POST` | `/api/auth/login` | Login user & issue JWT | ❌ No |
| `POST` | `/api/auth/logout` | Logout & blacklist token | ✅ Yes |

### 💳 Accounts (`/api/accounts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/accounts` | Create a new user bank account | ✅ Yes |
| `GET` | `/api/accounts` | List user accounts | ✅ Yes |
| `GET` | `/api/accounts/balance/:accountId` | Derive dynamic balance from double-entry ledger | ✅ Yes |

### 💸 Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/transactions` | Perform idempotent ACID fund transfer | ✅ Yes |
| `POST` | `/api/transactions/system/initial-funds` | Deposit system initial funds | ✅ System User |

---

## ⚙ Environment Variables Setup

Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/finledger
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
REFRESH_TOKEN=your_oauth_refresh_token
```

---

## 💻 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Prashant1014524/FinLedger-Pro-Backend-Banking-Infrastructure.git
   cd FinLedger-Pro-Backend-Banking-Infrastructure
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
