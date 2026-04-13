import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIG - Set in Vercel Environment Variables
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const PAYMENT_AMOUNT = parseInt(import.meta.env.VITE_PAYMENT_AMOUNT || "50000");
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// CONSTANTS
// ============================================================
const MONTHS = [
  { num: 4,  name: "April" },   { num: 5,  name: "May" },
  { num: 6,  name: "June" },    { num: 7,  name: "July" },
  { num: 8,  name: "August" },  { num: 9,  name: "September" },
  { num: 10, name: "October" }, { num: 11, name: "November" },
  { num: 12, name: "December"},  { num: 1,  name: "January" },
  { num: 2,  name: "February" },{ num: 3,  name: "March" },
];
const FY_ORDER = [4,5,6,7,8,9,10,11,12,1,2,3];

function getFinancialYear(month, year) {
  return month >= 4 ? `${year}-${String(year+1).slice(2)}` : `${year-1}-${String(year).slice(2)}`;
}
function getMonthName(n) { return MONTHS.find(m=>m.num===n)?.name||""; }
function pad(n) { return String(Math.max(0,parseInt(n)||0)).padStart(2,"0"); }

const EMPTY_FORM = {
  opd_hq:"", opd_phc:"", total_tour_days:"", dressing_done:"", diagnostic_camp:"",
  total_patient_seen:"", suspect_glaucoma:"", cataract_detected:"", vit_a_deficiency:"",
  refractive_error_corrected:"", detected_45plus:"", male:"", female:"",
  post_op_followup:"", post_op_refraction:"", foreign_body:"", other_clinical:"",
  villages_attended:"", total_cataract:"", complications:"",
  school_visited:"", students_on_roll:"", students_examined:"", refractive_error_detected:"",
  vit_a_school:"", students_squint:"", corneal_opacity:"",
  camp_organised:"", op_rh_sdh_iol:"", op_dh_iol:"", op_elsewhere_iol:"",
  spectacle_students:"", spectacle_45plus:"", spectacle_operated:"",
};

// Progressive = sum of April up to & including targetMonth
// For April: sum = just April (progressive == during month)
function calcProgressive(allData, targetMonth) {
  const keys = Object.keys(EMPTY_FORM);
  const result = {};
  keys.forEach(k => result[k] = 0);
  for (const m of FY_ORDER) {
    const entry = allData.find(d => d.month === m);
    if (entry) keys.forEach(k => { result[k] += parseInt(entry[k]||0); });
    if (m === targetMonth) break;
  }
  return result;
}

