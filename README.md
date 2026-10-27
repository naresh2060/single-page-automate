# MetaSync — Facebook Page Automation & Analytics Dashboard

A modern, full-stack **MERN (MongoDB, Express, React, Node.js)** application designed for automating, managing, and analyzing a **Facebook Page** using the **Meta Graph API (v25.0)**.

---

## 🚀 Key Features

* **Facebook Graph API Integration:** Directly communicates with Meta's Graph API to fetch Page details, cover photos, verification badges, followers, and engagement metrics.
* **Live & Demo Hybrid Mode:** Operates with live Facebook Graph API data when credentials are provided, or seamlessly runs in interactive demo mode with rich preview data when credentials are not yet configured.
* **Enterprise Security Architecture:** 
  * The `FACEBOOK_PAGE_ACCESS_TOKEN` is strictly stored on the backend.
  * Access tokens are **never** returned in API responses or exposed to the client.
* **Modern SaaS Dashboard UI:**
  * **Dashboard:** Follower metrics, engagement rate, recent posts feed, quick post composer, and audience interaction breakdown.
  * **Facebook Page:** Full profile overview, cover banner, verified badge, description, category, and Meta Graph telemetry.
  * **Posts Feed:** Search filter, engagement sort, likes/comments/shares counters, and direct links to live Facebook posts.
  * **Post Scheduler:** Post automation pipeline to schedule posts for future dates/times, cancel queued posts, or publish immediately.
  * **Performance Analytics:** Historical engagement bar charts, interaction distribution, estimated organic reach, and top post spotlight.
  * **Social Automation Suite:** AI Social Copy Assistant for drafting high-converting post captions, and an auto-reply rule engine for keyword triggers.
  * **News-to-Facebook Posts:** Gemini turns article text into a short, simple summary in the article's language. News posts use the original article image as a native Facebook photo post and do not attach the article link.
  * **Settings & Connectivity:** Live Meta Graph connection tester, MongoDB database monitor, and comprehensive token configuration guide.

---

## 📁 Project Structure

```text
facebook-page-automation/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Header, Sidebar, StatCard, PostCard, etc.)
│   │   ├── context/            # Centralized Dashboard Context state management
│   │   ├── layouts/            # DashboardLayout shell
│   │   ├── pages/              # Dashboard, FacebookPage, Posts, Scheduler, Analytics, Automation, Settings
│   │   ├── services/           # Axios API layer (api.js, facebookApi.js)
│   │   ├── App.jsx             # Tab-based page router
│   │   ├── index.css           # Modern design system with CSS custom properties
│   │   └── main.jsx
│   ├── .env                    # Frontend environment file
│   ├── .env.example
│   ├── index.html
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/             # DB connection (db.js) & Env validation (env.js)
│   │   ├── controllers/        # Route controllers (facebook, post, automation)
│   │   ├── middleware/         # Centralized error handling & token sanitization
│   │   ├── models/             # Mongoose schemas (Post, ScheduledPost, AutomationSetting, PageConfig)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Facebook Graph API service (facebook.service.js)
│   │   ├── utils/              # Standardized API response helpers
│   │   └── app.js              # Express app configuration
│   ├── .env                    # Backend environment file (Backend only)
│   ├── .env.example
│   ├── server.js               # Entry point
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

---

## 🛠️ Prerequisites

* **Node.js:** v18.0.0 or higher (v24+ recommended)
* **npm:** v9.0.0 or higher
* **MongoDB:** Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

---

## 🔑 Environment Variables Setup

### 1. Server Configuration (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/facebook_automation

# Facebook Page Credentials (Backend only - NEVER expose to client)
FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_long_lived_page_access_token
FACEBOOK_GRAPH_API_VERSION=v25.0

# Google Gemini (backend only; never expose this key in client/.env)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

CLIENT_URL=http://localhost:5173
```

