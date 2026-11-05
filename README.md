# 🖨 Sai Graphics — PrintPulse OS & Analytics

> **End-to-End Smart Commercial Print Manufacturing ERP, AI-Driven Turnaround Forecasting & OLAP Business Intelligence Suite**

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.3-green?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?logo=scikit-learn)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📌 Executive Summary

**Sai Graphics PrintPulse OS** is an enterprise-grade commercial print manufacturing management system coupled with **PrintPulse Analytics**—a complete Data Engineering, Machine Learning, and OLAP decision-support platform.

Unlike typical generic CRUD or e-commerce apps, this system is deeply tailored for **commercial offset and digital print manufacturing**. It tracks full substrate and finishing specifications, coordinates press floor allocation, forecasts physical completion time using machine learning, and alerts production managers when promised customer delivery deadlines are physically infeasible.

---

## 📸 Demo Screenshots & Walkthrough

### 1. Executive Management Dashboard
*Live shop-floor operational pulse: active queue throughput, revenue metrics, expedite action alerts, and monthly order distributions.*
![Executive Dashboard](docs/screenshots/01_dashboard.png)

---

### 2. Live Job Card Floor Queue with AI Turnaround Badges
*Complete production table displaying customer deadline vs. AI physical completion date, with real-time `⚠️ Expedite` badges identifying bottleneck orders.*
![Job Card Production Queue](docs/screenshots/02_jobcards_expedite.png)

---

### 3. Smart Job Card Creation & AI Feasibility Predictor
*Full physical press specifications entry (GSM, Size, Press Type, Thermal Lamination, Foil/UV) featuring the interactive **⚡ Predict Completion Date (AI)** assistant that calculates turnaround and enables 1-click **"Mark Urgent 🔥"** schedule acceleration.*
![Job Card Form with AI Turnaround](docs/screenshots/03_jobcard_form_ai.png)

---

### 4. PrintPulse Analytics & Machine Learning Suite
*Dedicated 8-tab OLAP analytics suite featuring model regression metrics ($R^2 \approx 0.77$, $\text{MAE} \pm 1.46\text{d}$), feature importance breakdown, and interactive simulation.*
![PrintPulse Analytics Platform](docs/screenshots/06_printpulse_analytics.png)

---

### 5. Official Commercial GST Tax Invoice & Job Ticket
*Printable, GST-compliant tax invoices with HSN/SAC codes, CGST/SGST breakdown, payment balance tracking, and company branding.*
![Commercial GST Tax Invoice](docs/screenshots/05_gst_tax_invoice.png)

---

## 🌟 Unique Core Features

### 1. ⚡ AI Production Turnaround Regressor & Expedite Detection
* **Physical press time forecasting**: Uses a trained `GradientBoostingRegressor` to predict actual physical shop turnaround days based purely on technical specifications—without data leakage from promised delivery dates.
* **Proactive Deadline Validation**: Evaluates $\text{Predicted Date} = \text{Order Date} + \text{Predicted Days}$ against the customer's promised deadline.
* **Automated Expedite Flagging**: If $\text{Predicted Date} > \text{Promised Date}$, the system immediately displays:
  $$\text{⚠️ Expedite Required — Completion Date Exceeds Customer Deadline!}$$
* **1-Click Priority Acceleration**: Offers a **"Mark Urgent 🔥"** action that recalibrates queue prioritization and accelerates press scheduling.

### 2. 🏭 Deep Print Manufacturing Specifications
* **Substrate & Paper Stock**: Standard A4/A3, Super A3 (13x19), Custom large-format flex, 80–350 GSM Art Card, Velvet Board, Star Flex.
* **Printing Technology**: 4-Color Offset, High-Speed Digital Press (*Konica Minolta C4080*), Wide-Format Solvent, UV Flatbed.
* **Finishing & Post-Press**: Gloss/Matt Thermal Lamination, Spot UV, Foil Stamping, Embossing, Die-Cutting & Creasing, Perfect Binding, Saddle Stitching.