// ============================================================
// PDF 1 — REVIEW OF OPHTHALMIC OFFICER
// Progressive shown for ALL months
// ============================================================
function generateReviewHTML(profile, month, year, data, prog) {
  const D = (k) => pad(data[k]);
  const P = (k) => pad(prog[k]);
  const totalDM = (parseInt(data.op_rh_sdh_iol)||0)+(parseInt(data.op_dh_iol)||0)+(parseInt(data.op_elsewhere_iol)||0);
  const totalPR = (parseInt(prog.op_rh_sdh_iol)||0)+(parseInt(prog.op_dh_iol)||0)+(parseInt(prog.op_elsewhere_iol)||0);

  const secRow = (sec, label) => `
    <tr>
      <td style="border:1px solid #000;text-align:center;font-weight:700;background:#f5f5f5;padding:2px 4px;">${sec})</td>
      <td style="border:1px solid #000;font-weight:700;background:#f5f5f5;padding:2px 6px;">${label}</td>
      <td style="border:1px solid #000;background:#f5f5f5;"></td>
      <td style="border:1px solid #000;background:#f5f5f5;"></td>
    </tr>`;

  const dataRow = (label, dm, pr, indent=false) => `
    <tr>
      <td style="border:1px solid #000;"></td>
      <td style="border:1px solid #000;padding:2px 6px;${indent?"padding-left:18px;font-style:italic;":""}">${label}</td>
      <td style="border:1px solid #000;text-align:center;font-weight:700;font-family:monospace;padding:2px 4px;">${dm}</td>
      <td style="border:1px solid #000;text-align:center;font-weight:700;font-family:monospace;padding:2px 4px;">${pr}</td>
    </tr>`;

  const totalRow = (label, dm, pr) => `
    <tr style="background:#f0f0f0;">
      <td style="border:1px solid #000;"></td>
      <td style="border:1px solid #000;text-align:right;font-weight:700;padding:2px 8px;">${label}</td>
      <td style="border:1px solid #000;text-align:center;font-weight:800;font-family:monospace;padding:2px 4px;">${dm}</td>
      <td style="border:1px solid #000;text-align:center;font-weight:800;font-family:monospace;padding:2px 4px;">${pr}</td>
    </tr>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:10.5px;background:white;color:#000;}
  .page{width:210mm;min-height:297mm;padding:14mm 15mm 18mm 18mm;}
  table{width:100%;border-collapse:collapse;font-size:10.5px;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body><div class="page">

  <div style="text-align:center;margin-bottom:10px;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;">Office of the District General Hospital, ${(profile.district||"").toUpperCase()}</div>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;">National Program for Control of Blindness</div>
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;">Review of Ophthalmic Officer</div>
  </div>

  <div style="display:flex;justify-content:space-between;margin:8px 0 6px;font-size:11px;">
    <span><b>NAME OF OPHTHALMIC OFFICER- ${(profile.name||"").toUpperCase()}</b></span>
    <span>MONTH- <b style="font-size:13px;font-style:italic;">${getMonthName(month)} ${year}</b></span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="border:1px solid #000;background:#eee;width:28px;"></th>
        <th style="border:1px solid #000;background:#eee;text-align:left;padding:3px 6px;"></th>
        <th style="border:1px solid #000;background:#eee;text-align:center;padding:3px 6px;min-width:85px;">During the month</th>
        <th style="border:1px solid #000;background:#eee;text-align:center;padding:3px 6px;min-width:85px;">Progressive</th>
      </tr>
    </thead>
    <tbody>
      ${secRow("A","TOUR DONE")}
      ${dataRow("1) O.P.D at Head Quarter",D("opd_hq"),P("opd_hq"))}
      ${dataRow("2) O.P.D at P.H.C",D("opd_phc"),P("opd_phc"))}
      ${dataRow("3) Total tour days",D("total_tour_days"),P("total_tour_days"))}
      ${dataRow("4) Dressing done",D("dressing_done"),P("dressing_done"))}
      ${dataRow("5) Diagnostic Camp",D("diagnostic_camp"),P("diagnostic_camp"))}

      ${secRow("B","O.P.D")}
      ${dataRow("1) Total patient seen",D("total_patient_seen"),P("total_patient_seen"))}
      ${dataRow("2) Suspect Glaucoma",D("suspect_glaucoma"),P("suspect_glaucoma"))}
      ${dataRow("3) Cataract cases detected",D("cataract_detected"),P("cataract_detected"))}
      ${dataRow("4) Vit A deficiency detected",D("vit_a_deficiency"),P("vit_a_deficiency"))}
      ${dataRow("5) Refractive error corrected",D("refractive_error_corrected"),P("refractive_error_corrected"))}
      ${dataRow("6) 45+ detected",D("detected_45plus"),P("detected_45plus"))}
      ${dataRow("Male",D("male"),P("male"),true)}
      ${dataRow("Female",D("female"),P("female"),true)}
      ${dataRow("7) Post Op follow up",D("post_op_followup"),P("post_op_followup"))}
      ${dataRow("8) Post Op refraction",D("post_op_refraction"),P("post_op_refraction"))}
      ${dataRow("9) Foreign Body",D("foreign_body"),P("foreign_body"))}
      ${dataRow("10) Other clinical process",D("other_clinical"),P("other_clinical"))}

      ${secRow("C","Cataract Survey")}
      ${dataRow("1) Total villages attend",D("villages_attended"),P("villages_attended"))}
      ${dataRow("2) Total Cataract",D("total_cataract"),P("total_cataract"))}
      ${dataRow("3) Complications",D("complications"),P("complications"))}

      ${secRow("D","School survey")}
      ${dataRow("1) Total school visited",D("school_visited"),P("school_visited"))}
      ${dataRow("2) Total students on Roll",D("students_on_roll"),P("students_on_roll"))}
      ${dataRow("3) Total students examined",D("students_examined"),P("students_examined"))}
      ${dataRow("4) Refractive error detected",D("refractive_error_detected"),P("refractive_error_detected"))}
      ${dataRow("5) Vitamin A deficiency detected",D("vit_a_school"),P("vit_a_school"))}
      ${dataRow("6) Students with squint",D("students_squint"),P("students_squint"))}
      ${dataRow("7) Corneal Opacity",D("corneal_opacity"),P("corneal_opacity"))}

      ${secRow("E","Eye camp (Target &nbsp;&nbsp;&nbsp;&nbsp; )")}
      ${dataRow("1) Camp organised",D("camp_organised"),P("camp_organised"))}
      ${dataRow("2) Operation done R.H SDH &ndash; IOL",D("op_rh_sdh_iol"),P("op_rh_sdh_iol"))}
      ${dataRow(`3) Operation done D.H ${profile.district}&ndash;IOL`,D("op_dh_iol"),P("op_dh_iol"))}
      ${dataRow("4) Operation done elsewhere in block &ndash;IOL",D("op_elsewhere_iol"),P("op_elsewhere_iol"))}
      ${totalRow("TOTAL(2+3+4)",pad(totalDM),pad(totalPR))}

      ${secRow("F","Spectacle distribution")}
      ${dataRow("1) Spectacle to student",D("spectacle_students"),P("spectacle_students"))}
      ${dataRow("2) Spectacle to 45+",D("spectacle_45plus"),P("spectacle_45plus"))}
      ${dataRow("3) Spectacle to Operated cases",D("spectacle_operated"),P("spectacle_operated"))}
    </tbody>
  </table>

  <div style="margin-top:30px;display:flex;justify-content:space-between;">
    <div style="font-size:11px;line-height:1.8;">
      <div>MEDICAL OFFICER</div>
      <div>${(profile.phc||"").toUpperCase()}</div>
      <div>DIST- ${(profile.district||"").toUpperCase()}</div>
    </div>
    <div style="font-size:11px;text-align:center;line-height:1.8;">
      <div style="height:50px;"></div>
      <div>OPHTHALMIC OFFICER</div>
      <div>${(profile.phc||"").toUpperCase()}</div>
      <div>DIST- ${(profile.district||"").toUpperCase()}</div>
    </div>
  </div>
</div></body></html>`;
}

