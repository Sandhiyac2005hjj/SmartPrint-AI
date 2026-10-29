-- ====================================================================
-- INITIAL SEED DATA FOR PRINT JOB CARD MANAGEMENT SYSTEM
-- ====================================================================

-- 1. Seed Company Settings
INSERT INTO company_settings (id, company_name, owner_name, logo_url, phone, email, gst_number, address, currency, job_prefix, terms)
VALUES (
    1,
    'Sai Graphics',
    'G. Chandru',
    '',
    '+91 98765 43210',
    'saigraphicsch5@gmail.com',
    '33AAAAA0000A1Z5',
    'No. 142, Industrial Print Zone, Main Press Road, Chennai - 600032',
    '₹',
    'JC-2026-',
    '1. Please check color proof before final approval.\n2. 50% advance required for processing.\n3. Goods once printed will not be taken back.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed Employees
INSERT INTO employees (id, name, role, phone, created_at)
VALUES
('emp-1', 'Arun Kumar', 'Design Lead', '+91 98400 11223', NOW()),
('emp-2', 'Suresh V.', 'Offset Operator', '+91 98400 22334', NOW()),
('emp-3', 'Manish Sharma', 'Finishing Tech', '+91 98400 33445', NOW()),
('emp-4', 'Karthik R.', 'Digital Printer', '+91 98400 44556', NOW()),
('emp-5', 'Deepak S.', 'Quality Inspector', '+91 98400 55667', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Customers
INSERT INTO customers (id, customer_code, name, company, phone, alt_phone, email, gst_number, address, notes, created_at)
VALUES
('cust-1', 'CUST-1001', 'Rajesh Sharma', 'Sharma Enterprises', '+91 98401 12345', '+91 98401 54321', 'rajesh@sharmaent.com', '33AAACS1234F1Z9', '45 Anna Salai, Commercial Hub, Chennai - 600002', 'Key client for corporate brochures and letterheads.', NOW()),
('cust-2', 'CUST-1002', 'Priya Sundaram', 'Priya Fashion Boutique', '+91 97900 67890', NULL, 'priya@boutiquepriya.in', '33BGPPS5678K1Z3', '12 Cathedral Road, Poes Garden, Chennai - 600086', 'Prefers velvet lamination and gold foil accents.', NOW()),
('cust-3', 'CUST-1003', 'Vikram Mehta', 'TechVentures Pvt Ltd', '+91 99620 99887', NULL, 'vikram@techventures.co', '33AAACT9900P1Z1', '8th Floor, OMR IT Park, Sholinganallur, Chennai - 600119', 'Requires bulk visiting cards & event rollup banners.', NOW()),
('cust-4', 'CUST-1004', 'Anita Roy', 'Roy Hospitality & Catering', '+91 98840 33221', NULL, 'anita@royhospitality.com', NULL, '77 Kilpauk Garden Road, Chennai - 600010', 'Regular order for menu cards and food packaging boxes.', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Job Cards
INSERT INTO job_cards (
    id, job_no, customer_id, customer_name, company, phone,
    job_type, product_name, description, quantity,
    paper_size, paper_gsm, paper_type,
    print_type, print_sides, print_color_mode, print_lamination, print_binding, print_cutting, print_finishing, special_instructions,
    assigned_to, machine_used, priority,
    job_date, expected_delivery_date, status,
    estimated_cost, selling_price, advance_paid, balance_amount, payment_status,
    remarks, is_draft, created_at, updated_at
)
VALUES
(
    'jc-101', 'JC-2026-0001', 'cust-3', 'Vikram Mehta', 'TechVentures Pvt Ltd', '+91 99620 99887',
    'Visiting Card', 'Executive NFC Business Cards', '350 GSM Art Card with Matt Lamination, Spot UV on Logo and Rounded Corners.', 1000,
    '90mm x 54mm', '350 GSM', 'Art Card Premium',
    'Digital', 'Double Side', 'CMYK + Spot Gold', 'Matt Thermal', 'None', 'Rounded Corners', 'Spot UV', 'Ensure crisp print on dark background color.',
    'Arun Kumar (Design Lead)', 'Konica Minolta AccurioPress C4080', 'High',
    '2026-07-28', '2026-08-02', 'Designing',
    1800.00, 3200.00, 1500.00, 1700.00, 'Partial',
    'Customer requested vector proof via WhatsApp before printing.', FALSE, NOW(), NOW()
),
(
    'jc-102', 'JC-2026-0002', 'cust-2', 'Priya Sundaram', 'Priya Fashion Boutique', '+91 97900 67890',
    'Flex', 'Grand Opening Sale Backdrop Banner', '10ft x 5ft Heavy Star Flex Banner with Metal Eyelets.', 2,
    '10ft x 5ft', '340 GSM', 'Star Flex Banner',
    'Wide Format Outdoor', 'Single Side', 'CMYK Vivid', 'None', 'Hemming & Eyelets', 'Trim to Size', 'Metal Eyelets every 2 feet', 'Vibrant pink and gold color calibration required.',
    'Karthik R. (Digital Printer)', 'Roland Solvent 3.2m', 'Urgent',
    '2026-07-29', '2026-07-31', 'Printing',
    1200.00, 2500.00, 2500.00, 0.00, 'Paid',
    'Order confirmed with full advance payment.', FALSE, NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Activity Log Initial Entry
INSERT INTO activity_logs (id, action, details, timestamp, entity_id, entity_type)
VALUES ('log-1', 'System Initialized', 'Sai Graphics Spring Boot PostgreSQL Backend Active.', NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;
