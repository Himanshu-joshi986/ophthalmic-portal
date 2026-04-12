# 🚀 OPHTHALMIC OFFICER PORTAL — COMPLETE SETUP GUIDE
## Step-by-step deployment on FREE hosting

---

## 📁 PROJECT STRUCTURE

```text
Government Officers Ease/
├── backend/            # Node.js + Express server
│   ├── server.js       # Main server logic
│   └── package.json    # Backend dependencies
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── App.jsx     # Main React application logic
│   │   └── main.jsx    # Vite entry point
│   ├── index.html      # Frontend HTML entry
│   ├── vite.config.js  # Vite configuration
│   └── package.json    # Frontend dependencies
├── supabase/
│   └── schema.sql      # Database schema and setup SQL
└── README.md           # Project overview and quick start
```

---

## STEP 1: SUPABASE SETUP (Free Database)

1. Go to https://supabase.com → Create free account
2. Click "New Project" → Name it `ophthalmic-portal`
3. Set a strong database password → **Save it securely**
4. Go to **SQL Editor** → Paste entire contents of `supabase/schema.sql` → Run
5. Go to **Authentication** → Settings → Enable Email provider
6. Go to **Settings → API** and copy:
   - `Project URL` → your `SUPABASE_URL`
   - `anon public` key → your `SUPABASE_ANON_KEY`  
   - `service_role secret` key → your `SUPABASE_SERVICE_KEY` (backend only!)

---

## STEP 2: RAZORPAY SETUP

1. Go to https://razorpay.com → Create Business Account
2. Complete KYC verification
3. Go to **Settings → API Keys** → Generate Key
4. Copy `Key ID` and `Key Secret`
5. For testing first: use Test Mode keys (rzp_test_...)
6. For live: switch to Live Mode keys

---

## STEP 3: BACKEND DEPLOYMENT (Render.com — Free)

1. Push the entire project to a GitHub repo
2. Go to https://render.com → Create free account
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Settings:
   - **Name:** ophthalmic-backend
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add **Environment Variables**:
   ```
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_secret_here
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGc...
   FRONTEND_URL=https://your-frontend.vercel.app
   PORT=3001
   ```
7. Click **Create Web Service**
8. Copy the URL: `https://ophthalmic-backend.onrender.com`

---

## STEP 4: FRONTEND CONFIGURATION

Open `src/App.jsx` and update the CONFIG section at the top:

```javascript
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";      // From Step 1
const SUPABASE_ANON_KEY = "eyJhbGc...";                        // From Step 1
const RAZORPAY_KEY_ID = "rzp_live_YOUR_KEY";                   // From Step 2
const BACKEND_URL = "https://ophthalmic-backend.onrender.com"; // From Step 3
```

---

## STEP 5: FRONTEND DEPLOYMENT (Vercel — Free)

1. Push the entire project to GitHub
2. Go to https://vercel.com → Create free account
3. Click **New Project** → Import your GitHub repo
4. Settings:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. No environment variables needed (already in App.jsx)
6. Click **Deploy**
7. Get URL: `https://ophthalmic-portal.vercel.app`

---

## STEP 6: POST-DEPLOYMENT

1. Update Render backend env var:
   ```
   FRONTEND_URL=https://ophthalmic-portal.vercel.app
   ```

2. In Supabase → **Authentication → URL Configuration:**
   - Site URL: `https://ophthalmic-portal.vercel.app`
   - Redirect URLs: `https://ophthalmic-portal.vercel.app/**`

3. Test the full flow:
   - Register → Fill profile → Pay (test mode) → Enter data → Generate PDF

---

## 🖨️ HOW PDF GENERATION WORKS

The PDF opens in a **new browser tab** perfectly formatted to match the government report. The user simply:
1. Clicks "📄 Report" button
2. A new tab opens with the formatted report
3. Browser print dialog appears
4. Select "Save as PDF" or print physically

**The PDF matches the image exactly:**
- Header: Office of District General Hospital, {District}
- Officer name and month at top
- Sections A-F with exact same rows
- March only: Progressive column with full-year totals
- Footer: Medical Officer (left) + Ophthalmic Officer (right)

---

## 🔒 SECURITY FEATURES IMPLEMENTED

1. **Locked Profile:** Name/PHC/District cannot be changed after first save
2. **Payment Linked to User ID:** Payment verified server-side with Razorpay signature
3. **Supabase RLS:** Users can only see/edit their own data
4. **Service Key on Backend Only:** Never exposed to frontend
5. **PDF Filename:** Always `{NAME}_Report_{Month}.pdf` enforced by browser
6. **Duplicate Prevention:** Unique constraint on (user_id, month, financial_year)

---

## 📊 PROGRESSIVE LOGIC

Financial year: April → March

- **April–February:** Only "During the Month" column shown
- **March:** Both "During the Month" + "Progressive" columns shown
- Progressive = SUM of all fields from April through March

---

## 💰 PAYMENT FLOW

```
User clicks Pay → 
Backend creates Razorpay Order (with user_id) →
Frontend opens Razorpay checkout → 
User pays via UPI/Card →
Razorpay calls handler with payment_id + signature →
Frontend sends to backend /api/payment/verify →
Backend verifies HMAC signature →
Updates payments table + users.payment_status = 'success' →
User gets dashboard access
```

---

## 🛠 LOCAL DEVELOPMENT

```bash
# Frontend
npm install
npm run dev
# Runs at http://localhost:5173

# Backend
cd backend
npm install
npm run dev
# Runs at http://localhost:3001
```

---

## ❓ COMMON ISSUES

**"Razorpay not defined"** → Razorpay script loads dynamically, ensure internet is available

**"Payment verification failed"** → Check RAZORPAY_KEY_SECRET matches your dashboard

**"User not found"** → Ensure Supabase schema.sql was run completely

**PDF not opening** → Allow popups for your domain in browser settings

**Render backend sleeping** → Free tier sleeps after 15min inactivity; first request may take 30s

---

## 📞 SUPPORT

For deployment issues, check:
- Supabase logs: Project → Logs
- Render logs: Service → Logs
- Browser console (F12) for frontend errors