// ============================================================
// ============================================================
// PDF 2 — MONITORING OF ACTIVITIES OF OPHTHALMIC OFFICERS
// Landscape A4, horizontal table
// Matches provided image exactly
// ============================================================
function generateMonitoringHTML(profile, month, year, data, prog) {
  const totalDM = (parseInt(data.op_rh_sdh_iol)||0)+(parseInt(data.op_dh_iol)||0)+(parseInt(data.op_elsewhere_iol)||0);
  const totalPR = (parseInt(prog.op_rh_sdh_iol)||0)+(parseInt(prog.op_dh_iol)||0)+(parseInt(prog.op_elsewhere_iol)||0);

  const H = (txt, rs=1, cs=1) => `<th style="border:1px solid #000;font-size:8px;text-align:center;padding:2px;vertical-align:middle;font-weight:700;" ${rs>1?`rowspan="${rs}"`:""} ${cs>1?`colspan="${cs}"`:""}>${txt}</th>`;
  const HV = (txt, rs=1, cs=1) => `<th style="border:1px solid #000;font-size:8px;text-align:center;padding:2px;vertical-align:middle;font-weight:700;height:90px;" ${rs>1?`rowspan="${rs}"`:""} ${cs>1?`colspan="${cs}"`:""}><div style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;margin:0 auto;padding:2px;">${txt}</div></th>`;

  const dataCell = (val, bg="") => `<td style="border:1px solid #000;text-align:center;padding:4px 2px;font-size:10px;font-weight:600;${bg?`background:${bg}`:""}">${pad(val)}</td>`;
  const staticCell = (val) => `<td style="border:1px solid #000;text-align:center;padding:4px 2px;font-size:10px;font-weight:600;">${val}</td>`;

  const officerCells = (d, totalOps) =>
    [d.total_patient_seen, d.refractive_error_corrected,
     d.cataract_detected, totalOps, "", // Patient still on waiting list (blank)
     d.students_examined, d.refractive_error_detected, d.spectacle_students, 0,
     0, d.suspect_glaucoma, d.students_squint, 0
    ].map(v => dataCell(v)).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:9px;background:white;color:#000;}
  .page{width:297mm;min-height:210mm;padding:12mm 8mm;}
  table{width:100%;border-collapse:collapse;table-layout:fixed;}
  th, td { overflow: hidden; word-wrap: break-word; }
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{size:A4 landscape;margin:0;}}
</style></head><body><div class="page">

  <div style="text-align:center;margin-bottom:15px;">
    <div style="font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:18px;">MONITORING OF ACTIVITIES OF OPHTHALMIC OFFICERS</div>
    <div style="display:flex;justify-content:space-between;padding:0 5px;font-size:13px;font-weight:700;">
      <span>Name of district- ${profile.district}</span>
      <span>MONTH- ${getMonthName(month).toUpperCase()} ${year}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="border:1px solid #000;width:30px;font-size:8px;font-weight:700;" rowspan="2">Sr.no</th>
        <th style="border:1px solid #000;width:120px;font-size:8px;font-weight:700;" rowspan="2">Name of Ophthalmic Officer</th>
        <th style="border:1px solid #000;width:90px;font-size:8px;font-weight:700;" rowspan="2">Head Quarter/<br>Working Station</th>
        <th style="border:1px solid #000;width:70px;font-size:8px;font-weight:700;" rowspan="2">OO trained in<br>Enucleation YES/No</th>
        <th style="border:1px solid #000;width:90px;font-size:8px;font-weight:700;" rowspan="2">Place of Posting</th>
        ${HV("Population covered",2)}
        ${HV("Survey status Yes/NO",2)}
        ${H("OPD",1,2)}
        ${H("CATARACT",1,3)}
        ${H("SCHOOL EYE SCREENING",1,4)}
        ${H("Other eye diseases",1,4)}
      </tr>
      <tr>
        ${H("No. of patient<br>examined in the<br>month")}
        ${H("Refractive error")}
        ${H("Patient found<br>with cataract")}
        ${H("Patient under<br>went cataract<br>surgery")}
        ${H("Patient still on<br>waiting list")}
        ${H("student examined")}
        ${H("student with RE")}
        ${H("Free spects<br>provided")}
        ${H("Operations done")}
        ${H("Diabetic retino<br>pathy")}
        ${H("Glaucoma")}
        ${H("Squint")}
        ${H("ROP")}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #000;text-align:center;padding:4px 2px;font-size:10px;font-weight:600;">1</td>
        <td style="border:1px solid #000;padding:4px 6px;font-weight:700;font-size:10px;text-align:left;">${(profile.name||"").toUpperCase()}</td>
        <td style="border:1px solid #000;padding:4px 6px;font-size:9px;text-align:left;">${(profile.phc||"").toUpperCase()}</td>
        ${staticCell("")} <!-- OO trained in Enucleation (blank) -->
        <td style="border:1px solid #000;padding:4px 6px;font-size:9px;text-align:left;">${(profile.phc||"").toUpperCase()}</td>
        ${staticCell("")} <!-- Population covered (blank) -->
        ${staticCell("Yes")} <!-- Survey status -->
        ${officerCells(data, totalDM)}
      </tr>
      ${[2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n=>`
      <tr style="height:28px;">
        <td style="border:1px solid #000;text-align:center;font-size:10px;font-weight:600;">${n}</td>
        ${Array(19).fill('<td style="border:1px solid #000;"></td>').join("")}
      </tr>`).join("")}
    </tbody>
  </table>

  <div style="margin-top:50px;display:flex;justify-content:space-around;padding:0 40px;">
    <div style="text-align:center;font-size:12px;font-weight:700;">
      <div style="margin-bottom:30px;">MEDICAL OFFICER</div>
      <div>DIST- ${(profile.district||"").toUpperCase()}</div>
    </div>
    <div style="text-align:center;font-size:12px;font-weight:700;">
      <div style="margin-bottom:30px;">OPHTHALMIC OFFICER</div>
      <div>DIST- ${(profile.district||"").toUpperCase()}</div>
    </div>
  </div>
