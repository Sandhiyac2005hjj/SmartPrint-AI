"""
Generate professional preview screenshots for docs/screenshots/
Using Pillow with clean modern typography, gradients, and exact UI layouts.
"""
import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('docs/screenshots', exist_ok=True)

# Colors
BG_DARK = (15, 23, 42)      # Slate 900
PANEL_DARK = (30, 41, 59)   # Slate 800
ACCENT_BLUE = (59, 130, 246) # Blue 500
ACCENT_PURPLE = (147, 51, 234) # Purple 600
ACCENT_EMERALD = (16, 185, 129) # Emerald 500
ACCENT_AMBER = (245, 158, 11)  # Amber 500
ACCENT_ROSE = (244, 63, 94)   # Rose 500
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (148, 163, 184)  # Slate 400
TEXT_DARK = (30, 41, 59)
BORDER_COLOR = (51, 65, 85)   # Slate 700

def draw_window_frame(draw, title, width, height, is_dark=True):
    # Background
    bg = BG_DARK if is_dark else (248, 250, 252)
    draw.rectangle([0, 0, width, height], fill=bg)
    
    # Title bar
    bar_bg = (15, 23, 42) if is_dark else (241, 245, 249)
    draw.rectangle([0, 0, width, 44], fill=bar_bg)
    draw.line([0, 44, width, 44], fill=BORDER_COLOR if is_dark else (226, 232, 240), width=1)
    
    # Mac/Browser window dots
    draw.ellipse([16, 16, 28, 28], fill=(239, 68, 68))
    draw.ellipse([36, 16, 48, 28], fill=(234, 179, 8))
    draw.ellipse([56, 16, 68, 28], fill=(34, 197, 94))
    
    # URL / Title pill
    pill_bg = (30, 41, 59) if is_dark else (255, 255, 255)
    draw.rounded_rectangle([width//2 - 220, 10, width//2 + 220, 34], radius=6, fill=pill_bg)
    draw.text((width//2 - 190, 14), f"🔒 localhost:5173 — {title}", fill=TEXT_MUTED)

# 1. Dashboard Preview
def create_dashboard_preview():
    img = Image.new('RGB', (1280, 800), color=BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_window_frame(draw, "PrintPulse ERP — Executive Management Dashboard", 1280, 800, is_dark=False)
    
    # Sidebar
    draw.rectangle([0, 45, 220, 800], fill=(15, 23, 42))
    draw.text((24, 70), "🖨 SAI GRAPHICS", fill=TEXT_WHITE)
    draw.text((24, 90), "Print Shop OS & Analytics", fill=TEXT_MUTED)
    
    menu = ["📊 Dashboard", "📋 Job Cards", "👥 Customers", "💰 Billing & GST", "📈 PrintPulse Analytics", "⚙️ Settings"]
    for i, m in enumerate(menu):
        y = 140 + i * 44
        if i == 0:
            draw.rounded_rectangle([16, y, 204, y + 36], radius=8, fill=(30, 41, 59))
            draw.text((32, y + 10), m, fill=TEXT_WHITE)
        else:
            draw.text((32, y + 10), m, fill=TEXT_MUTED)
            
    # Main Content Area
    cx = 244
    draw.text((cx, 70), "Executive Overview & Production Metrics", fill=TEXT_DARK)
    draw.text((cx, 95), "Real-time press floor throughput, pipeline orders, and revenue health", fill=(100, 116, 139))
    
    # 4 KPI Cards
    kpis = [
        ("Total Revenue (MTD)", "₹ 8,42,500", "+18.4% vs last mo", ACCENT_EMERALD),
        ("Active Job Orders", "48 Jobs", "12 On Press • 4 Expedite", ACCENT_BLUE),
        ("Turnaround Accuracy", "87.7%", "AI Regressor within ±2d", ACCENT_PURPLE),
        ("Unpaid Balance", "₹ 1,12,000", "14 Partial Invoices", ACCENT_AMBER)
    ]
    for i, (label, val, sub, col) in enumerate(kpis):
        x = cx + i * 252
        draw.rounded_rectangle([x, 130, x + 236, 230], radius=12, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
        draw.text((x + 16, 148), label, fill=(100, 116, 139))
        draw.text((x + 16, 172), val, fill=TEXT_DARK)
        draw.rounded_rectangle([x + 16, 202, x + 210, 222], radius=4, fill=(241, 245, 249))
        draw.text((x + 22, 205), sub, fill=col)
        
    # Charts / Tables
    draw.rounded_rectangle([cx, 250, cx + 640, 520], radius=12, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((cx + 20, 270), "Weekly Order Volume & Revenue Trend", fill=TEXT_DARK)
    # Draw sample bar chart
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    heights = [120, 160, 190, 140, 220, 180, 90]
    for i, (d, h) in enumerate(zip(days, heights)):
        bx = cx + 50 + i * 80
        by = 480 - h
        draw.rounded_rectangle([bx, by, bx + 42, 480], radius=6, fill=ACCENT_BLUE)
        draw.text((bx + 8, 490), d, fill=(100, 116, 139))
        
    # Right panel: Urgent Action Board
    draw.rounded_rectangle([cx + 660, 250, cx + 1000, 520], radius=12, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((cx + 680, 270), "⚠️ Floor Priority Alerts", fill=(225, 29, 72))
    alerts = [
        ("JC-2026-4801 • Packaging Box (5k)", "AI Turnaround: 11d • Promised: 3d", "⚠️ Expedite Required"),
        ("JC-2026-4798 • Star Flex Banner 10x4", "Machine: Solvent Wide Format", "🔥 Urgent Priority"),
        ("JC-2026-4795 • Velvet Touch Cards", "Thermal Matt Lamination curing", "⏱️ Tight Schedule"),
        ("JC-2026-4780 • Tri-Fold Catalog (2k)", "Saddle stitch binding queue", "✅ On Track")
    ]
    for i, (title, sub, badge) in enumerate(alerts):
        ay = 310 + i * 50
        draw.rounded_rectangle([cx + 680, ay, cx + 980, ay + 42], radius=6, fill=(248, 250, 252))
        draw.text((cx + 690, ay + 6), title, fill=TEXT_DARK)
        draw.text((cx + 690, ay + 24), sub, fill=(100, 116, 139))
        draw.text((cx + 860, ay + 12), badge, fill=(180, 83, 9))
        
    # Bottom Table: Recent Job Cards
    draw.rounded_rectangle([cx, 540, cx + 1000, 770], radius=12, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((cx + 20, 555), "Live Press Floor Production Queue", fill=TEXT_DARK)
    
    headers = ["Job No", "Customer", "Specs", "Priority", "Delivery Date", "AI Prediction", "Status", "Amount"]
    col_x = [cx + 20, cx + 110, cx + 250, cx + 460, cx + 550, cx + 670, cx + 820, cx + 920]
    draw.rectangle([cx, 580, cx + 1000, 606], fill=(241, 245, 249))
    for h, x in zip(headers, col_x):
        draw.text((x, 588), h, fill=(71, 85, 105))
        
    rows = [
        ("JC-2026-4801", "Ramesh Kumar (Apex)", "Packaging Box • 5,000 Pcs", "Urgent 🔥", "2026-11-07", "⚡ 2026-11-09 [Expedite]", "Pending", "₹ 14,500"),
        ("JC-2026-4800", "Priya Textiles", "Visiting Card • 1,000 Pcs", "High", "2026-11-08", "⚡ 2026-11-07 [On Track]", "Printing", "₹ 1,800"),
        ("JC-2026-4799", "Zenith Pharma", "Catalog Brochure • 2,500 Pcs", "Medium", "2026-11-12", "⚡ 2026-11-10 [On Track]", "Design", "₹ 24,000"),
        ("JC-2026-4798", "City Supermarket", "Star Flex Banner 10x4ft", "Urgent 🔥", "2026-11-06", "⚡ 2026-11-06 [Tight]", "Ready", "₹ 3,400"),
    ]
    for i, r in enumerate(rows):
        ry = 615 + i * 36
        draw.line([cx, ry + 32, cx + 1000, ry + 32], fill=(241, 245, 249), width=1)
        for val, x in zip(r, col_x):
            c = (225, 29, 72) if "Expedite" in val or "Urgent" in val else TEXT_DARK
            draw.text((x, ry + 8), val, fill=c)

    img.save('docs/screenshots/01_dashboard.png')
    print("Saved 01_dashboard.png")

# 2. Job Card List with Expedite Badges
def create_jobcard_list_preview():
    img = Image.new('RGB', (1280, 800), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)
    draw_window_frame(draw, "PrintPulse — Job Cards Floor Queue & AI Turnaround Tracking", 1280, 800, is_dark=False)
    
    # Header Banner
    draw.rounded_rectangle([40, 65, 1240, 140], radius=12, fill=(15, 23, 42))
    draw.text((64, 80), "📋 Live Job Card Production Manager", fill=TEXT_WHITE)
    draw.text((64, 108), "Physical Press Specifications • AI Turnaround Regressor • Expedite Risk Alerts", fill=TEXT_MUTED)
    draw.rounded_rectangle([1060, 80, 1216, 124], radius=8, fill=ACCENT_BLUE)
    draw.text((1080, 94), "+ New Job Card", fill=TEXT_WHITE)
    
    # Table container
    draw.rounded_rectangle([40, 160, 1240, 760], radius=12, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    
    headers = ["Job No & Date", "Customer & Company", "Product & Specs", "Priority", "Delivery Date", "Status", "Total Billing", "Actions"]
    col_x = [60, 180, 370, 620, 720, 880, 1000, 1120]
    draw.rectangle([40, 160, 1240, 205], fill=(241, 245, 249))
    for h, x in zip(headers, col_x):
        draw.text((x, 178), h, fill=(71, 85, 105))
        
    rows = [
        ("JC-2026-4801\n2026-11-05", "Ramesh Kumar\nApex Technologies", "Executive Packaging Box\n5,000 Pcs • 350 GSM Art Board", "Urgent 🔥", "2026-11-07\n⚡ AI: 2026-11-09 [⚠️ Expedite]", "Pending", "₹ 18,500\nBal: ₹ 8,500"),
        ("JC-2026-4800\n2026-11-05", "Priya Sundaram\nPriya Textiles Ltd", "Velvet Visiting Cards\n1,000 Pcs • Spot UV + Matt", "High", "2026-11-09\n⚡ AI: 2026-11-08 [✅ On Track]", "Printing", "₹ 2,400\nFully Paid"),
        ("JC-2026-4799\n2026-11-04", "Dr. K. Swaminathan\nCare Hospital", "Tri-Fold Medical Brochure\n2,500 Pcs • 170 GSM Gloss", "Medium", "2026-11-12\n⚡ AI: 2026-11-10 [✅ On Track]", "Design", "₹ 14,000\nBal: ₹ 5,000"),
        ("JC-2026-4798\n2026-11-04", "Karthik Raja\nGreen Organic Foods", "Product Decal Stickers\n10,000 Pcs • Die Cut Vinyl", "Urgent 🔥", "2026-11-06\n⚡ AI: 2026-11-08 [⚠️ Expedite]", "Plate Making", "₹ 11,200\nFully Paid"),
        ("JC-2026-4797\n2026-11-03", "Anand Builders\nMetro Developers", "Site Flex Banner 20x10ft\nStar Flex 340 GSM Outdoor", "Medium", "2026-11-07\n⚡ AI: 2026-11-06 [✅ On Track]", "Post Press", "₹ 6,800\nBal: ₹ 2,000"),
        ("JC-2026-4796\n2026-11-03", "St. Joseph School\nEducation Trust", "Annual Day Magazine\n500 Books • Perfect Binding", "High", "2026-11-14\n⚡ AI: 2026-11-12 [✅ On Track]", "Ready", "₹ 48,000\nFully Paid"),
    ]
    for i, r in enumerate(rows):
        ry = 215 + i * 85
        draw.line([40, ry + 75, 1240, ry + 75], fill=(241, 245, 249), width=1)
        for col_idx, (val, x) in enumerate(zip(r, col_x)):
            lines = val.split('\n')
            for line_idx, line in enumerate(lines):
                c = TEXT_DARK
                if "Expedite" in line:
                    c = (225, 29, 72)
                elif "On Track" in line:
                    c = (16, 185, 129)
                elif "Urgent" in line:
                    c = (234, 88, 12)
                elif line_idx > 0 and "AI" not in line and "Bal" not in line:
                    c = (100, 116, 139)
                draw.text((x, ry + 12 + line_idx * 18), line, fill=c)
        # Action pills
        draw.rounded_rectangle([1120, ry + 16, 1176, ry + 42], radius=4, fill=(236, 253, 245), outline=(167, 243, 208))
        draw.text((1128, ry + 22), "Invoice", fill=(5, 150, 105))
        draw.rounded_rectangle([1186, ry + 16, 1226, ry + 42], radius=4, fill=(241, 245, 249))
        draw.text((1196, ry + 22), "View", fill=(30, 41, 59))

    img.save('docs/screenshots/02_jobcards_expedite.png')
    print("Saved 02_jobcards_expedite.png")

# 3. AI Turnaround Predictor & Job Card Modal
def create_jobcard_form_ai_preview():
    img = Image.new('RGB', (1280, 800), color=(15, 23, 42, 180))
    draw = ImageDraw.Draw(img)
    draw_window_frame(draw, "Create New Job Card — AI Turnaround Feasibility Analysis", 1280, 800, is_dark=True)
    
    # Modal Window
    draw.rounded_rectangle([180, 60, 1100, 760], radius=16, fill=(255, 255, 255))
    
    # Modal Header
    draw.rounded_rectangle([180, 60, 1100, 115], radius=16, fill=(15, 23, 42))
    draw.rectangle([180, 95, 1100, 115], fill=(15, 23, 42))
    draw.text((210, 75), "⚡ Create New Print Job Card — Press Production Order", fill=TEXT_WHITE)
    draw.text((210, 95), "Physical Specifications • Operator Allocation • AI Turnaround Forecasting", fill=TEXT_MUTED)
    draw.text((1060, 80), "✕", fill=TEXT_WHITE)
    
    # Customer Bar
    draw.rounded_rectangle([210, 130, 1070, 195], radius=8, fill=(248, 250, 252), outline=(226, 232, 240))
    draw.text((225, 142), "1. Customer Selection", fill=(71, 85, 105))
    draw.text((225, 165), "Selected: Ramesh Kumar — Apex Technologies (Phone: 9876543210)", fill=TEXT_DARK)
    
    # Specs Section
    draw.text((225, 215), "2. Technical Printing Specifications", fill=TEXT_DARK)
    specs = [
        ("Job Category", "Packaging Box"),
        ("Quantity", "5,000 Pcs"),
        ("Paper Size", "Super A3 (13x19)"),
        ("Paper Stock", "350 GSM Art Card"),
        ("Print Technology", "Offset 4-Color Press"),
        ("Color Profile", "CMYK + Spot Gold"),
        ("Thermal Lamination", "Matt Thermal Lamination"),
        ("Finishing Accents", "Foil Stamping + Die Cut Creasing")
    ]
    for i, (label, val) in enumerate(specs):
        x = 210 + (i % 4) * 220
        y = 240 + (i // 4) * 65
        draw.rounded_rectangle([x, y, x + 205, y + 50], radius=6, fill=(241, 245, 249))
        draw.text((x + 10, y + 8), label, fill=(100, 116, 139))
        draw.text((x + 10, y + 26), val, fill=TEXT_DARK)
        
    # Schedule & Production
    draw.text((225, 390), "3. Press Allocation & Promised Schedule", fill=TEXT_DARK)
    draw.rounded_rectangle([210, 415, 415, 470], radius=6, fill=(241, 245, 249))
    draw.text((220, 422), "Assigned Pressman", fill=(100, 116, 139))
    draw.text((220, 442), "Arun Kumar (Offset Lead)", fill=TEXT_DARK)
    
    draw.rounded_rectangle([430, 415, 635, 470], radius=6, fill=(241, 245, 249))
    draw.text((440, 422), "Machine Allocated", fill=(100, 116, 139))
    draw.text((440, 442), "Heidelberg Speedmaster 74", fill=TEXT_DARK)
    
    draw.rounded_rectangle([650, 415, 855, 470], radius=6, fill=(241, 245, 249))
    draw.text((660, 422), "Priority Level", fill=(100, 116, 139))
    draw.text((660, 442), "Urgent 🔥", fill=(234, 88, 12))
    
    draw.rounded_rectangle([870, 415, 1070, 470], radius=6, fill=(241, 245, 249))
    draw.text((880, 422), "Promised Delivery Date", fill=(100, 116, 139))
    draw.text((880, 442), "2026-11-07 (2 Days)", fill=(225, 29, 72))
    
    # ⚡ AI TURNAROUND PREDICTOR BOX (HIGHLIGHT OF THE MODAL)
    draw.rounded_rectangle([210, 495, 1070, 680], radius=12, fill=(238, 242, 255), outline=(199, 210, 254), width=2)
    draw.text((230, 510), "⚡ AI Turnaround & Completion Regressor", fill=(49, 46, 129))
    draw.rounded_rectangle([520, 508, 650, 528], radius=4, fill=(224, 231, 255))
    draw.text((530, 512), "R² 0.77 • ±1.46d MAE", fill=(67, 56, 202))
    
    # AI Expedite Alert Banner inside Predictor Box
    draw.rounded_rectangle([230, 540, 1050, 620], radius=8, fill=(254, 243, 199), outline=(252, 211, 77), width=1)
    draw.text((245, 552), "⚠️ EXPEDITE REQUIRED — PREDICTED COMPLETION EXCEEDS CUSTOMER DEADLINE!", fill=(146, 64, 14))
    draw.text((245, 574), "Physical specs require ~11 Production Days (Ready by 2026-11-16) vs promised delivery of 2026-11-07 (+9 Days Overdue).", fill=(180, 83, 9))
    draw.text((245, 594), "Action: Accelerating priority to 'Urgent 🔥' cuts base queue time by 2 days. Dedicated press run scheduled.", fill=(146, 64, 14))
    
    # Factors breakdown
    factors = ["Base Complexity: +8.0d", "Qty Scale (5k): +5.0d", "Priority Discount: -2.0d", "Lamination Cure: +1.0d", "Foil Tooling: +1.0d"]
    for i, f in enumerate(factors):
        fx = 230 + i * 165
        draw.rounded_rectangle([fx, 635, fx + 155, 665], radius=6, fill=(255, 255, 255), outline=(199, 210, 254))
        draw.text((fx + 8, 644), f, fill=(67, 56, 202))
        
    # Modal Footer Buttons
    draw.rounded_rectangle([800, 705, 920, 745], radius=8, fill=(241, 245, 249))
    draw.text((835, 720), "Cancel", fill=TEXT_DARK)
    draw.rounded_rectangle([935, 705, 1070, 745], radius=8, fill=ACCENT_BLUE)
    draw.text((955, 720), "💾 Save Job Card", fill=TEXT_WHITE)

    img.save('docs/screenshots/03_jobcard_form_ai.png')
    print("Saved 03_jobcard_form_ai.png")

# 4. PrintPulse Analytics 8-Tab OLAP Platform
def create_analytics_preview():
    img = Image.new('RGB', (1280, 800), color=BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_window_frame(draw, "PrintPulse Analytics — OLAP Data Warehouse & Machine Learning Platform", 1280, 800, is_dark=True)
    
    # Header
    draw.text((40, 65), "📈 PrintPulse Analytics Suite", fill=TEXT_WHITE)
    draw.text((40, 92), "PostgreSQL Star Schema OLAP Marts • Scikit-Learn Model Registry • RFM Customer Intelligence", fill=TEXT_MUTED)
    
    # Tabs Bar
    tabs = ["Overview", "Revenue", "Customers (RFM)", "Production", "Pipeline", "Operators", "⚡ ML Predictor", "Data Warehouse"]
    for i, t in enumerate(tabs):
        tx = 40 + i * 150
        if "ML Predictor" in t:
            draw.rounded_rectangle([tx, 125, tx + 140, 160], radius=8, fill=(124, 58, 237))
            draw.text((tx + 18, 137), t, fill=TEXT_WHITE)
        else:
            draw.rounded_rectangle([tx, 125, tx + 140, 160], radius=8, fill=(30, 41, 59))
            draw.text((tx + 22, 137), t, fill=TEXT_MUTED)
            
    # Model Performance KPIs
    draw.rounded_rectangle([40, 180, 1240, 280], radius=12, fill=(30, 41, 59), outline=BORDER_COLOR)
    draw.text((60, 195), "GRADIENT BOOSTING TURNAROUND REGRESSOR (MODEL SPECIFICATIONS)", fill=(196, 181, 253))
    
    model_stats = [
        ("Coefficient of Determination", "R² = 0.772", "High fit on physical specs"),
        ("Mean Absolute Error", "MAE = ±1.46 Days", "Accurate shop-floor time"),
        ("Median Error", "±1.26 Days", "50% within 1.2 days"),
        ("Accuracy within ±2 Days", "75.3% of Jobs", "Zero deadline leakage"),
        ("Training Dataset", "3,255 Press Orders", "Faker fixed seed=42"),
        ("Inference Speed", "< 12 ms", "Real-time microservice")
    ]
    for i, (label, val, sub) in enumerate(model_stats):
        mx = 60 + i * 195
        draw.text((mx, 220), label, fill=TEXT_MUTED)
        draw.text((mx, 238), val, fill=TEXT_WHITE)
        draw.text((mx, 258), sub, fill=(52, 211, 153))
        
    # Left: Interactive Simulation Form
    draw.rounded_rectangle([40, 300, 620, 760], radius=12, fill=(30, 41, 59), outline=BORDER_COLOR)
    draw.text((60, 320), "Interactive Job Turnaround Simulator", fill=TEXT_WHITE)
    draw.text((60, 342), "Simulate print specifications to test model output and expedite detection", fill=TEXT_MUTED)
    
    sim_fields = [
        ("Job Category", "Visiting Card"),
        ("Quantity (Pcs)", "500"),
        ("Priority", "Medium"),
        ("Print Technology", "Digital"),
        ("Thermal Lamination", "Gloss Thermal"),
        ("Finishing Accents", "None"),
        ("Order Job Date", "2026-11-05"),
        ("Promised Delivery Date", "2026-11-07")
    ]
    for i, (k, v) in enumerate(sim_fields):
        fx = 60 + (i % 2) * 270
        fy = 375 + (i // 2) * 65
        draw.rounded_rectangle([fx, fy, fx + 250, fy + 50], radius=6, fill=(15, 23, 42), outline=BORDER_COLOR)
        draw.text((fx + 10, fy + 6), k, fill=TEXT_MUTED)
        draw.text((fx + 10, fy + 26), v, fill=TEXT_WHITE)
        
    draw.rounded_rectangle([60, 660, 600, 710], radius=8, fill=(124, 58, 237))
    draw.text((200, 678), "⚡ Run Model Turnaround Prediction", fill=TEXT_WHITE)
    
    # Right: Prediction Output & Feature Importances
    draw.rounded_rectangle([640, 300, 1240, 760], radius=12, fill=(30, 41, 59), outline=BORDER_COLOR)
    draw.text((660, 320), "Prediction Output & Production Feasibility", fill=TEXT_WHITE)
    
    # Ready Days Display
    draw.rounded_rectangle([660, 360, 930, 460], radius=10, fill=(15, 23, 42), outline=BORDER_COLOR)
    draw.text((680, 375), "ESTIMATED TURNAROUND", fill=TEXT_MUTED)
    draw.text((680, 400), "4 Days", fill=(196, 181, 253))
    draw.text((680, 435), "Physical press run time", fill=TEXT_MUTED)
    
    draw.rounded_rectangle([950, 360, 1220, 460], radius=10, fill=(15, 23, 42), outline=BORDER_COLOR)
    draw.text((970, 375), "PREDICTED COMPLETION", fill=TEXT_MUTED)
    draw.text((970, 400), "2026-11-09", fill=TEXT_WHITE)
    draw.text((970, 435), "Target: 2026-11-07 (Late)", fill=(248, 113, 113))
    
    # Overdue alert
    draw.rounded_rectangle([660, 480, 1220, 545], radius=8, fill=(69, 10, 10), outline=(153, 27, 27))
    draw.text((680, 495), "⚠️ EXPEDITE REQUIRED — 2 DAYS OVERDUE", fill=(254, 202, 202))
    draw.text((680, 518), "AI Completion (Nov 9) is past customer deadline (Nov 7). Mark priority as Urgent 🔥 to complete in 2 days.", fill=(252, 165, 165))
    
    # Feature Importance Bars
    draw.text((660, 570), "Top Feature Weights (Scikit-Learn Gradient Boosting):", fill=TEXT_WHITE)
    feats = [
        ("Job Type Complexity", 0.420),
        ("Base Production Days", 0.320),
        ("Quantity Scale (qty_log)", 0.070),
        ("Priority Discount", 0.064),
        ("Thermal Lamination Flag", 0.022),
        ("Print Technology Code", 0.019)
    ]
    for i, (fname, weight) in enumerate(feats):
        by = 600 + i * 24
        draw.text((660, by), fname, fill=TEXT_MUTED)
        draw.rounded_rectangle([840, by + 4, 1150, by + 12], radius=3, fill=(15, 23, 42))
        draw.rounded_rectangle([840, by + 4, 840 + int(weight * 700), by + 12], radius=3, fill=(124, 58, 237))
        draw.text((1170, by), f"{weight*100:.1f}%", fill=(196, 181, 253))

    img.save('docs/screenshots/06_printpulse_analytics.png')
    print("Saved 06_printpulse_analytics.png")

# 5. GST Commercial Invoice Preview
def create_invoice_preview():
    img = Image.new('RGB', (1280, 800), color=(241, 245, 249))
    draw = ImageDraw.Draw(img)
    draw_window_frame(draw, "Tax Invoice Generator — GST Compliance & Thermal Slips", 1280, 800, is_dark=False)
    
    # White A4 sheet centered
    draw.rectangle([290, 60, 990, 770], fill=(255, 255, 255), outline=(203, 213, 225), width=1)
    
    # Company Header
    draw.text((320, 80), "SAI GRAPHICS & OFFSET PRINTERS", fill=TEXT_DARK)
    draw.text((320, 102), "142, Gandhi Road, Salem, Tamil Nadu - 636001", fill=(100, 116, 139))
    draw.text((320, 118), "GSTIN: 33AAACS1234D1Z5 | Phone: +91 94432 10987", fill=(100, 116, 139))
    
    draw.rectangle([760, 80, 960, 125], fill=(241, 245, 249), outline=(226, 232, 240))
    draw.text((775, 88), "TAX INVOICE", fill=TEXT_DARK)
    draw.text((775, 106), "INV-2026-1048", fill=(59, 130, 246))
    
    draw.line([320, 140, 960, 140], fill=(226, 232, 240), width=1)
    
    # Bill To
    draw.text((320, 155), "Bill To:", fill=(100, 116, 139))
    draw.text((320, 175), "Apex Technologies Pvt Ltd", fill=TEXT_DARK)
    draw.text((320, 193), "Kind Attn: Mr. Ramesh Kumar", fill=(71, 85, 105))
    draw.text((320, 211), "GSTIN: 33BBBPK4321A1Z9 | Ph: 98765 43210", fill=(71, 85, 105))
    
    # Invoice Details
    draw.text((740, 155), "Invoice Date: 05-Nov-2026", fill=(71, 85, 105))
    draw.text((740, 175), "Job Card Ref: JC-2026-4801", fill=(71, 85, 105))
    draw.text((740, 193), "Payment Status: PARTIAL", fill=(234, 88, 12))
    
    # Items Table
    draw.rectangle([320, 245, 960, 275], fill=(241, 245, 249))
    draw.text((330, 254), "Sl", fill=TEXT_DARK)
    draw.text((360, 254), "Description of Goods & Printing Specs", fill=TEXT_DARK)
    draw.text((680, 254), "HSN/SAC", fill=TEXT_DARK)
    draw.text((760, 254), "Qty", fill=TEXT_DARK)
    draw.text((820, 254), "Rate", fill=TEXT_DARK)
    draw.text((890, 254), "Amount (₹)", fill=TEXT_DARK)
    
    items = [
        ("1", "Custom Product Packaging Box (Super A3)\n350 GSM Art Card, Matt Thermal, Foil Stamping", "4911", "5,000", "₹ 2.90", "14,500.00"),
        ("2", "Die-Cutting & Creasing Tooling Setup", "9988", "1 Job", "₹ 1,500.00", "1,500.00")
    ]
    for i, itm in enumerate(items):
        iy = 290 + i * 50
        draw.text((330, iy), itm[0], fill=TEXT_DARK)
        draw.text((360, iy), itm[1], fill=TEXT_DARK)
        draw.text((680, iy), itm[2], fill=(100, 116, 139))
        draw.text((760, iy), itm[3], fill=TEXT_DARK)
        draw.text((820, iy), itm[4], fill=TEXT_DARK)
        draw.text((890, iy), itm[5], fill=TEXT_DARK)
        draw.line([320, iy + 42, 960, iy + 42], fill=(241, 245, 249), width=1)
        
    # Totals calculation
    draw.line([320, 480, 960, 480], fill=(203, 213, 225), width=1)
    tot_y = 500
    calc = [
        ("Sub Total (Taxable Amount):", "₹ 16,000.00"),
        ("Central GST (CGST @ 9%):", "₹ 1,440.00"),
        ("State GST (SGST @ 9%):", "₹ 1,440.00"),
        ("Total Invoice Amount:", "₹ 18,880.00"),
        ("Less: Advance Paid Online:", "₹ 10,000.00"),
        ("Balance Due (Net Payable):", "₹ 8,880.00")
    ]
    for label, val in calc:
        c = (225, 29, 72) if "Balance Due" in label else TEXT_DARK
        draw.text((640, tot_y), label, fill=c)
        draw.text((880, tot_y), val, fill=c)
        tot_y += 26
        
    # Bank info & Sign
    draw.rectangle([320, 660, 600, 740], fill=(248, 250, 252), outline=(226, 232, 240))
    draw.text((330, 668), "Bank Account Details for NEFT/RTGS:", fill=(100, 116, 139))
    draw.text((330, 686), "Bank: HDFC Bank, Salem Branch", fill=TEXT_DARK)
    draw.text((330, 702), "A/C: 50200012345678 | IFSC: HDFC0001234", fill=TEXT_DARK)
    draw.text((330, 718), "UPI ID: saigraphics@hdfcbank", fill=(59, 130, 246))
    
    draw.text((780, 690), "For SAI GRAPHICS", fill=TEXT_DARK)
    draw.text((780, 725), "Authorized Signatory", fill=(100, 116, 139))

    img.save('docs/screenshots/05_gst_tax_invoice.png')
    print("Saved 05_gst_tax_invoice.png")

if __name__ == '__main__':
    create_dashboard_preview()
    create_jobcard_list_preview()
    create_jobcard_form_ai_preview()
    create_analytics_preview()
    create_invoice_preview()
    print("All demo screenshots generated successfully!")

