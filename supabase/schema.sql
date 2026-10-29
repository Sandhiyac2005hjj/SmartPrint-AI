-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR PRINT JOB CARD MANAGEMENT SYSTEM (V1)
-- ====================================================================

-- 1. Create CUSTOMERS Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    alt_phone VARCHAR(50),
    email VARCHAR(255),
    gst_number VARCHAR(50),
    address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create EMPLOYEES Table (Names & Roles only)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create JOB CARDS Table
CREATE TABLE IF NOT EXISTS public.job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    job_type VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    paper_details JSONB NOT NULL DEFAULT '{"size": "A4", "gsm": "170 GSM", "paperType": "Gloss Art Paper"}'::jsonb,
    print_details JSONB NOT NULL DEFAULT '{"printType": "Digital", "sides": "Single Side", "colorMode": "CMYK", "lamination": "None", "binding": "None", "cutting": "Standard", "finishing": "None"}'::jsonb,
    production JSONB NOT NULL DEFAULT '{"assignedTo": "Arun Kumar", "priority": "Medium"}'::jsonb,
    
    job_date DATE DEFAULT CURRENT_DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    billing JSONB NOT NULL DEFAULT '{"sellingPrice": 0, "advancePaid": 0, "balanceAmount": 0, "paymentStatus": "Pending"}'::jsonb,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    remarks TEXT,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create JOB CARD FILES Table
CREATE TABLE IF NOT EXISTS public.job_card_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES public.job_cards(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create PAYMENTS Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID REFERENCES public.job_cards(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash' NOT NULL,
    reference_no VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create COMPANY SETTINGS Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Sai Graphics',
    owner_name VARCHAR(255) NOT NULL DEFAULT 'G. Chandru',
    logo_url TEXT,
    phone VARCHAR(50) DEFAULT '+91 98765 43210',
    email VARCHAR(255) DEFAULT 'saigraphicsch5@gmail.com',
    gst_number VARCHAR(50) DEFAULT '33AAAAA0000A1Z5',
    address TEXT DEFAULT 'No. 142, Industrial Print Zone, Chennai - 600032',
    currency VARCHAR(10) DEFAULT '₹',
    job_prefix VARCHAR(20) DEFAULT 'JC-2026-',
    terms TEXT DEFAULT '1. Please check color proof before final printing.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create ACTIVITY LOGS Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    entity_id VARCHAR(100),
    entity_type VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers (name, company, phone, customer_code);
CREATE INDEX IF NOT EXISTS idx_job_cards_search ON public.job_cards (job_no, customer_name, company, phone, product_name, status);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON public.job_cards (status);
CREATE INDEX IF NOT EXISTS idx_job_cards_dates ON public.job_cards (job_date, expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_files_job_card ON public.job_card_files (job_card_id);

-- STORAGE BUCKET CREATION
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-card-files', 'job-card-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_card_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow access policies
CREATE POLICY "Allow public access to customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow public access to job_cards" ON public.job_cards FOR ALL USING (true);
CREATE POLICY "Allow public access to job_card_files" ON public.job_card_files FOR ALL USING (true);
CREATE POLICY "Allow public access to company_settings" ON public.company_settings FOR ALL USING (true);
CREATE POLICY "Allow public access to activity_logs" ON public.activity_logs FOR ALL USING (true);
```,Description:
