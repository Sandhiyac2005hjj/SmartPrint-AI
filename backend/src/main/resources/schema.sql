-- ====================================================================
-- ENTERPRISE POSTGRESQL DDL FOR PRINT JOB CARD MANAGEMENT SYSTEM
-- ====================================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    alt_phone VARCHAR(50),
    email VARCHAR(255),
    gst_number VARCHAR(50),
    address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Job Cards Table
CREATE TABLE IF NOT EXISTS job_cards (
    id VARCHAR(100) PRIMARY KEY,
    job_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    job_type VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Embeddable Paper Details
    paper_size VARCHAR(100),
    paper_gsm VARCHAR(50),
    paper_type VARCHAR(100),
    
    -- Embeddable Print Details
    print_type VARCHAR(100),
    print_sides VARCHAR(50),
    print_color_mode VARCHAR(100),
    print_lamination VARCHAR(100),
    print_binding VARCHAR(100),
    print_cutting VARCHAR(100),
    print_finishing VARCHAR(100),
    special_instructions TEXT,
    
    -- Embeddable Production Details
    assigned_to VARCHAR(255),
    machine_used VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'Medium',
    
    job_date VARCHAR(50) NOT NULL,
    expected_delivery_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    
    -- Embeddable Billing Details
    bill_no VARCHAR(100),
    estimated_cost NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) DEFAULT 0.00,
    advance_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    
    remarks TEXT,
    is_draft BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Job Card Timeline Events Table
CREATE TABLE IF NOT EXISTS job_card_timeline (
    id VARCHAR(100) PRIMARY KEY,
    job_card_id VARCHAR(100) REFERENCES job_cards(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note TEXT,
    updated_by VARCHAR(255) NOT NULL
);

-- 5. Job Card Files Table
CREATE TABLE IF NOT EXISTS job_card_files (
    id VARCHAR(100) PRIMARY KEY,
    job_card_id VARCHAR(100) REFERENCES job_cards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Sai Graphics',
    owner_name VARCHAR(255) NOT NULL DEFAULT 'G. Chandru',
    logo_url TEXT,
    phone VARCHAR(50) DEFAULT '+91 98765 43210',
    email VARCHAR(255) DEFAULT 'saigraphicsch5@gmail.com',
    gst_number VARCHAR(50) DEFAULT '33AAAAA0000A1Z5',
    address TEXT DEFAULT 'No. 142, Industrial Print Zone, Chennai - 600032',
    currency VARCHAR(10) DEFAULT '₹',
    job_prefix VARCHAR(20) DEFAULT 'JC-2026-',
    terms TEXT DEFAULT '1. Please check color proof before final printing.'
);

-- 7. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    entity_id VARCHAR(100),
    entity_type VARCHAR(50)
);

-- Indexes for optimized querying
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers (name, company, phone, customer_code);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards (status);
CREATE INDEX IF NOT EXISTS idx_job_cards_job_no ON job_cards (job_no);
CREATE INDEX IF NOT EXISTS idx_timeline_job_card ON job_card_timeline (job_card_id);
CREATE INDEX IF NOT EXISTS idx_files_job_card ON job_card_files (job_card_id);