> **Note:** If `FACEBOOK_PAGE_ID` or `FACEBOOK_PAGE_ACCESS_TOKEN` is left as a placeholder, the server uses **Demo/Preview Mode**. When credentials are configured, the dashboard fetches live Page details and posts; Graph API errors are surfaced instead of being replaced with sample data.
>
> Add your Gemini API key to `server/.env` as `GEMINI_API_KEY`, then restart the backend. The key stays on the server. News summaries are generated from article text; the original article image is attached to Facebook, and the article URL is not included in the published post. AI summary generation reports an error if Gemini is unavailable rather than silently substituting a template, and publishing is blocked if no original image is available.

### 2. Client Configuration (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🌐 Quick Start Guide

### Step 1: Install Dependencies

From the project root:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Start MongoDB

Ensure your MongoDB service is running:
* **Windows (PowerShell):** `Start-Service MongoDB`
* **macOS / Linux:** `brew services start mongodb-community` or `sudo systemctl start mongod`

### Step 3: Start the Backend Server

```bash
cd server
npm run dev
```

* Backend runs at: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`

### Step 4: Start the Frontend Client

In a separate terminal:

```bash
cd client
npm run dev
```

* Frontend runs at: `http://localhost:5173`

---

## 📘 Meta Graph API Credentials Guide

To connect your real Facebook Page:

1. **Create a Meta App:** Go to [Meta for Developers](https://developers.facebook.com/) and create a "Business" app.
2. **Open Graph API Explorer:** Go to **Tools > Graph API Explorer**.
3. **Select Permissions:** Request the following permissions:
   * `pages_show_list`
   * `pages_read_engagement`
   * `pages_manage_posts`
   * `pages_read_user_content`
4. **Get Page Token:** Generate a User Token, then run:
   ```text
   GET /me/accounts
   ```
5. **Copy ID and Token:** Copy your `id` (Facebook Page ID) and `access_token` (Page Access Token).
6. **Extend to Long-Lived Token:** Use the Access Token Tool to exchange the short-lived token for a **long-lived (60 days or permanent) Page Access Token**.
7. **Paste into `server/.env`:**
   ```env
   FACEBOOK_PAGE_ID=123456789012345
   FACEBOOK_PAGE_ACCESS_TOKEN=EAAB...
   ```
8. Restart the server or click **"Refresh"** on the dashboard. MetaSync will automatically synchronize your live Facebook Page!

---

## 📡 REST API Endpoints

### Health & System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & MongoDB connection status |

### Facebook Graph API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/facebook/page` | Fetch connected Facebook Page details |
| `GET` | `/api/facebook/posts` | Fetch recent posts with reactions & comments |
| `GET` | `/api/facebook/analytics` | Fetch engagement rates, reach & breakdown |
| `POST` | `/api/facebook/posts` | Publish a new post to the Facebook Page |
| `GET` | `/api/facebook/connection` | Test live Graph API credentials |

### Post Automation Scheduler
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/posts/scheduled` | Get list of queued scheduled posts |
| `POST` | `/api/posts/schedule` | Schedule a new post with date & time |
| `DELETE` | `/api/posts/scheduled/:id` | Cancel and delete scheduled post |
| `POST` | `/api/posts/scheduled/:id/publish-now` | Publish scheduled post immediately |

### Automation & AI
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/automation/settings` | Get automated rules & schedule settings |
| `PUT` | `/api/automation/settings` | Update auto-reply keywords & preferences |
| `POST` | `/api/automation/generate-draft` | Generate AI-assisted social media copy |

---

## 🔒 Security Best Practices

1. **Backend-Only Tokens:** Facebook credentials never pass to the client browser.
2. **Sanitized Errors:** Error handlers catch and mask any accidental access token leaks before responding to clients.
3. **CORS Protected:** Backend restricts API access to authorized frontend origins.
4. **Environment Isolation:** `.env` files are strictly excluded via `.gitignore`.