### 3. 🔄 9-Stage Visual Production Lifecycle
Tracks every job card through physical factory milestones:
$$\text{Draft} \longrightarrow \text{Pending} \longrightarrow \text{Designing} \longrightarrow \text{Plate Making} \longrightarrow \text{Printing} \longrightarrow \text{Post Press} \longrightarrow \text{Ready} \longrightarrow \text{Delivered} \longrightarrow \text{Invoiced}$$
* Includes an interactive visual timeline showing the assigned press operator, allocated machinery, and timestamped progress logs.

### 4. 📊 Dual OLTP + OLAP Data Warehouse Architecture
* **Operational OLTP**: High-concurrency relational backend powered by Spring Boot 3 + PostgreSQL.
* **Analytical OLAP**: An automated Python ETL pipeline converts operational logs into 13 dimensional star-schema views:
  1. **Executive Overview**: Total ARR/MRR, volume, average margin %, on-time delivery rates.
  2. **Revenue Analytics**: Payment collection ratios, aging receivables, category performance.
  3. **Customer Intelligence (RFM)**: Recency, Frequency, Monetary value segmentation (*Champions*, *Loyal*, *At Risk*, *Lost*).
  4. **Press & Machine Capacity**: Press bottleneck analysis and idle vs. running utilization.
  5. **Pipeline & Funnel**: Stage duration analysis and work-in-progress (WIP) tracking.
  6. **Operator Efficiency**: Jobs completed, turnaround speed, and error rates per press operator.
  7. **ML Model Registry**: Feature importances, regression metrics, and what-if parameter simulation.
  8. **Audit & Activity Stream**: Real-time operational event logs.

### 5. 🧾 GST Invoicing & Dual Output Generator
* Automatic 9% CGST + 9% SGST (or 18% IGST) calculations with advance payment and outstanding balance tracking.
* **Official GST Tax Invoice**: Clean, professional A4 PDF/printable document formatted with HSN/SAC codes, bank payment details, and terms.
* **Shop-Floor Job Ticket**: Compact thermal slip with machine instructions and finishing notes designed to travel with paper stock on the factory floor.

### 6. 🛡️ High-Availability Hybrid Resilience
* If the backend server or network disconnects, the frontend automatically falls back to indexed browser `localStorage`, allowing operators to keep creating and editing job cards without downtime. Once reconnected, data syncs cleanly.

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   Sai Graphics PrintPulse System Architecture                │
└──────────────────────────────────────────────────────────────────────────────┘

               ┌──────────────────────────────────────────────┐
               │         React 18 + TypeScript Frontend       │
               │   Tailwind CSS • Lucide Icons • SVG Charts   │
               └──────────────┬───────────────────────────────┘
                              │
             REST API Calls   │   ML Turnaround Inference
           (Port 8080 / CORS) │   (Port 5001 / JSON)
                              │
          ┌───────────────────┴────────────────────┐
          ▼                                        ▼
┌───────────────────────────────────┐    ┌──────────────────────────────────┐
│    Spring Boot 3.2.3 Backend      │    │     Flask ML Microservice        │
│    Java 21 • Hibernate / JPA      │    │     Python 3.12 • Scikit-Learn   │
│  Controllers, Services, Models   │    │  Gradient Boosting Regressor     │
└─────────────────┬─────────────────┘    └──────────────────────────────────┘
                  │
        SQL Queries / Batch Fetch
                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 15 Database (jobcard_db)                   │
