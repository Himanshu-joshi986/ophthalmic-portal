import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIG - Replace with your actual keys
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://iagmjzmicsrilwvqbuxj.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZ21qem1pY3NyaWx3dnFidXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDEzMjksImV4cCI6MjA5MTU3NzMyOX0.mDUAbQGOPjCMbHuULjFtwccjSyMSLYBzRefJKx3Fd7Y";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SZbV3nEkDMa9XR";
const PAYMENT_AMOUNT = parseInt(import.meta.env.VITE_PAYMENT_AMOUNT || "50000");
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://ophthalmic-portal.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH CONTEXT
// ============================================================
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ============================================================
// UTILS
// ============================================================
const MONTHS = [
  { num: 4, name: "April" }, { num: 5, name: "May" }, { num: 6, name: "June" },
  { num: 7, name: "July" }, { num: 8, name: "August" }, { num: 9, name: "September" },
  { num: 10, name: "October" }, { num: 11, name: "November" }, { num: 12, name: "December" },
  { num: 1, name: "January" }, { num: 2, name: "February" }, { num: 3, name: "March" }
];

function getFinancialYear(month, year) {
  if (month >= 4) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

function getMonthName(num) {
  return MONTHS.find(m => m.num === num)?.name || "";
}

function pad(n) {
  return String(n || 0).padStart(2, "0");
}

const EMPTY_FORM = {
  opd_hq: "", opd_phc: "", total_tour_days: "", dressing_done: "", diagnostic_camp: "",
  total_patient_seen: "", suspect_glaucoma: "", cataract_detected: "", vit_a_deficiency: "",
  refractive_error_corrected: "", detected_45plus: "", male: "", female: "",
  post_op_followup: "", post_op_refraction: "", foreign_body: "", other_clinical: "",
  villages_attended: "", total_cataract: "", complications: "",
  school_visited: "", students_on_roll: "", students_examined: "", refractive_error_detected: "",
  vit_a_school: "", students_squint: "", corneal_opacity: "",
  camp_organised: "", op_rh_sdh_iol: "", op_dh_iol: "", op_elsewhere_iol: "",
  spectacle_students: "", spectacle_45plus: "", spectacle_operated: ""
};

// ============================================================
// PDF GENERATOR - Pixel-perfect match to the government format
// ============================================================
function generatePDFHTML(profile, month, year, data, progressive) {
  const showProgressive = month === 3;
  const monthLabel = `${getMonthName(month)} ${year}`;
  const totalOpsMonth = (parseInt(data.op_rh_sdh_iol) || 0) + (parseInt(data.op_dh_iol) || 0) + (parseInt(data.op_elsewhere_iol) || 0);
  const totalOpsProgressive = showProgressive
    ? (parseInt(progressive.op_rh_sdh_iol) || 0) + (parseInt(progressive.op_dh_iol) || 0) + (parseInt(progressive.op_elsewhere_iol) || 0)
    : 0;

  const v = (val) => pad(val || 0);
  const pv = (val) => showProgressive ? pad(val || 0) : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; background: white; color: #000; }
  .page { width: 210mm; min-height: 297mm; padding: 15mm 15mm 20mm 20mm; position: relative; }
  .header { text-align: center; margin-bottom: 10px; }
  .header h2 { font-size: 13px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
  .header h3 { font-size: 12px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; margin: 10px 0 6px 0; font-size: 11px; }
  .meta .officer { font-weight: bold; font-size: 11px; }
  .meta .month-val { font-size: 13px; font-style: italic; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th, td { border: 1px solid #000; padding: 2px 5px; }
  th { background: #f0f0f0; font-weight: bold; text-align: center; }
  .sec-label { font-weight: bold; background: #fff; width: 30px; text-align: center; }
  .sec-header { font-weight: bold; background: #fff; }
  .row-label { padding-left: 8px; }
  .sub-label { padding-left: 20px; font-style: italic; }
  .num-cell { text-align: center; font-weight: bold; min-width: 80px; }
  .total-row td { font-weight: bold; background: #f9f9f9; }
  .footer { margin-top: 30px; display: flex; justify-content: space-between; }
  .footer-block { font-size: 11px; line-height: 1.7; }
  .sig-space { height: 45px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h2>OFFICE OF THE DISTRICT GENERAL HOSPITAL, ${(profile.district || "").toUpperCase()}</h2>
    <h3>NATIONAL PROGRAM FOR CONTROL OF BLINDNESS</h3>
    <h2>REVIEW OF OPHTHALMIC OFFICER</h2>
  </div>

  <div class="meta">
    <span class="officer">NAME OF OPHTHALMIC OFFICER- ${(profile.name || "").toUpperCase()}</span>
    <span>MONTH- <span class="month-val">${monthLabel}</span></span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px"></th>
        <th style="text-align:left"></th>
        <th>During the month</th>
        ${showProgressive ? `<th>Progressive</th>` : ""}
      </tr>
    </thead>
    <tbody>
      <!-- A) TOUR DONE -->
      <tr>
        <td class="sec-label">A)</td>
        <td class="sec-header">TOUR DONE</td>
        <td class="num-cell"></td>
        ${showProgressive ? `<td class="num-cell"></td>` : ""}
      </tr>
      <tr><td></td><td class="row-label">1) O.P.D at Head Quarter</td><td class="num-cell">${v(data.opd_hq)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.opd_hq)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">2) O.P.D at P.H.C</td><td class="num-cell">${v(data.opd_phc)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.opd_phc)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">3) Total tour days</td><td class="num-cell">${v(data.total_tour_days)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.total_tour_days)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">4) Dressing done</td><td class="num-cell">${v(data.dressing_done)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.dressing_done)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">5) Diagnostic Camp</td><td class="num-cell">${v(data.diagnostic_camp)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.diagnostic_camp)}</td>`:""}</tr>

      <!-- B) OPD -->
      <tr>
        <td class="sec-label">B)</td>
        <td class="sec-header">O.P.D</td>
        <td class="num-cell"></td>
        ${showProgressive ? `<td class="num-cell"></td>` : ""}
      </tr>
      <tr><td></td><td class="row-label">1) Total patient seen</td><td class="num-cell">${v(data.total_patient_seen)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.total_patient_seen)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">2) Suspect Glaucoma</td><td class="num-cell">${v(data.suspect_glaucoma)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.suspect_glaucoma)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">3) Cataract cases detected</td><td class="num-cell">${v(data.cataract_detected)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.cataract_detected)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">4) Vit A deficiency detected</td><td class="num-cell">${v(data.vit_a_deficiency)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.vit_a_deficiency)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">5) Refractive error corrected</td><td class="num-cell">${v(data.refractive_error_corrected)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.refractive_error_corrected)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">6) 45+ detected</td><td class="num-cell">${v(data.detected_45plus)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.detected_45plus)}</td>`:""}</tr>
      <tr><td></td><td class="sub-label">Male</td><td class="num-cell">${v(data.male)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.male)}</td>`:""}</tr>
      <tr><td></td><td class="sub-label">Female</td><td class="num-cell">${v(data.female)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.female)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">7) Post Op follow up</td><td class="num-cell">${v(data.post_op_followup)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.post_op_followup)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">8) Post Op refraction</td><td class="num-cell">${v(data.post_op_refraction)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.post_op_refraction)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">9) Foreign Body</td><td class="num-cell">${v(data.foreign_body)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.foreign_body)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">10) Other clinical process</td><td class="num-cell">${v(data.other_clinical)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.other_clinical)}</td>`:""}</tr>

      <!-- C) CATARACT SURVEY -->
      <tr>
        <td class="sec-label">C)</td>
        <td class="sec-header">Cataract Survey</td>
        <td class="num-cell"></td>
        ${showProgressive ? `<td class="num-cell"></td>` : ""}
      </tr>
      <tr><td></td><td class="row-label">1) Total villages attend</td><td class="num-cell">${v(data.villages_attended)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.villages_attended)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">2) Total Cataract</td><td class="num-cell">${v(data.total_cataract)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.total_cataract)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">3) Complications</td><td class="num-cell">${v(data.complications)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.complications)}</td>`:""}</tr>

      <!-- D) SCHOOL SURVEY -->
      <tr>
        <td class="sec-label">D)</td>
        <td class="sec-header">School survey</td>
        <td class="num-cell"></td>
        ${showProgressive ? `<td class="num-cell"></td>` : ""}
      </tr>
      <tr><td></td><td class="row-label">1) Total school visited</td><td class="num-cell">${v(data.school_visited)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.school_visited)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">2) Total students on Roll</td><td class="num-cell">${v(data.students_on_roll)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.students_on_roll)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">3) Total students examined</td><td class="num-cell">${v(data.students_examined)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.students_examined)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">4) Refractive error detected</td><td class="num-cell">${v(data.refractive_error_detected)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.refractive_error_detected)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">5) Vitamin A deficiency detected</td><td class="num-cell">${v(data.vit_a_school)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.vit_a_school)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">6) Students with squint</td><td class="num-cell">${v(data.students_squint)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.students_squint)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">7) Corneal Opacity</td><td class="num-cell">${v(data.corneal_opacity)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.corneal_opacity)}</td>`:""}</tr>

      <!-- E) EYE CAMP -->
      <tr>
        <td class="sec-label">E)</td>
        <td class="sec-header">Eye camp (Target &nbsp;&nbsp;&nbsp;&nbsp;)</td>
        <td class="num-cell"></td>
        ${showProgressive ? `<td class="num-cell"></td>` : ""}
      </tr>
      <tr><td></td><td class="row-label">1) Camp organised</td><td class="num-cell">${v(data.camp_organised)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.camp_organised)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">2) Operation done R.H SDH – IOL</td><td class="num-cell">${v(data.op_rh_sdh_iol)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.op_rh_sdh_iol)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">3) Operation done D.H ${(profile.district||"")}-IOL</td><td class="num-cell">${v(data.op_dh_iol)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.op_dh_iol)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">4) Operation done elsewhere in block -IOL</td><td class="num-cell">${v(data.op_elsewhere_iol)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.op_elsewhere_iol)}</td>`:""}</tr>
      <tr class="total-row">
        <td></td>
        <td style="text-align:right; font-weight:bold; padding-right:8px;">TOTAL(2+3+4)</td>
        <td class="num-cell">${pad(totalOpsMonth)}</td>
        ${showProgressive?`<td class="num-cell">${pad(totalOpsProgressive)}</td>`:""}
      </tr>

      <!-- F) SPECTACLE DISTRIBUTION -->
      <tr>
        <td class="sec-label">F)</td>
        <td class="sec-header">Spectacle distribution</td>
        <td class="num-cell"></td>
        ${showProgressive ? `<td class="num-cell"></td>` : ""}
      </tr>
      <tr><td></td><td class="row-label">1) Spectacle to student</td><td class="num-cell">${v(data.spectacle_students)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.spectacle_students)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">2) Spectacle to 45+</td><td class="num-cell">${v(data.spectacle_45plus)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.spectacle_45plus)}</td>`:""}</tr>
      <tr><td></td><td class="row-label">3) Spectacle to Operated cases</td><td class="num-cell">${v(data.spectacle_operated)}</td>${showProgressive?`<td class="num-cell">${pv(progressive.spectacle_operated)}</td>`:""}</tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="footer-block">
      <div>MEDICAL OFFICER</div>
      <div>${(profile.phc || "").toUpperCase()}</div>
      <div>DIST- ${(profile.district || "").toUpperCase()}</div>
    </div>
    <div class="footer-block" style="text-align:center;">
      <div class="sig-space"></div>
      <div>OPHTHALMIC OFFICER</div>
      <div>${(profile.phc || "").toUpperCase()}</div>
      <div>DIST- ${(profile.district || "").toUpperCase()}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function printPDF(profile, month, year, data, progressive) {
  const html = generatePDFHTML(profile, month, year, data, progressive);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}

