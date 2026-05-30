# BookVerse — Complete Project Setup Guide

## Project Structure

```
bookverse/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── storage.js          # Cloudinary + Supabase config
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   ├── bookController.js   # Books CRUD, upload PDF/audio
│   │   ├── orderController.js  # Orders, tracking, cancel
│   │   ├── mainController.js   # Cart, reviews, banners, admin
│   │   ├── paymentController.js# Razorpay order + subscription
│   │   ├── writerController.js # Writer social, chat, translate
│   │   └── recommendController.js # AI recommendations
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + role guards
│   │   ├── errorHandler.js     # Global error handler
│   │   └── upload.js           # Multer + Cloudinary + Supabase
│   ├── models/
│   │   ├── User.js             # Users (all 3 roles)
│   │   ├── Book.js             # Books with chapters
│   │   ├── Order.js            # Orders + tracking
│   │   └── index.js            # Review, Cart, Message, Banner
│   ├── routes/                 # All route files
│   ├── services/
│   │   ├── cronService.js      # Cart reminders, sub expiry
│   │   ├── emailService.js     # Nodemailer
│   │   └── smsService.js       # Twilio SMS + calls
│   ├── socket/
│   │   └── socketServer.js     # Socket.IO + auto-translate
│   ├── utils/
│   │   ├── helpers.js          # JWT, response helpers
│   │   └── seed.js             # Database seeder
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/common/  # Navbar, Footer, BookCard, Layouts
│   │   ├── hooks/
│   │   │   └── useSocket.js    # Socket.IO hook
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, ForgotPassword
│   │   │   ├── user/           # Home, Shop, BookDetail, Cart...
│   │   │   ├── writer/         # Dashboard, Upload, Chat, Network
│   │   │   └── admin/          # Dashboard, Books, Orders, Users
│   │   ├── store/slices/       # Redux Toolkit slices
│   │   ├── utils/
│   │   │   ├── api.js          # Axios instance
│   │   │   └── helpers.js      # Formatters, Razorpay, constants
│   │   ├── App.jsx             # Routes for all 3 roles
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docker-compose.yml
└── package.json
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | included with Node |
| MongoDB Atlas | Free tier | https://cloud.mongodb.com |
| Git | Latest | https://git-scm.com |

---

## Step 1 — External Services Setup

### 1A. MongoDB Atlas (Database)

1. Go to https://cloud.mongodb.com → **Create free account**
2. Create a new **free M0 cluster**
3. Under **Database Access** → Add user with username + password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all, or your IP)
5. Click **Connect** → **Drivers** → Copy the connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/bookverse
   ```

### 1B. Cloudinary (Images & Book Covers)

1. Go to https://cloudinary.com → **Sign up free**
2. From your Dashboard copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 1C. Supabase (PDF & Audio Files)

1. Go to https://supabase.com → **New project**
2. After project is ready → **Storage** → **New bucket**
   - Name: `bookverse-files`
   - Make it **Public**
3. Go to **Settings → API** → Copy:
   - **Project URL**
   - **anon/public key**
   - **service_role key**

### 1D. Razorpay (Payments)

1. Go to https://razorpay.com → Create account
2. Complete KYC for live mode (or use **Test mode** for development)
3. **Settings → API Keys** → Generate Test Keys:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

### 1E. Gmail (Email Notifications)

1. Use your Gmail account
2. Enable **2-Step Verification** on your Google account
3. Go to **Google Account → Security → App Passwords**
4. Generate an App Password for "Mail"
5. Use this 16-character password as `EMAIL_PASS`

### 1F. Twilio — OPTIONAL (SMS/Call Reminders)

1. Go to https://twilio.com → Sign up
2. Get a phone number (free trial gives $15 credit)
3. Copy **Account SID**, **Auth Token**, **Phone Number**
4. Skip this if you don't need SMS — the app still works

### 1G. LibreTranslate — OPTIONAL (Writer Chat Translation)

**Option A — Use public API:**
- URL: `https://libretranslate.com/translate`
- Get free API key from https://libretranslate.com

**Option B — Self-host (free, unlimited):**
```bash
pip install libretranslate
libretranslate --host 0.0.0.0 --port 5001
```
Then set `LIBRE_TRANSLATE_URL=http://localhost:5001/translate`

---

## Step 2 — Clone & Configure

```bash
# Clone the project
git clone <your-repo-url> bookverse
cd bookverse
```

### Configure Backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in all values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB — paste your Atlas connection string
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/bookverse

# JWT — use any long random string (min 32 chars)
JWT_SECRET=change_this_to_a_very_long_random_secret_string_at_least_32_chars
JWT_EXPIRE=30d

# Cloudinary — from your dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_BUCKET=bookverse-files

# Razorpay (Test mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=BookVerse <youremail@gmail.com>

# Twilio (leave blank if not using)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+1xxxxxxxxxx

# LibreTranslate (leave blank to skip translation)
LIBRE_TRANSLATE_URL=https://libretranslate.com/translate
LIBRE_TRANSLATE_API_KEY=your_key

# Admin seed credentials
ADMIN_EMAIL=admin@bookverse.com
ADMIN_PASSWORD=Admin@1234
```

---

## Step 3 — Install Dependencies

```bash
# From project root
cd backend && npm install
cd ../frontend && npm install
```

Or if you installed `concurrently` in root:
```bash
npm run install:all
```

---

## Step 4 — Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- ✅ Admin account: `admin@bookverse.com` / `Admin@1234`
- ✅ Sample writer: `writer@bookverse.com` / `Writer@1234`
- ✅ 8 sample books across all categories
- ✅ 3 sample banners
- ✅ 4 subscription plans

---

## Step 5 — Run in Development

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# React app starts at http://localhost:3000
```

Or from project root (requires concurrently):
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Step 6 — Test All Features

### As Admin (`admin@bookverse.com` / `Admin@1234`)
- Go to http://localhost:3000/admin
- Dashboard shows revenue charts and stats
- **Books → Pending** — approve/reject writer book submissions
- **Banners** — create hero banners with coupon codes
- **Orders** — update order status (packed → out for delivery → delivered)
- **Users** — suspend/activate accounts

### As Writer (`writer@bookverse.com` / `Writer@1234`)
- Go to http://localhost:3000/writer
- **Upload Book** — submit a new book with cover image
- **Edit Book** — upload audio chapters (MP3/WAV) per chapter
- **Writer Network** — search and connect with other writers
- **Messages** — real-time chat (auto-translates to recipient's language)

### As User (Register new account)
- Browse books on home page by category
- Search by Book ID (e.g. `BK-XXXXXX`), title, or author
- Add to cart → Checkout → Pay via Razorpay test or COD
- Track order delivery status in real time
- Subscribe to reading plan → Access ebook + audiobook library
- Rate and review purchased books
- Wishlist (heart icon on book cards)

---

## Razorpay Test Cards

Use these in test mode:

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future | Any 3 digits | Success |
| 5267 3181 8797 5449 | Any future | Any 3 digits | Success |

**Test UPI:** `success@razorpay`

---

## Environment — Production Deployment

### Option A: Render.com (Easiest, Free Tier Available)

**Backend on Render:**
1. New → **Web Service** → Connect your GitHub repo
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables from `.env`
6. Set `NODE_ENV=production`, `CLIENT_URL=https://your-frontend.vercel.app`

**Frontend on Vercel:**
1. Import GitHub repo at https://vercel.com
2. Root directory: `frontend`
3. Framework preset: **Vite**
4. Add env variable: `VITE_API_URL=https://your-backend.onrender.com`

Update `frontend/src/utils/api.js` baseURL:
```js
baseURL: import.meta.env.VITE_API_URL + '/api'
```

### Option B: Docker (VPS / DigitalOcean)

```bash
# Copy project to server
scp -r bookverse/ user@your-server:/app/

# On server
cd /app/bookverse
cp backend/.env.example backend/.env
# Fill in .env values

docker-compose up -d --build
```

### Option C: Railway.app

1. Create account at https://railway.app
2. New project → Deploy from GitHub
3. Add MongoDB plugin
4. Set environment variables
5. Deploy backend and frontend as separate services

---

## Common Issues & Fixes

### "Cannot connect to MongoDB"
- Check `MONGO_URI` is correct with username and password
- Make sure IP `0.0.0.0/0` is whitelisted in Atlas Network Access
- Ensure the database user has **Read and Write** permissions

### "Cloudinary upload failed"
- Double-check `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET`
- Make sure the Cloudinary account is active (not suspended)

### "Razorpay payment window not opening"
- Make sure `<script src="https://checkout.razorpay.com/v1/checkout.js">` is in `index.html`
- Verify `RAZORPAY_KEY_ID` starts with `rzp_test_` in test mode

### "Supabase file upload failed"
- Confirm the bucket name matches `SUPABASE_BUCKET` in `.env`
- Make sure bucket is set to **Public** in Supabase dashboard
- Verify `SUPABASE_SERVICE_KEY` (not anon key) is used for uploads

### "Socket.IO not connecting"
- The Vite proxy in `vite.config.js` handles this in dev automatically
- In production, ensure nginx proxies `/socket.io/` to the backend

### "Email not sending"
- Use an **App Password** from Google, not your regular Gmail password
- Enable "Less secure app access" or use App Passwords with 2FA enabled

### "Translation not working in writer chat"
- If LibreTranslate is down, messages still send in original language
- Self-host LibreTranslate for reliable translation

---

## Feature Quick Reference

| Feature | Route | Role |
|---------|-------|------|
| Home + Banner | `/` | All |
| Shop + Search | `/shop` | All |
| Book Detail + Reviews | `/books/:id` | All |
| Category Browse | `/category/:cat` | All |
| Cart | `/cart` | User |
| Checkout (COD/Online) | `/checkout` | User |
| Order Tracking | `/orders/:id` | User |
| Wishlist | `/wishlist` | User |
| Reading Library | `/library` | Subscriber |
| Read eBook | `/read/:id` | Subscriber |
| Listen Audiobook | `/listen/:id` | Subscriber |
| Subscription Plans | `/subscription` | All |
| Writer Dashboard | `/writer` | Writer |
| Upload Book | `/writer/upload` | Writer + Sub |
| Writer Network | `/writer/network` | Writer |
| Writer Chat | `/writer/chat` | Writer |
| Admin Dashboard | `/admin` | Admin |
| Approve Books | `/admin/books` | Admin |
| Manage Orders | `/admin/orders` | Admin |
| Manage Users | `/admin/users` | Admin |
| Manage Banners | `/admin/banners` | Admin |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit |
| Routing | React Router v6 |
| State | Redux Toolkit + React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Real-time | Socket.IO (writer chat + order updates) |
| Images | Cloudinary |
| Files (PDF/Audio) | Supabase Storage |
| Payments | Razorpay |
| Email | Nodemailer + Gmail SMTP |
| SMS/Calls | Twilio |
| Translation | LibreTranslate API |
| Scheduler | node-cron (cart reminders, subscription expiry) |
| Charts | Recharts |

---

*Built with ❤️ — BookVerse Platform v1.0*