│                                                                           │
│  [OLTP Tables]                        [OLAP Analytics Marts]             │
│  • job_cards (predicted_completion)   • view_daily_revenue               │
│  • customers                          • view_customer_rfm_segments       │
│  • activity_logs                      • view_machine_utilization         │
│  • company_settings                   • view_operator_performance        │
│  • employees                          • view_turnaround_analytics        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React + TypeScript | 18.3 / 5.5 | Single Page Application (SPA) |
| **Build Tool** | Vite | 8.2 | Fast HMR dev server & bundler |
| **Styling** | Tailwind CSS | 3.4 | Modern responsive UI system |
| **Backend Framework** | Spring Boot | 3.2.3 | RESTful backend microservice |
| **Language** | Java (JDK) | 21 | Strongly-typed enterprise backend |
| **ORM / Persistence** | Spring Data JPA / Hibernate | 6.4 | Entity mapping & relationship management |
| **Relational Database** | PostgreSQL | 15.x | ACID-compliant relational & OLAP storage |
| **ML Framework** | scikit-learn | 1.4.2 | Gradient Boosting Regressor model |
| **Data Engineering** | pandas, numpy, SQLAlchemy | 2.2 / 1.26 | ETL pipeline & feature engineering |
| **ML Microservice** | Python Flask + Flask-CORS | 3.0.0 | Lightweight model inference API |
| **Synthetic Generator** | Faker (en_IN locale) | 25.2.0 | Seeded synthetic domain benchmark |

---

## 🧠 Machine Learning Model Engineering

### Target Definition
$$\text{actual\_days} = \text{actual\_completion\_date} - \text{job\_date}$$

### Feature Matrix (Zero Deadline Leakage)
To avoid artificial feature leakage, promised customer delivery dates are completely excluded from model inputs. The model learns true physical press time:

| Feature Name | Type | Description |
|---|---|---|
| `complexity` | Float | Base complexity index derived from physical job type (1.0 to 4.0) |
| `base_days` | Float | Base press duration ($\text{complexity} \times 2.0$) |
| `quantity` | Float | Units printed |
| `qty_factor` | Float | Thousands scale factor ($\lfloor \text{quantity} / 1000 \rfloor$) |
| `qty_log` | Float | Logarithmic unit scale ($\log(1 + \text{quantity})$) |
| `priority_val` | Float | Priority offset (Urgent: -2d, High: -1d, Medium: 0d, Low: +1d) |
| `has_lamination` | Binary | Thermal lamination coating & drying requirement (+1d) |
| `is_double_sided` | Binary | Dual-pass press run (+0.5d) |
| `has_foil` | Binary | Special accent tooling (Foil stamping / Spot UV / Emboss) (+1d) |
| `print_type_code` | Categorical | Machine type code (Digital = 0, Offset = 1, Wide Format = 2, UV = 3) |

### Model Performance Metrics
* **Algorithm**: `GradientBoostingRegressor(n_estimators=250, max_depth=5, learning_rate=0.04)`
* **$R^2$ Score**: **0.6566 – 0.772**
* **Mean Absolute Error (MAE)**: **1.46 days**
* **Median Absolute Error**: **1.26 days**
* **Root Mean Squared Error (RMSE)**: **1.84 days**
* **Accuracy within $\pm 2$ Days**: **75.3%**

---

## 🚀 Quick Start Guide

### Prerequisites
* **Java**: JDK 21+ (`java -version`)
* **Node.js**: v18+ & npm (`node -v`)
* **Python**: v3.10+ (`python --version`)
* **PostgreSQL**: v14+ running on port `5432`

---

### 1. Database Setup
Create database in PostgreSQL:
```sql
CREATE DATABASE jobcard_db;
```

---

### 2. Spring Boot Backend Setup
```bash
cd backend
# Ensure application.properties has your PostgreSQL credentials
# spring.datasource.url=jdbc:postgresql://localhost:5432/jobcard_db
# spring.datasource.username=postgres
# spring.datasource.password=1234

# Run backend (Maven wrapper)
./mvnw spring-boot:run
```
* Backend starts at: `http://localhost:8080`

---

### 3. Python ML Microservice Setup
```bash
# From project root
cd analytics/ml
pip install -r requirements.txt

# (Optional) Train model
python train_completion_model.py

# Start ML prediction server
python predict_service.py
```
* ML Microservice starts at: `http://localhost:5001`

---

### 4. React Frontend Setup
```bash
# From project root
npm install
npm run dev
```
* Frontend starts at: `http://localhost:5173`

---

## 🗄️ Database Schema & Entities

### `job_cards` Table
```sql
CREATE TABLE job_cards (
    id VARCHAR(255) PRIMARY KEY,
    job_no VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    job_type VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    job_date VARCHAR(50) NOT NULL,
    expected_delivery_date VARCHAR(50) NOT NULL,
    predicted_completion_date VARCHAR(50),
    predicted_days INTEGER,
    status VARCHAR(50) NOT NULL,
    
    -- Embedded Paper Details
    size VARCHAR(100),
    gsm VARCHAR(100),
    paper_type VARCHAR(100),
    
    -- Embedded Print Details
    print_type VARCHAR(100),
    sides VARCHAR(50),
    color_mode VARCHAR(50),
    lamination VARCHAR(100),
    binding VARCHAR(100),
    cutting VARCHAR(100),
    finishing VARCHAR(100),
    special_instructions TEXT,
    
    -- Embedded Production Details
    assigned_to VARCHAR(255),
    machine_used VARCHAR(255),
    priority VARCHAR(50),
    
    -- Embedded Billing Details
    bill_no VARCHAR(100),
    estimated_cost NUMERIC(10,2),
    selling_price NUMERIC(10,2),
    advance_paid NUMERIC(10,2),
    balance_amount NUMERIC(10,2),
    payment_status VARCHAR(50),
    
    is_draft BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

---

## 📁 Repository Structure

```
c:\jobcard_springboot\
├── backend/                               # Spring Boot Application
│   ├── src/main/java/com/saigraphics/
│   │   ├── config/CorsConfig.java        # CORS Configuration
│   │   ├── controller/                   # REST Endpoints
│   │   │   ├── JobCardController.java
│   │   │   ├── CustomerController.java
│   │   │   ├── AnalyticsController.java
│   │   │   └── FileUploadController.java
│   │   ├── model/                        # JPA Entities
│   │   │   ├── JobCard.java              # Main Entity with predictedCompletionDate
│   │   │   ├── Customer.java
│   │   │   └── BillingDetails.java
│   │   └── service/                      # Business Logic Services
│   │       ├── JobCardService.java
│   │       └── AnalyticsService.java
│   └── src/main/resources/
│       └── application.properties        # PostgreSQL DataSource & Hibernate Config
│
├── analytics/                             # Data Engineering & Machine Learning
│   ├── ml/
│   │   ├── train_completion_model.py     # Gradient Boosting Training Script
│   │   ├── predict_service.py            # Flask REST API Microservice (Port 5001)
│   │   └── models/
│   │       ├── completion_model.pkl      # Trained Model Weights
│   │       └── completion_model_info.json# Performance Metrics ($R^2$, MAE)
│   └── pipeline/                         # Python ETL Pipeline (Extract, Validate, Load)
│
├── src/                                   # React + TypeScript Frontend
│   ├── components/
│   │   ├── jobcards/
│   │   │   ├── JobCardForm.tsx           # Form with AI Turnaround Predictor & Expedite Alert
│   │   │   ├── JobCardList.tsx           # Queue Table with AI Date & Expedite Badges
│   │   │   └── JobCardDetailModal.tsx    # Technical Specs & Production Timeline
│   │   ├── analytics/
│   │   │   ├── PrintPulseAnalytics.tsx   # 8-Tab OLAP Analytics Container
│   │   │   └── tabs/
│   │   │       └── MLPredictorTab.tsx    # ML Model Simulation & Metrics Tab
│   │   └── billing/
│   │       └── PrintableInvoice.tsx      # Commercial GST Tax Invoice Generator
│   ├── services/
│   │   ├── api.service.ts                # Spring Boot REST Client
│   │   └── ml.service.ts                 # Python Flask ML Service Client
│   └── types/index.ts                    # TypeScript Interfaces
│
└── docs/
    └── screenshots/                      # High-Resolution UI Demo Screenshots
        ├── 01_dashboard.png
        ├── 02_jobcards_expedite.png
        ├── 03_jobcard_form_ai.png
        ├── 05_gst_tax_invoice.png
        └── 06_printpulse_analytics.png
```

---

## 📄 License & Attribution

This project is developed for commercial press shop management and portfolio demonstration.  
Built with ❤️ for **Sai Graphics & Offset Printers**.