// ============================================================
// COMPONENTS
// ============================================================

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
      <div style={{
        width: 36, height: 36, border: "4px solid #e2e8f0",
        borderTop: "4px solid #1a56db", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const colors = {
    error: { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
    success: { bg: "#f0fdf4", border: "#86efac", text: "#16a34a" },
    info: { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12
    }}>{msg}</div>
  );
}

// ============================================================
// AUTH PAGES
// ============================================================
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Create user profile row
          await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            profile_completed: false,
            payment_status: "pending"
          });
          setMsg({ type: "success", text: "Account created! Please log in." });
          setMode("login");
        }
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: "40px 36px", width: 400,
        boxShadow: "0 25px 60px rgba(0,0,0,0.4)"
      }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, background: "linear-gradient(135deg, #1a56db, #0891b2)",
            borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", fontSize: 28
          }}>👁️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            Ophthalmic Officer Portal
          </h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            National Program for Control of Blindness
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24
        }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
              fontWeight: 600, fontSize: 13, transition: "all 0.2s",
              background: mode === m ? "white" : "transparent",
              color: mode === m ? "#1a56db" : "#64748b",
              boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
            }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <Alert type={msg?.type} msg={msg?.text} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="officer@example.com"
              style={{
                width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
                borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
                transition: "border 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "#1a56db"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              style={{
                width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
                borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box"
              }}
              onFocus={e => e.target.style.borderColor = "#1a56db"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px", background: "linear-gradient(135deg, #1a56db, #0891b2)",
            color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE SETUP PAGE (ONE-TIME)
// ============================================================
function ProfileSetupPage({ user, onComplete }) {
  const [name, setName] = useState("");
  const [phc, setPhc] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || !phc.trim() || !district.trim()) {
      setMsg({ type: "error", text: "All fields are required." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("users").update({
      name: name.trim(),
      phc: phc.trim(),
      district: district.trim(),
      profile_completed: true
    }).eq("id", user.id);
    setLoading(false);
    if (error) { setMsg({ type: "error", text: error.message }); return; }
    onComplete({ name, phc, district, profile_completed: true });
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{ background: "white", borderRadius: 16, padding: "40px 36px", width: 440, boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Complete Your Profile</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
            These details will appear on all your official reports.<br />
            <strong>This cannot be changed later.</strong>
          </p>
        </div>

        <Alert type={msg?.type} msg={msg?.text} />

        <form onSubmit={handleSave}>
          {[
            { label: "Full Name (as on official records)", val: name, set: setName, placeholder: "e.g. Miss Anjali Bharat Joshi" },
            { label: "PHC Name", val: phc, set: setPhc, placeholder: "e.g. PHC Nawargaon" },
            { label: "District", val: district, set: setDistrict, placeholder: "e.g. Chandrapur" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                style={{
                  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
                  borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          ))}

          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400e" }}>
            ⚠️ Warning: These fields are permanently locked after saving. Please double-check spellings.
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px", background: "linear-gradient(135deg, #1a56db, #0891b2)",
            color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer"
          }}>
            {loading ? "Saving..." : "Save Profile & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// PAYMENT PAGE
// ============================================================
function PaymentPage({ user, profile, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function loadRazorpay(callback) {
    if (window.Razorpay) { callback(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = callback;
    document.body.appendChild(script);
  }

  async function handlePayment() {
    setLoading(true);
    setMsg(null);
    try {
      // Call backend to create Razorpay order
      const res = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount: PAYMENT_AMOUNT })
      });
      const order = await res.json();
      if (!order.id) throw new Error("Failed to create payment order");

      loadRazorpay(() => {
        const rzp = new window.Razorpay({
          key: RAZORPAY_KEY_ID,
          amount: PAYMENT_AMOUNT,
          currency: "INR",
          name: "Ophthalmic Officer Portal",
          description: "One-time Access Fee",
          order_id: order.id,
          prefill: { email: user.email, name: profile.name },
          theme: { color: "#1a56db" },
          handler: async function (response) {
            // Verify payment on backend
            const verify = await fetch(`${BACKEND_URL}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: user.id,
                order_id: order.id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });
            const result = await verify.json();
            if (result.success) {
              await supabase.from("users").update({ payment_status: "success" }).eq("id", user.id);
              onSuccess();
            } else {
              setMsg({ type: "error", text: "Payment verification failed. Contact support." });
            }
          },
          modal: { ondismiss: () => setLoading(false) }
        });
        rzp.open();
        setLoading(false);
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{ background: "white", borderRadius: 16, padding: "40px 36px", width: 420, boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>💳</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>One-Time Access Fee</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Unlock lifetime access to the reporting portal</p>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #1a56db, #0891b2)", borderRadius: 14, padding: "24px",
          marginBottom: 24, textAlign: "center", color: "white"
        }}>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px" }}>₹500</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>One-time payment • Lifetime access</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          {["Monthly data entry (April to March)", "Official PDF report generation", "Progressive yearly calculations", "Secure report storage"].map(feat => (
            <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13, color: "#374151" }}>
              <span style={{ color: "#16a34a", fontSize: 16 }}>✓</span> {feat}
            </div>
          ))}
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "#64748b" }}>
          <strong>Accepted:</strong> UPI (PhonePe, GPay, Paytm), Debit/Credit Cards, Net Banking
        </div>

        <Alert type={msg?.type} msg={msg?.text} />

        <button onClick={handlePayment} disabled={loading} style={{
          width: "100%", padding: "14px", background: "linear-gradient(135deg, #1a56db, #0891b2)",
          color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
        }}>
          {loading ? "Processing..." : "Pay ₹500 & Get Access"}
        </button>

        <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
          🔒 Secured by Razorpay • Payment linked to your account only
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ user, profile }) {
  const [page, setPage] = useState("home"); // home | entry | view
  const [allData, setAllData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentFY = getFinancialYear(now.getMonth() + 1, now.getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("monthly_data")
      .select("*")
      .eq("user_id", user.id)
      .eq("financial_year", currentFY)
      .order("month");
    setAllData(data || []);
    setLoading(false);
  }

  function getProgressiveData(upToMonth) {
    const numerics = Object.keys(EMPTY_FORM);
    const result = {};
    numerics.forEach(k => result[k] = 0);
    const fyMonths = [4,5,6,7,8,9,10,11,12,1,2,3];
    for (const m of fyMonths) {
      const entry = allData.find(d => d.month === m);
      if (entry) {
        numerics.forEach(k => result[k] += parseInt(entry[k] || 0));
      }
      if (m === upToMonth) break;
    }
    return result;
  }

  function startEntry(month) {
    const existing = allData.find(d => d.month === month);
    setSelectedMonth(month);
    setEditingData(existing ? { ...existing } : { ...EMPTY_FORM });
    setPage("entry");
  }

  async function saveEntry(formData) {
    const now2 = new Date();
    const yr = formData.month >= 4 ? (currentFY.split("-")[0]) : (parseInt(currentFY.split("-")[0]) + 1);
    const existing = allData.find(d => d.month === selectedMonth);
    let error;
    if (existing) {
      ({ error } = await supabase.from("monthly_data").update({ ...formData, updated_at: new Date().toISOString() }).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("monthly_data").insert({
        user_id: user.id,
        month: selectedMonth,
        year: parseInt(currentFY.split("-")[0]) + (selectedMonth < 4 ? 1 : 0),
        financial_year: currentFY,
        ...formData
      }));
    }
    if (!error) { await loadData(); setPage("home"); }
    return error;
  }

  function generateReport(month) {
    const data = allData.find(d => d.month === month);
    if (!data) { alert("No data found for this month."); return; }
    const progressive = month === 3 ? getProgressiveData(3) : null;
    const yr = month >= 4 ? parseInt(currentFY.split("-")[0]) : parseInt(currentFY.split("-")[0]) + 1;
    printPDF(profile, month, yr, data, progressive);
  }

  if (loading) return <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  if (page === "entry") return (
    <DataEntryPage
      month={selectedMonth} profile={profile} existing={editingData}
      onSave={saveEntry} onBack={() => setPage("home")}
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top Nav */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "white", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>👁️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Ophthalmic Officer Portal</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>NPCB Monthly Reporting System</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{profile.name}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{profile.phc} • {profile.district}</div>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{
            marginTop: 4, background: "rgba(255,255,255,0.15)", border: "none", color: "white",
            borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer"
          }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
        {/* FY Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
            Financial Year {currentFY.replace("-", "-20")}
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            Click a month to enter data or generate report. March report includes full year progressive totals.
          </p>
        </div>

        {/* Month Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {MONTHS.map(m => {
            const entry = allData.find(d => d.month === m.num);
            const hasData = !!entry;
            const isMarch = m.num === 3;
            return (
              <div key={m.num} style={{
                background: "white", borderRadius: 12, padding: "18px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: hasData ? "2px solid #86efac" : "2px solid #e2e8f0",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{m.name}</div>
                    {isMarch && <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600, background: "#ede9fe", borderRadius: 4, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>Progressive</div>}
                  </div>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", marginTop: 4,
                    background: hasData ? "#22c55e" : "#e2e8f0"
                  }} />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                  {hasData ? "✓ Data entered" : "No data yet"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => startEntry(m.num)} style={{
                    flex: 1, padding: "6px 0", background: hasData ? "#f1f5f9" : "linear-gradient(135deg, #1a56db, #0891b2)",
                    color: hasData ? "#374151" : "white", border: "none", borderRadius: 7,
                    fontSize: 12, fontWeight: 600, cursor: "pointer"
                  }}>
                    {hasData ? "Edit" : "Enter Data"}
                  </button>
                  {hasData && (
                    <button onClick={() => generateReport(m.num)} style={{
                      flex: 1, padding: "6px 0", background: "linear-gradient(135deg, #059669, #0891b2)",
                      color: "white", border: "none", borderRadius: 7,
                      fontSize: 12, fontWeight: 600, cursor: "pointer"
                    }}>
                      📄 Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{ marginTop: 28, background: "white", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Year Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Months Submitted", val: allData.length, color: "#1a56db" },
              { label: "Total Patients Seen", val: allData.reduce((s, d) => s + (parseInt(d.total_patient_seen) || 0), 0), color: "#059669" },
              { label: "Total Eye Camps", val: allData.reduce((s, d) => s + (parseInt(d.camp_organised) || 0), 0), color: "#7c3aed" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center", padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.val}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DATA ENTRY FORM
// ============================================================
function DataEntryPage({ month, profile, existing, onSave, onBack }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...existing });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const totalOps = (parseInt(form.op_rh_sdh_iol) || 0) + (parseInt(form.op_dh_iol) || 0) + (parseInt(form.op_elsewhere_iol) || 0);

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val.replace(/[^0-9]/g, "") }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const err = await onSave(form);
    setSaving(false);
    if (err) setMsg({ type: "error", text: err.message });
  }

  const monthName = getMonthName(month);

  const sections = [
    {
      key: "A", label: "TOUR DONE",
      fields: [
        { key: "opd_hq", label: "1) O.P.D at Head Quarter" },
        { key: "opd_phc", label: "2) O.P.D at P.H.C" },
        { key: "total_tour_days", label: "3) Total tour days" },
        { key: "dressing_done", label: "4) Dressing done" },
        { key: "diagnostic_camp", label: "5) Diagnostic Camp" },
      ]
    },
    {
      key: "B", label: "O.P.D",
      fields: [
        { key: "total_patient_seen", label: "1) Total patient seen" },
        { key: "suspect_glaucoma", label: "2) Suspect Glaucoma" },
        { key: "cataract_detected", label: "3) Cataract cases detected" },
        { key: "vit_a_deficiency", label: "4) Vit A deficiency detected" },
        { key: "refractive_error_corrected", label: "5) Refractive error corrected" },
        { key: "detected_45plus", label: "6) 45+ detected" },
        { key: "male", label: "   → Male" },
        { key: "female", label: "   → Female" },
        { key: "post_op_followup", label: "7) Post Op follow up" },
        { key: "post_op_refraction", label: "8) Post Op refraction" },
        { key: "foreign_body", label: "9) Foreign Body" },
        { key: "other_clinical", label: "10) Other clinical process" },
      ]
    },
    {
      key: "C", label: "CATARACT SURVEY",
      fields: [
        { key: "villages_attended", label: "1) Total villages attend" },
        { key: "total_cataract", label: "2) Total Cataract" },
        { key: "complications", label: "3) Complications" },
      ]
    },
    {
      key: "D", label: "SCHOOL SURVEY",
      fields: [
        { key: "school_visited", label: "1) Total school visited" },
        { key: "students_on_roll", label: "2) Total students on Roll" },
        { key: "students_examined", label: "3) Total students examined" },
        { key: "refractive_error_detected", label: "4) Refractive error detected" },
        { key: "vit_a_school", label: "5) Vitamin A deficiency detected" },
        { key: "students_squint", label: "6) Students with squint" },
        { key: "corneal_opacity", label: "7) Corneal Opacity" },
      ]
    },
    {
      key: "E", label: "EYE CAMP",
      fields: [
        { key: "camp_organised", label: "1) Camp organised" },
        { key: "op_rh_sdh_iol", label: "2) Operation done R.H SDH – IOL" },
        { key: "op_dh_iol", label: `3) Operation done D.H ${profile.district}–IOL` },
        { key: "op_elsewhere_iol", label: "4) Operation done elsewhere in block –IOL" },
      ]
    },
    {
      key: "F", label: "SPECTACLE DISTRIBUTION",
      fields: [
        { key: "spectacle_students", label: "1) Spectacle to students" },
        { key: "spectacle_45plus", label: "2) Spectacle to 45+" },
        { key: "spectacle_operated", label: "3) Spectacle to Operated cases" },
      ]
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "white", padding: "16px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Back</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Data Entry — {monthName}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{profile.phc} • {profile.district}</div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
        <Alert type={msg?.type} msg={msg?.text} />

        <form onSubmit={handleSubmit}>
          {sections.map(sec => (
            <div key={sec.key} style={{ background: "white", borderRadius: 12, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "white", padding: "12px 20px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "2px 10px" }}>{sec.key}</span>
                {sec.label}
              </div>
              <div style={{ padding: "16px 20px" }}>
                {sec.fields.map(f => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
                    <label style={{ fontSize: 13, color: "#374151", flex: 1 }}>{f.label}</label>
                    <input
                      type="text" inputMode="numeric" value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                      placeholder="00"
                      style={{
                        width: 80, padding: "7px 10px", border: "1.5px solid #e2e8f0",
                        borderRadius: 7, fontSize: 15, textAlign: "center", fontWeight: 700, outline: "none",
                        color: "#0f172a", fontFamily: "monospace"
                      }}
                      onFocus={e => e.target.style.borderColor = "#1a56db"}
                      onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                ))}
                {sec.key === "E" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>TOTAL (2+3+4)</label>
                    <div style={{ width: 80, padding: "7px 10px", background: "#f1f5f9", borderRadius: 7, fontSize: 15, textAlign: "center", fontWeight: 800, color: "#1a56db", fontFamily: "monospace" }}>
                      {pad(totalOps)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {month === 3 && (
            <div style={{ background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#5b21b6" }}>
              📊 <strong>March Report:</strong> The generated PDF will include a Progressive column showing the full-year totals from April to March.
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            width: "100%", padding: "14px", background: "linear-gradient(135deg, #059669, #0891b2)",
            color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1
          }}>
            {saving ? "Saving..." : "💾 Save Data"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(uid) {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("id", uid).single();
    setProfile(data || null);
    setLoading(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>👁️</div>
        <Spinner />
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>Loading...</div>
      </div>
    </div>
  );

  // Not logged in
  if (!session) return <AuthPage onAuth={() => {}} />;

  // Profile not completed
  if (!profile || !profile.profile_completed) {
    return <ProfileSetupPage user={session.user} onComplete={p => setProfile({ ...profile, ...p, profile_completed: true })} />;
  }

  // Payment pending
  if (profile.payment_status !== "success") {
    return <PaymentPage user={session.user} profile={profile} onSuccess={() => setProfile({ ...profile, payment_status: "success" })} />;
  }

  // Full access
  return <Dashboard user={session.user} profile={profile} />;
}