</div></body></html>`;
}

function openPDF(html) {
  const win = window.open("","_blank");
  win.document.write(html); win.document.close();
  setTimeout(()=>{ win.focus(); win.print(); }, 600);
}

// ============================================================
// SMALL COMPONENTS
// ============================================================
function Spinner() {
  return (
    <div style={{display:"flex",justifyContent:"center",padding:40}}>
      <div style={{width:36,height:36,border:"4px solid #e2e8f0",borderTop:"4px solid #1a56db",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Alert({type,msg}){
  if(!msg)return null;
  const colors={error:{bg:"#fef2f2",border:"#fca5a5",text:"#dc2626"},success:{bg:"#f0fdf4",border:"#86efac",text:"#16a34a"},info:{bg:"#eff6ff",border:"#93c5fd",text:"#1d4ed8"}};
  const c=colors[type]||colors.info;
  return <div style={{background:c.bg,border:`1px solid ${c.border}`,color:c.text,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:12}}>{msg}</div>;
}
function FInput({label,value,onChange,type="text",placeholder,readOnly=false}){
  return(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",background:readOnly?"#f8fafc":"white",color:readOnly?"#94a3b8":"#0f172a"}}
        onFocus={e=>!readOnly&&(e.target.style.borderColor="#1a56db")}
        onBlur={e=>e.target.style.borderColor="#e2e8f0"}
      />
    </div>
  );
}

// ============================================================
// AUTH
// ============================================================
function AuthPage({ onAuth }){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState(null);

  async function submit(e){
    e.preventDefault();setLoading(true);setMsg(null);
    try{
      if(mode==="login"){
        const{data, error}=await supabase.auth.signInWithPassword({email,password});
        if(error)throw error;
        onAuth(data.user);
      }else{
        const{data,error}=await supabase.auth.signUp({email,password});
        if(error)throw error;
        if(data.user){
          await supabase.from("users").insert({id:data.user.id,email:data.user.email,profile_completed:false,payment_status:"pending"});
          setMsg({type:"success",text:"Account created! Please check your email for a verification link, then log in."});setMode("login");
        }
      }
    }catch(err){setMsg({type:"error",text:err.message});}
    setLoading(false);
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",width:400,boxShadow:"0 25px 60px rgba(0,0,0,.4)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#1a56db,#0891b2)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28}}>👁️</div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#0f172a",marginBottom:4}}>Ophthalmic Officer Portal</h1>
          <p style={{fontSize:13,color:"#64748b"}}>National Program for Control of Blindness</p>
        </div>
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:10,padding:4,marginBottom:24}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,background:mode===m?"white":"transparent",color:mode===m?"#1a56db":"#64748b",boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.1)":"none",transition:"all .2s"}}>{m==="login"?"Sign In":"Register"}</button>
          ))}
        </div>
        <Alert type={msg?.type} msg={msg?.text}/>
        <form onSubmit={submit}>
          <FInput label="Email Address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="officer@example.com"/>
          <FInput label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters"/>
          <button type="submit" disabled={loading} style={{width:"100%",padding:12,background:"linear-gradient(135deg,#1a56db,#0891b2)",color:"white",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:8,opacity:loading?.7:1}}>
            {loading?"Please wait...":mode==="login"?"Sign In":"Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE SETUP
// ============================================================
function ProfileSetupPage({user,onComplete}){
  const [form,setForm]=useState({name:"",phc:"",district:""});
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState(null);

  async function save(e){
    e.preventDefault();
    if(!form.name.trim()||!form.phc.trim()||!form.district.trim()){setMsg({type:"error",text:"All fields are required."});return;}
    setLoading(true);
    const{error}=await supabase.from("users").update({name:form.name.trim(),phc:form.phc.trim(),district:form.district.trim(),profile_completed:true}).eq("id",user.id);
    setLoading(false);
    if(error){setMsg({type:"error",text:error.message});return;}
    onComplete({...form,profile_completed:true});
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",width:440,boxShadow:"0 25px 60px rgba(0,0,0,.4)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:10}}>📋</div>
          <h2 style={{fontSize:20,fontWeight:700,color:"#0f172a"}}>Complete Your Profile</h2>
          <p style={{fontSize:13,color:"#64748b",marginTop:6}}>These details appear on all official reports.<br/><strong>Cannot be changed after saving.</strong></p>
        </div>
        <Alert type={msg?.type} msg={msg?.text}/>
        <form onSubmit={save}>
          <FInput label="Full Name (as on official records)" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Miss Anjali Bharat Joshi"/>
          <FInput label="PHC Name" value={form.phc} onChange={e=>setForm(p=>({...p,phc:e.target.value}))} placeholder="e.g. PHC Nawargaon"/>
          <FInput label="District" value={form.district} onChange={e=>setForm(p=>({...p,district:e.target.value}))} placeholder="e.g. Chandrapur"/>
          <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:12,color:"#92400e"}}>
            ⚠️ Double-check spellings — permanently locked after saving.
          </div>
          <button type="submit" disabled={loading} style={{width:"100%",padding:12,background:"linear-gradient(135deg,#1a56db,#0891b2)",color:"white",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?.7:1}}>
            {loading?"Saving...":"Save Profile & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// PAYMENT
// ============================================================
function PaymentPage({user,profile,onSuccess}){
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState(null);

  function loadRZ(cb){if(window.Razorpay){cb();return;}const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=cb;document.body.appendChild(s);}

  async function pay(){
    if (!BACKEND_URL || !RAZORPAY_KEY_ID) {
      const missing = !BACKEND_URL ? "VITE_BACKEND_URL" : "VITE_RAZORPAY_KEY_ID";
      setMsg({ type: "error", text: `Configuration error: ${missing} is not set in Vercel environment variables.` });
      return;
    }
    setLoading(true);setMsg(null);
    try{
      const cleanBackendUrl = BACKEND_URL.replace(/\/$/, "");
      const res=await fetch(`${cleanBackendUrl}/api/payment/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id,email:user.email,amount:PAYMENT_AMOUNT})});
      if (!res.ok) {
        const errorText = await res.text();
        let errorJson;
        try { errorJson = JSON.parse(errorText); } catch (e) { /* not json */ }
        throw new Error(errorJson?.error || `Server error: ${res.status} ${res.statusText}`);
      }
      const order=await res.json();
      if(!order.id)throw new Error("Could not create payment order. Please check your backend logs.");
      loadRZ(()=>{
        new window.Razorpay({
          key:RAZORPAY_KEY_ID,amount:PAYMENT_AMOUNT,currency:"INR",
          name:"Ophthalmic Officer Portal",description:"One-time Access Fee",order_id:order.id,
          prefill:{email:user.email,name:profile.name},theme:{color:"#1a56db"},
          handler:async(r)=>{
            const v=await fetch(`${BACKEND_URL}/api/payment/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id,order_id:order.id,payment_id:r.razorpay_payment_id,signature:r.razorpay_signature})});
            const res2=await v.json();
            if(res2.success){await supabase.from("users").update({payment_status:"success"}).eq("id",user.id);onSuccess();}
            else setMsg({type:"error",text:"Verification failed. Contact support."});
          },
          modal:{ondismiss:()=>setLoading(false)}
        }).open();setLoading(false);
      });
    }catch(err){setMsg({type:"error",text:err.message});setLoading(false);}
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 36px",width:420,boxShadow:"0 25px 60px rgba(0,0,0,.4)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:10}}>💳</div>
          <h2 style={{fontSize:22,fontWeight:700,color:"#0f172a"}}>One-Time Access Fee</h2>
        </div>
        <div style={{background:"linear-gradient(135deg,#1a56db,#0891b2)",borderRadius:14,padding:24,marginBottom:24,textAlign:"center",color:"white"}}>
          <div style={{fontSize:42,fontWeight:800}}>₹500</div>
          <div style={{fontSize:13,opacity:.85,marginTop:4}}>One-time • Lifetime access</div>
        </div>
        {["Monthly data entry (April–March)","Review Report PDF (all months + progressive)","Monitoring Report PDF (landscape + progressive)","Secure Supabase cloud storage"].map(f=>(
          <div key={f} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,fontSize:13,color:"#374151"}}>
            <span style={{color:"#16a34a",fontSize:16}}>✓</span> {f}
          </div>
        ))}
        <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",margin:"16px 0",fontSize:12,color:"#64748b"}}><strong>Accepted:</strong> UPI, Cards, Net Banking</div>
        <Alert type={msg?.type} msg={msg?.text}/>
        <button onClick={pay} disabled={loading} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#1a56db,#0891b2)",color:"white",border:"none",borderRadius:10,fontSize:16,fontWeight:700,cursor:"pointer",opacity:loading?.7:1}}>
          {loading?"Processing...":"Pay ₹500 & Get Access"}
        </button>
        <p style={{textAlign:"center",fontSize:11,color:"#94a3b8",marginTop:12}}>🔒 Secured by Razorpay</p>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({user,profile}){
  const [allData,setAllData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("home");
  const [selectedMonth,setSelectedMonth]=useState(null);
  const [editingData,setEditingData]=useState(null);

  const now=new Date();
  const currentFY=getFinancialYear(now.getMonth()+1,now.getFullYear());
  const fyLabel=`April ${currentFY.split("-")[0]} – March 20${currentFY.split("-")[1]}`;

  useEffect(()=>{loadData();},[]);

  async function loadData(){
    setLoading(true);
    const{data}=await supabase.from("monthly_data").select("*").eq("user_id",user.id).eq("financial_year",currentFY);
    setAllData(data||[]);setLoading(false);
  }

  function openEntry(month){
    const existing=allData.find(d=>d.month===month);
    setSelectedMonth(month);setEditingData(existing?{...existing}:{...EMPTY_FORM});setPage("entry");
  }

  async function saveEntry(formData){
    const existing=allData.find(d=>d.month===selectedMonth);
    const yr=selectedMonth>=4?parseInt(currentFY.split("-")[0]):parseInt(currentFY.split("-")[0])+1;
    let error;
    if(existing){({error}=await supabase.from("monthly_data").update({...formData,updated_at:new Date().toISOString()}).eq("id",existing.id));}
    else{({error}=await supabase.from("monthly_data").insert({user_id:user.id,month:selectedMonth,year:yr,financial_year:currentFY,...formData}));}
    if(!error){await loadData();setPage("home");}
    return error;
  }

  function getYr(m){return m>=4?parseInt(currentFY.split("-")[0]):parseInt(currentFY.split("-")[0])+1;}

  function genReview(month){
    const data=allData.find(d=>d.month===month);
    if(!data){alert("Enter data for this month first.");return;}
    const prog=calcProgressive(allData,month);
    openPDF(generateReviewHTML(profile,month,getYr(month),data,prog));
  }

  function genMonitoring(month){
    const data=allData.find(d=>d.month===month);
    if(!data){alert("Enter data for this month first.");return;}
    const prog=calcProgressive(allData,month);
    openPDF(generateMonitoringHTML(profile,month,getYr(month),data,prog));
  }

  if(loading)return <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(page==="entry")return <DataEntryPage month={selectedMonth} profile={profile} existing={editingData} onSave={saveEntry} onBack={()=>setPage("home")}/>;

  return(
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',sans-serif"}}>
      {/* Nav */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",color:"white",padding:"16px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}>👁️</span>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>Ophthalmic Officer Portal</div>
            <div style={{fontSize:11,opacity:.7}}>NPCB Monthly Reporting System</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:600,fontSize:13}}>{profile.name}</div>
          <div style={{fontSize:11,opacity:.7}}>{profile.phc} • {profile.district}</div>
          <button onClick={()=>supabase.auth.signOut().then(()=>window.location.reload())} style={{marginTop:4,background:"rgba(255,255,255,.15)",border:"none",color:"white",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:980,margin:"0 auto",padding:"28px 20px"}}>
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:22,fontWeight:700,color:"#0f172a"}}>Financial Year {fyLabel}</h2>
          <p style={{color:"#64748b",fontSize:13,marginTop:4}}>
            Progressive shown on <strong>all months</strong> — April: progressive = monthly value, then adds up through March. Next April resets.
            Each month generates <strong>2 official PDFs</strong>.
          </p>
        </div>

        {/* Info bar */}
        <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"10px 16px",marginBottom:20,fontSize:12,color:"#166534",display:"flex",gap:20,flexWrap:"wrap"}}>
          <span>📋 <strong>Review Report</strong> — Portrait A4, sections A–F with During Month + Progressive</span>
          <span>📊 <strong>Monitoring Report</strong> — Landscape A4, horizontal table with all officers' data</span>
        </div>

        {/* Month Grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {MONTHS.map(m=>{
            const entry=allData.find(d=>d.month===m.num);
            const hasData=!!entry;
            return(
              <div key={m.num} style={{background:"white",borderRadius:12,padding:"18px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)",border:hasData?"2px solid #86efac":"2px solid #e2e8f0",transition:"transform .15s,box-shadow .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.06)";}}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{m.name}</div>
                    <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                      {m.num===4&&<span style={{fontSize:9,color:"#059669",fontWeight:700,background:"#dcfce7",borderRadius:4,padding:"1px 5px"}}>FY START</span>}
                      {m.num===3&&<span style={{fontSize:9,color:"#7c3aed",fontWeight:700,background:"#ede9fe",borderRadius:4,padding:"1px 5px"}}>FY END</span>}
                      <span style={{fontSize:9,color:"#1a56db",fontWeight:700,background:"#dbeafe",borderRadius:4,padding:"1px 5px"}}>↗ Progressive</span>
                    </div>
                  </div>
                  <div style={{width:10,height:10,borderRadius:"50%",marginTop:4,background:hasData?"#22c55e":"#e2e8f0"}}/>
                </div>
                <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>
                  {hasData?<>✓ Data entered{entry.total_patient_seen>0&&<span style={{color:"#059669",marginLeft:4}}>· {entry.total_patient_seen} pts</span>}</>:"No data yet"}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <button onClick={()=>openEntry(m.num)} style={{padding:"7px 0",background:hasData?"#f1f5f9":"linear-gradient(135deg,#1a56db,#0891b2)",color:hasData?"#374151":"white",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {hasData?"✏️ Edit Data":"➕ Enter Data"}
                  </button>
                  {hasData&&<>
                    <button onClick={()=>genReview(m.num)} style={{padding:"7px 0",background:"linear-gradient(135deg,#1e40af,#0369a1)",color:"white",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      📋 Review Report (A4)
                    </button>
                    <button onClick={()=>genMonitoring(m.num)} style={{padding:"7px 0",background:"linear-gradient(135deg,#059669,#0891b2)",color:"white",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      📊 Monitoring Report (Landscape)
                    </button>
                  </>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{marginTop:28,background:"white",borderRadius:14,padding:"20px 24px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:14}}>Year-to-Date Progressive Totals</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            {[
              {label:"Months Submitted",val:allData.length,color:"#1a56db"},
              {label:"Total Patients Seen",val:allData.reduce((s,d)=>s+(parseInt(d.total_patient_seen)||0),0),color:"#059669"},
              {label:"Cataract Detected",val:allData.reduce((s,d)=>s+(parseInt(d.cataract_detected)||0),0),color:"#7c3aed"},
              {label:"Total Operations",val:allData.reduce((s,d)=>s+(parseInt(d.op_rh_sdh_iol)||0)+(parseInt(d.op_dh_iol)||0)+(parseInt(d.op_elsewhere_iol)||0),0),color:"#dc2626"},
            ].map(stat=>(
              <div key={stat.label} style={{textAlign:"center",padding:14,background:"#f8fafc",borderRadius:10}}>
                <div style={{fontSize:26,fontWeight:800,color:stat.color}}>{stat.val}</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DATA ENTRY PAGE
// ============================================================
function DataEntryPage({month,profile,existing,onSave,onBack}){
  const [form,setForm]=useState({...EMPTY_FORM,...existing});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState(null);

  const totalOps=(parseInt(form.op_rh_sdh_iol)||0)+(parseInt(form.op_dh_iol)||0)+(parseInt(form.op_elsewhere_iol)||0);
  function set(k,v){setForm(p=>({...p,[k]:v.replace(/[^0-9]/g,"")}));}

  async function submit(e){
    e.preventDefault();setSaving(true);
    const err=await onSave(form);
    setSaving(false);if(err)setMsg({type:"error",text:err.message});
  }

  const sections=[
    {key:"A",label:"TOUR DONE",fields:[
      {k:"opd_hq",l:"1) O.P.D at Head Quarter"},{k:"opd_phc",l:"2) O.P.D at P.H.C"},
      {k:"total_tour_days",l:"3) Total tour days"},{k:"dressing_done",l:"4) Dressing done"},
      {k:"diagnostic_camp",l:"5) Diagnostic Camp"},
    ]},
    {key:"B",label:"O.P.D",fields:[
      {k:"total_patient_seen",l:"1) Total patient seen"},{k:"suspect_glaucoma",l:"2) Suspect Glaucoma"},
      {k:"cataract_detected",l:"3) Cataract cases detected"},{k:"vit_a_deficiency",l:"4) Vit A deficiency detected"},
      {k:"refractive_error_corrected",l:"5) Refractive error corrected"},{k:"detected_45plus",l:"6) 45+ detected"},
      {k:"male",l:"   → Male"},{k:"female",l:"   → Female"},
      {k:"post_op_followup",l:"7) Post Op follow up"},{k:"post_op_refraction",l:"8) Post Op refraction"},
      {k:"foreign_body",l:"9) Foreign Body"},{k:"other_clinical",l:"10) Other clinical process"},
    ]},
    {key:"C",label:"CATARACT SURVEY",fields:[
      {k:"villages_attended",l:"1) Total villages attend"},{k:"total_cataract",l:"2) Total Cataract"},
      {k:"complications",l:"3) Complications"},
    ]},
    {key:"D",label:"SCHOOL SURVEY",fields:[
      {k:"school_visited",l:"1) Total school visited"},{k:"students_on_roll",l:"2) Total students on Roll"},
      {k:"students_examined",l:"3) Total students examined"},{k:"refractive_error_detected",l:"4) Refractive error detected"},
      {k:"vit_a_school",l:"5) Vitamin A deficiency detected"},{k:"students_squint",l:"6) Students with squint"},
      {k:"corneal_opacity",l:"7) Corneal Opacity"},
    ]},
    {key:"E",label:"EYE CAMP",fields:[
      {k:"camp_organised",l:"1) Camp organised"},
      {k:"op_rh_sdh_iol",l:"2) Operation done R.H SDH – IOL"},
      {k:"op_dh_iol",l:`3) Operation done D.H ${profile.district} – IOL`},
      {k:"op_elsewhere_iol",l:"4) Operation done elsewhere in block – IOL"},
    ]},
    {key:"F",label:"SPECTACLE DISTRIBUTION",fields:[
      {k:"spectacle_students",l:"1) Spectacle to students"},
      {k:"spectacle_45plus",l:"2) Spectacle to 45+"},
      {k:"spectacle_operated",l:"3) Spectacle to Operated cases"},
    ]},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",color:"white",padding:"16px 28px",display:"flex",alignItems:"center",gap:16}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",color:"white",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>← Back</button>
        <div>
          <div style={{fontWeight:700,fontSize:16}}>Data Entry — {getMonthName(month)}</div>
          <div style={{fontSize:11,opacity:.7}}>{profile.phc} • {profile.district}</div>
        </div>
      </div>
      <div style={{maxWidth:700,margin:"0 auto",padding:"24px 20px"}}>
        <Alert type={msg?.type} msg={msg?.text}/>
        <div style={{background:"#dbeafe",border:"1px solid #93c5fd",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#1e40af"}}>
          ℹ️ Enter <strong>this month's</strong> values only. Progressive totals are calculated automatically from April.
          {month===4&&<strong> (April: Progressive will equal Monthly — first month of FY)</strong>}
        </div>
        <form onSubmit={submit}>
          {sections.map(sec=>(
            <div key={sec.key} style={{background:"white",borderRadius:12,marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,.06)",overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",color:"white",padding:"12px 20px",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:10}}>
                <span style={{background:"rgba(255,255,255,.2)",borderRadius:6,padding:"2px 10px"}}>{sec.key}</span>
                {sec.label}
              </div>
              <div style={{padding:"16px 20px"}}>
                {sec.fields.map(f=>(
                  <div key={f.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:12}}>
                    <label style={{fontSize:13,color:"#374151",flex:1}}>{f.l}</label>
                    <input type="text" inputMode="numeric" value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder="00"
                      style={{width:80,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:15,textAlign:"center",fontWeight:700,outline:"none",color:"#0f172a",fontFamily:"monospace"}}
                      onFocus={e=>e.target.style.borderColor="#1a56db"}
                      onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                    />
                  </div>
                ))}
                {sec.key==="E"&&(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #e2e8f0",paddingTop:10,marginTop:4}}>
                    <label style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>TOTAL (2+3+4) — Auto calculated</label>
                    <div style={{width:80,padding:"7px 10px",background:"#f1f5f9",borderRadius:7,fontSize:15,textAlign:"center",fontWeight:800,color:"#1a56db",fontFamily:"monospace"}}>{pad(totalOps)}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={saving} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#059669,#0891b2)",color:"white",border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",opacity:saving?.7:1}}>
            {saving?"Saving...":"💾 Save Data"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App(){
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [globalMsg, setGlobalMsg] = useState(null);

  useEffect(()=>{
    // Check URL for verification status
    if (window.location.hash.includes("type=signup") || window.location.hash.includes("type=recovery")) {
      setGlobalMsg({ type: "success", text: "Email verified successfully! You are now logged in." });
      // Clean the hash from the URL
      window.history.replaceState(null, null, " ");
    }

    supabase.auth.getSession().then(({data:{session}})=>{
      setSession(session);
      if(session)loadProfile(session.user.id);else setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      setSession(session);
      if (event === "SIGNED_IN") {
        if (window.location.hash.includes("type=signup")) {
          setGlobalMsg({ type: "success", text: "Welcome! Your email has been verified." });
        }
      }
      if(session)loadProfile(session.user.id);else{setProfile(null);setLoading(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(uid){
    setLoading(true);
    const{data}=await supabase.from("users").select("*").eq("id",uid).single();
    setProfile(data||null);setLoading(false);
  }

  if(loading)return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:40,marginBottom:16}}>👁️</div>
      <Spinner/>
      <div style={{color:"rgba(255,255,255,.5)",fontSize:13,marginTop:8}}>Loading portal...</div>
    </div>
  );

  if(!session)return <AuthPage onAuth={() => {}} />;
  if(!profile||!profile.profile_completed)return (
    <>
      {globalMsg && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}><Alert type={globalMsg.type} msg={globalMsg.text} /></div>}
      <ProfileSetupPage user={session.user} onComplete={p=>setProfile(prev=>({...prev,...p,profile_completed:true}))}/>
    </>
  );
  if(profile.payment_status!=="success")return (
    <>
      {globalMsg && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}><Alert type={globalMsg.type} msg={globalMsg.text} /></div>}
      <PaymentPage user={session.user} profile={profile} onSuccess={()=>setProfile(p=>({...p,payment_status:"success"}))}/>
    </>
  );
  return (
    <>
      {globalMsg && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}><Alert type={globalMsg.type} msg={globalMsg.text} /></div>}
      <Dashboard user={session.user} profile={profile}/>
    </>
  );
}
