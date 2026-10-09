# ElectroSales AI - AI-Powered Sales Assistant for an Electronics Store

A full-stack, enterprise-grade AI Sales Assistant application for an electronics retail business. It empowers store owners and sales representatives to manage customers, catalog products, handle sales enquiries, and automate customer communications with Gmail integration and Gemini AI.

---

## 🌟 Key Features

1. **AI Sales Agent (Intelligence Engine)**
   - Answers natural-language business questions grounded directly on real database records (inventory, customers, enquiries, communications).
   - Sample queries supported:
     - *"Show all pending enquiries"*
     - *"What products are available below ₹50,000?"*
     - *"Which customers asked about laptops?"*
     - *"Draft a response to Rahul"*
     - *"Find customers who have not received a response"*
     - *"Suggest a suitable product based on an enquiry"*
   - Generates actionable cards embedded in answers: Open enquiry, view customer profile, inspect product specs, or immediately launch email reply composer.

2. **Full-Featured Dashboard**
   - Summary Metric Cards: Total Customers, Total Products & Available Stock, Total Enquiries, Pending/In Progress/Closed Enquiries, Enquiries Awaiting Response.
   - Quick natural language AI query bar directly accessible on the overview.
   - Recent enquiries table with status pills, product tags, and instant "Draft Reply" triggers.
   - Recent customer communication activity feed with incoming emails vs outgoing replies.

3. **Customer Management (CRUD)**
   - Complete profiles: Name, email, phone, physical address, and internal sales notes.
   - Search by name, email, or phone.
   - Comprehensive customer profile view with linked enquiry history and communication logs.
   - **AI Interaction Intelligence**: One-click "Summarize History" creates an executive briefing summarizing all customer interactions and recommending next steps for sales reps.

4. **Product Catalog Management**
   - Electronic items across categories: Laptops, Smartphones, Audio, Keyboards & Accessories, Monitors, Smartwatches.
   - Prices in Indian Rupees (INR, ₹), inventory stock counts, SKU codes, brand, availability status (`Available`, `Out of Stock`, `Discontinued`), and technical specifications.
   - Filter by category and stock availability with live total catalogue valuation.

5. **Enquiry Management System**
   - Tracks Enquiry ID, Customer ID, Enquiry text, related product, source (`Manual` or `Gmail`), received date/time, status (`Pending`, `In Progress`, `Responded`, `Closed`), and assigned staff.
   - Status transitions with full audit trail.
   - One-click AI response drafter.

6. **Gmail API & Google OAuth 2.0 Integration**
   - Official Gmail API integration using `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`.
   - Polls and scans inbox for incoming sales inquiries.
   - AI classifies messages and extracts customer details, questions, and matching products.
   - Automatically prevents duplicate imports by tracking `gmailMessageId`.
   - **Human-in-the-Loop Review**: AI drafts professional sales emails featuring exact store prices, availability, and warranty details; staff reviews, edits, and explicitly approves sending via Gmail API (`users.messages.send`).
   - Interactive Email Pipeline Simulator for immediate offline testing.

7. **Communication History & Audit Trail**
   - Real-time logging of all incoming emails, AI-generated drafts, and sent replies with timestamps and delivery channel.
   - Clear distinction between draft messages and sent messages.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend**: Node.js, Express, Vite middleware in development mode (`tsx server.ts`).
- **Database & Auth**: Google Cloud Firestore (persistent storage) & Firebase Authentication with Google OAuth 2.0.
- **AI Integration**: Google GenAI SDK (`@google/genai`) with Gemini 3.8 Flash (`gemini-3.8-flash`).
- **Email Service**: Google Gmail API v1 (Client-side Bearer token authentication).

---

## 🚀 Running the Application Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Ensure the following variables are configured:
```env
# GEMINI_API_KEY: Gemini API Key from Google AI Studio
GEMINI_API_KEY="your-gemini-api-key"

# PORT: Server port (defaults to 3000)
PORT=3000
```

### 3. Firebase & Database Configuration
The application connects to Firebase Firestore using `firebase-applet-config.json` at the project root. On initial boot, the app automatically checks Firestore and seeds realistic sample electronics catalogue products, customer records, enquiries, and communication logs.

### 4. Start the Application
Run the full-stack server (Node.js Express + React Vite):
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 📧 Setting Up Gmail API in Google Cloud Console

To use your own Google Cloud project for Gmail OAuth:

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project.
3. Enable the **Gmail API**:
   - Go to **APIs & Services > Library**.
   - Search for **Gmail API** and click **Enable**.
4. Configure the **OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Select User Type: **External** (or Internal for Google Workspace domain).
   - Fill in the required application details (App name, User support email).
   - Under **Scopes**, click **Add or Remove Scopes** and add:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
   - Under **Test Users**, add your Gmail address.
5. Create **OAuth 2.0 Credentials**:
   - Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Choose **Web application**.
   - Add your application URL to **Authorized JavaScript origins**.
6. Sign in using the "Sign in with Google" button on the top right to start syncing and replying to customer emails!

---

## 🧪 Automated Testing

Run the included integration test suite:
```bash
npx tsx test-api.ts
```

The test suite validates:
- Backend health check (`/api/health`)
- AI natural-language query grounding with inventory filtering (`/api/ai/query`)
- AI customer response drafter with prices and specs (`/api/ai/draft-response`)
- AI enquiry classifier and email entity extraction (`/api/ai/extract-enquiry`)
