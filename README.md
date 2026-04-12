# Ophthalmic Officer Portal — NPCB

A complete full-stack portal for Ophthalmic Officers under the National Program for Control of Blindness (NPCB). Features include monthly reporting, PDF generation (government format), and integration with Razorpay for payments and Supabase for database.

## 📁 Project Structure

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
└── SETUP_GUIDE.md      # Detailed step-by-step deployment guide
```

## 🚀 Quick Start

### Backend
1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Set environment variables (see `SETUP_GUIDE.md`)
4. Start the server: `npm start`

### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Configure `BACKEND_URL` in `src/App.jsx`
4. Run development server: `npm run dev`

## 🛠️ Deployment

This project is designed for easy deployment:
- **Backend:** Deploy the `backend/` directory to [Render](https://render.com).
- **Frontend:** Deploy the `frontend/` directory to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
- **Database:** Use [Supabase](https://supabase.com).
- **Payments:** Use [Razorpay](https://razorpay.com).

For a complete walkthrough, refer to [SETUP_GUIDE.md](file:///d:/Government%20Officers%20Ease/SETUP_GUIDE.md).
