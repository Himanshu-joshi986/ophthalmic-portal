// ============================================================
// OPHTHALMIC OFFICER PORTAL - Node.js Backend
// Deploy to Render.com (free tier)
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({
  origin: ["https://ophthalmic-portal.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// ============================================================
// CONFIG (use environment variables in production)
// ============================================================
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key for backend
const PAYMENT_AMOUNT = parseInt(process.env.PAYMENT_AMOUNT || "50000"); // ₹500 in paise

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ============================================================
// PAYMENT: CREATE ORDER
// ============================================================
app.post("/api/payment/create-order", async (req, res) => {
  const { user_id, amount } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  try {
    // Check if user exists and hasn't already paid
    let { data: user, error: userErr } = await supabase
      .from("users").select("id, payment_status").eq("id", user_id).single();

    // If user record doesn't exist in our table (but they are logged in via Supabase Auth)
    if (userErr && userErr.code === "PGRST116") {
      console.log("User record missing, creating for:", user_id);
      const { data: newUser, error: createErr } = await supabase.from("users").insert({
        id: user_id,
        email: req.body.email || "unknown@example.com", // frontend should ideally send email
        payment_status: "pending"
      }).select().single();

      if (createErr) {
        console.error("Failed to auto-create user:", createErr);
        return res.status(500).json({ error: "Database error: Could not create user profile." });
      }
      user = newUser;
    } else if (userErr || !user) {
      console.error("User check error:", userErr);
      return res.status(404).json({ error: "User profile not found. Please try logging out and back in." });
    }

    if (user.payment_status === "success") return res.status(400).json({ error: "Already paid" });

    // Create Razorpay order
    console.log("Creating Razorpay order for user:", user_id);
    const order = await razorpay.orders.create({
      amount: PAYMENT_AMOUNT,
      currency: "INR",
      receipt: `receipt_${user_id.slice(0, 8)}_${Date.now()}`,
    }).catch(err => {
      console.error("Razorpay order error:", err);
      throw new Error(`Razorpay Error: ${err.description || err.message}`);
    });

    // Save order to DB
    const { error: insertErr } = await supabase.from("payments").insert({
      user_id,
      order_id: order.id,
      amount: PAYMENT_AMOUNT,
      status: "created",
    });
    if (insertErr) {
      console.error("Insert payment error:", insertErr);
      throw new Error("Failed to save order to the database.");
    }

    res.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PAYMENT: VERIFY
// ============================================================
app.post("/api/payment/verify", async (req, res) => {
  const { user_id, order_id, payment_id, signature } = req.body;
  if (!user_id || !order_id || !payment_id || !signature) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Verify Razorpay signature
    const hmac = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature !== signature) {
      await supabase.from("payments").update({ status: "failed" }).eq("order_id", order_id);
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    // Verify this order belongs to this user
    const { data: payment } = await supabase.from("payments").select("*").eq("order_id", order_id).single();
    if (!payment || payment.user_id !== user_id) {
      return res.status(403).json({ success: false, error: "Order mismatch" });
    }

    // Update payment record
    await supabase.from("payments").update({
      payment_id,
      status: "success",
    }).eq("order_id", order_id);

    // Update user payment status
    await supabase.from("users").update({ payment_status: "success" }).eq("id", user_id);

    res.json({ success: true });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
