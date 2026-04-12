-- ============================================================
-- OPHTHALMIC OFFICER MONTHLY REPORTING SYSTEM
-- Supabase SQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phc TEXT,
  district TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  payment_status TEXT DEFAULT 'pending', -- pending | success
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  payment_id TEXT,
  amount INTEGER NOT NULL DEFAULT 50000, -- in paise (₹500)
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created', -- created | success | failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MONTHLY DATA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,      -- 1-12
  year INTEGER NOT NULL,       -- e.g. 2025
  financial_year TEXT NOT NULL, -- e.g. "2025-26"

  -- A) TOUR DONE
  opd_hq INTEGER DEFAULT 0,
  opd_phc INTEGER DEFAULT 0,
  total_tour_days INTEGER DEFAULT 0,
  dressing_done INTEGER DEFAULT 0,
  diagnostic_camp INTEGER DEFAULT 0,

  -- B) OPD
  total_patient_seen INTEGER DEFAULT 0,
  suspect_glaucoma INTEGER DEFAULT 0,
  cataract_detected INTEGER DEFAULT 0,
  vit_a_deficiency INTEGER DEFAULT 0,
  refractive_error_corrected INTEGER DEFAULT 0,
  detected_45plus INTEGER DEFAULT 0,
  male INTEGER DEFAULT 0,
  female INTEGER DEFAULT 0,
  post_op_followup INTEGER DEFAULT 0,
  post_op_refraction INTEGER DEFAULT 0,
  foreign_body INTEGER DEFAULT 0,
  other_clinical INTEGER DEFAULT 0,

  -- C) CATARACT SURVEY
  villages_attended INTEGER DEFAULT 0,
  total_cataract INTEGER DEFAULT 0,
  complications INTEGER DEFAULT 0,

  -- D) SCHOOL SURVEY
  school_visited INTEGER DEFAULT 0,
  students_on_roll INTEGER DEFAULT 0,
  students_examined INTEGER DEFAULT 0,
  refractive_error_detected INTEGER DEFAULT 0,
  vit_a_school INTEGER DEFAULT 0,
  students_squint INTEGER DEFAULT 0,
  corneal_opacity INTEGER DEFAULT 0,

  -- E) EYE CAMP
  camp_organised INTEGER DEFAULT 0,
  op_rh_sdh_iol INTEGER DEFAULT 0,
  op_dh_iol INTEGER DEFAULT 0,
  op_elsewhere_iol INTEGER DEFAULT 0,
  -- total_ops is auto-calculated (2+3+4)

  -- F) SPECTACLE DISTRIBUTION
  spectacle_students INTEGER DEFAULT 0,
  spectacle_45plus INTEGER DEFAULT 0,
  spectacle_operated INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate month entry per user per financial year
  UNIQUE(user_id, month, financial_year)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Monthly data
CREATE POLICY "Users can view own monthly data" ON monthly_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly data" ON monthly_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly data" ON monthly_data
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER monthly_data_updated_at BEFORE UPDATE ON monthly_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
