"""
PrintPulse Analytics — Synthetic Data Generator
================================================
Generates a realistic, reproducible dataset of ~5,000 print jobs with
related customers, timeline events, and activity logs.

IMPORTANT: This dataset is ENTIRELY SYNTHETIC. All names, companies, addresses,
and business figures are fabricated for demonstration and portfolio purposes only.
Do NOT present this data as actual business performance.

Usage:
    python generate_synthetic_data.py [--records 5000] [--output-dir output]

Random seed is fixed at 42 for full reproducibility.
"""

import argparse
import csv
import json
import os
import random
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
from faker import Faker

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

fake = Faker("en_IN")
fake.seed_instance(RANDOM_SEED)

NUM_CUSTOMERS = 150
NUM_EMPLOYEES = 10
NUM_CLEAN_JOBS = 4800
NUM_DIRTY_JOBS = 200   # intentionally corrupted records for pipeline testing

START_DATE = date(2025, 1, 1)
END_DATE = date(2026, 10, 1)

OUTPUT_DIR = Path("output")

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
JOB_TYPES = [
    "Visiting Card", "Brochure", "Flex", "Offset", "Sticker",
    "Letterhead", "Envelope", "Invitation", "Catalogue", "Poster",
    "Bill Book", "Label", "Packaging Box", "Carry Bag", "Standee",
]

# Complexity score per job type (affects lead time and cost)
JOB_TYPE_COMPLEXITY = {
    "Visiting Card": 1, "Sticker": 1, "Letterhead": 1, "Envelope": 1,
    "Label": 1, "Flex": 2, "Poster": 2, "Standee": 2, "Bill Book": 2,
    "Brochure": 3, "Invitation": 3, "Carry Bag": 3,
    "Offset": 4, "Catalogue": 5, "Packaging Box": 5,
}

JOB_TYPE_WEIGHTS = [8, 10, 12, 9, 10, 7, 6, 7, 5, 8, 6, 7, 2, 2, 1]

PAPER_SIZES = ["A4", "A5", "A3", "90mm x 54mm", "12in x 18in",
               "10ft x 5ft", "Custom"]
PAPER_TYPES = ["Art Card Premium", "Gloss Art Paper", "Matt Art Paper",
               "Star Flex Banner", "Vinyl Self-Adhesive", "Kraft Paper",
               "Duplex Board", "Ivory Board", "Bond Paper", "NCR Paper"]
GSM_VALUES = ["80 GSM", "100 GSM", "130 GSM", "170 GSM", "250 GSM",
              "300 GSM", "350 GSM", "340 GSM (Flex)"]

PRINT_TYPES = ["Digital", "Offset", "Wide Format Outdoor", "Screen Print",
               "UV Print"]
COLOR_MODES = ["CMYK", "CMYK + Spot Gold", "CMYK Vivid", "Single Color",
               "Two Color", "Black & White", "Full Color"]
LAMINATES = ["None", "Gloss Thermal", "Matt Thermal", "Velvet", "Soft Touch",
             "Anti-Scratch"]
BINDINGS = ["None", "Perfect Bind", "Spiral Bind", "Saddle Stitch",
            "Staple", "Wiro Bind", "Hemming & Eyelets"]
CUTTINGS = ["Standard", "Rounded Corners", "Die Cut", "Trim to Size",
            "Kiss Cut"]
FINISHINGS = ["None", "Spot UV", "Embossing", "Foil Stamping",
              "Aqueous Coating", "Metal Eyelets every 2 feet"]
PRIORITIES = ["Low", "Medium", "High", "Urgent"]
PRIORITY_WEIGHTS = [10, 50, 30, 10]

JOB_STATUSES = [
    "Pending", "Designing", "Printing", "Finishing", "Ready",
    "Delivered", "Cancelled",
]

PAYMENT_STATUSES = ["Pending", "Partial", "Paid"]

EMPLOYEES = [
    {"id": "emp-1", "name": "Arun Kumar",    "role": "Design Lead"},
    {"id": "emp-2", "name": "Suresh V.",     "role": "Offset Operator"},
    {"id": "emp-3", "name": "Manish Sharma", "role": "Finishing Tech"},
    {"id": "emp-4", "name": "Karthik R.",    "role": "Digital Printer"},
    {"id": "emp-5", "name": "Deepak S.",     "role": "Quality Inspector"},
    {"id": "emp-6", "name": "Preethi M.",    "role": "Pre-Press Tech"},
    {"id": "emp-7", "name": "Rajan T.",      "role": "Offset Operator"},
    {"id": "emp-8", "name": "Kavitha L.",    "role": "Customer Relations"},
    {"id": "emp-9", "name": "Balaji N.",     "role": "Finishing Tech"},
    {"id": "emp-10","name": "Sivaraj P.",    "role": "Digital Printer"},
]

MACHINES = [
    "Konica Minolta AccurioPress C4080",
    "Roland Solvent 3.2m",
    "Heidelberg Speedmaster CD 74",
    "Fuji Xerox DocuColor 8002",
    "Mimaki JV300-160 Plus",
    "Ryobi 524HX Offset",
    "Manual Screen Printing Bed",
    "Epson SureColor SC-T5400",
]

CHENNAI_AREAS = [
    "Anna Salai", "T Nagar", "Velachery", "Perambur", "Royapettah",
    "Mylapore", "Adyar", "Sholinganallur", "Kilpauk", "Poes Garden",
    "Nungambakkam", "Egmore", "Tambaram", "Porur", "Chromepet",
]

COMPANY_SUFFIXES = [
    "Pvt Ltd", "Enterprises", "Solutions", "Industries", "Trading Co.",
    "& Associates", "Group", "Services", "Marketing", "Consultants",
]

# ─────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def random_datetime(start: date, end: date) -> datetime:
    d = random_date(start, end)
    h = random.randint(8, 19)
    m = random.randint(0, 59)
    return datetime(d.year, d.month, d.day, h, m, 0)


def compute_lead_days(job_type: str, quantity: int, priority: str,
                      has_lamination: bool) -> int:
    """
    Realistic lead-time model:
    complexity × base_days + quantity_factor − priority_adjustment
    """
    complexity = JOB_TYPE_COMPLEXITY.get(job_type, 2)
    base = complexity * 2
    qty_factor = max(0, int(quantity / 1000))
    lam_factor = 1 if has_lamination else 0
    priority_discount = {"Urgent": 2, "High": 1, "Medium": 0, "Low": -1}.get(
        priority, 0)
    days = max(1, base + qty_factor + lam_factor - priority_discount)
    # Add random variation
    return days + random.randint(-1, 2)


def compute_delay_probability(job_type: str, quantity: int,
                              priority: str, lead_days: int) -> float:
    """
    Delay probability model:
    higher complexity + large quantity + low lead_days → higher P(delay)
    """
    complexity = JOB_TYPE_COMPLEXITY.get(job_type, 2)
    p = 0.05
    p += complexity * 0.04
    if quantity > 5000:
        p += 0.12
    elif quantity > 1000:
        p += 0.06
    if lead_days <= 2:
        p += 0.15
    if priority == "Urgent":
        p += 0.08
    return min(p, 0.90)


def compute_cost(job_type: str, quantity: int, print_type: str,
                 has_lamination: bool, has_foil: bool) -> tuple[float, float]:
    """
    Returns (estimated_cost, selling_price) in INR.
    Margin is 25–60% above estimated cost.
    """
    complexity = JOB_TYPE_COMPLEXITY.get(job_type, 2)
    base_unit = complexity * 0.80
    qty_scale = max(1.0, 1 + quantity / 10000)

    if print_type == "Wide Format Outdoor":
        base_unit *= 5
    elif print_type == "Offset":
        base_unit *= 1.5

    if has_lamination:
        base_unit += 0.30
    if has_foil:
        base_unit += 0.80

    estimated = round(base_unit * quantity, 2)
    estimated = max(250.0, estimated)

    margin = random.uniform(0.25, 0.60)
    selling = round(estimated * (1 + margin), 2)

    # Round to nearest 50
    selling = round(selling / 50) * 50
    return estimated, selling


def choose_status_for_date(job_date: date, today: date = END_DATE) -> str:
    """
    Assign a realistic status based on how old the job is.
    """
    age_days = (today - job_date).days
    if age_days < 0:
        return "Pending"
    if age_days == 0:
        return random.choice(["Pending", "Designing"])
    if age_days <= 1:
        return random.choices(
            ["Pending", "Designing", "Printing", "Cancelled"],
            weights=[30, 40, 25, 5])[0]
    if age_days <= 5:
        return random.choices(
            ["Designing", "Printing", "Finishing", "Ready", "Cancelled"],
            weights=[15, 30, 20, 25, 10])[0]
    if age_days <= 14:
        return random.choices(
            ["Printing", "Finishing", "Ready", "Delivered", "Cancelled"],
            weights=[10, 15, 20, 50, 5])[0]
    # Older than 14 days
    return random.choices(
        ["Ready", "Delivered", "Delivered", "Cancelled"],
        weights=[5, 70, 15, 10])[0]


def build_timeline(job_id: str, job_date: date,
                   final_status: str) -> list[dict]:
    """
    Build a plausible sequence of timeline events up to final_status.
    """
    flow = ["Pending", "Designing", "Printing", "Finishing", "Ready",
            "Delivered"]
    if final_status == "Cancelled":
        cut = random.randint(0, 3)
        flow = flow[:cut + 1] + ["Cancelled"]
    else:
        try:
            cut = flow.index(final_status)
            flow = flow[:cut + 1]
        except ValueError:
            flow = ["Pending"]

    events = []
    ts = datetime(job_date.year, job_date.month, job_date.day,
                  random.randint(8, 10), random.randint(0, 59))
    emp = random.choice(EMPLOYEES)

    for status in flow:
        events.append({
            "id": f"t-{uuid.uuid4().hex[:12]}",
            "job_card_id": job_id,
            "status": status,
            "timestamp": ts.isoformat(),
            "note": _timeline_note(status),
            "updated_by": f"{emp['name']} ({emp['role']})",
        })
        ts += timedelta(hours=random.randint(2, 12))

    return events


def _timeline_note(status: str) -> str:
    notes = {
        "Pending": "Job card created and registered.",
        "Designing": "Assigned to design team for artwork preparation.",
        "Printing": "Approved for print production.",
        "Finishing": "Sent to finishing department.",
        "Ready": "Quality check passed. Ready for customer pickup.",
        "Delivered": "Delivered to customer. POD collected.",
        "Cancelled": "Order cancelled by customer request.",
    }
    return notes.get(status, "Status updated.")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATORS
# ─────────────────────────────────────────────────────────────────────────────

def generate_customers(n: int) -> list[dict]:
    customers = []
    for i in range(n):
        cid = f"syn-cust-{i+1:04d}"
        first = fake.first_name()
        last = fake.last_name()
        company_base = random.choice([first, last, fake.last_name()])
        company = f"{company_base} {random.choice(COMPANY_SUFFIXES)}"
        area = random.choice(CHENNAI_AREAS)
        pin = f"6000{random.randint(10, 99)}"
        customers.append({
            "id": cid,
            "customer_code": f"CUST-{2000 + i:04d}",
            "name": f"{first} {last}",
            "company": company,
            "phone": f"+91 {random.randint(7000000000, 9999999999)}",
            "alt_phone": (
                f"+91 {random.randint(7000000000, 9999999999)}"
                if random.random() < 0.35 else ""
            ),
            "email": (
                f"{first.lower()}.{last.lower()}@{company_base.lower().replace(' ', '')}.in"
                if random.random() < 0.80 else ""
            ),
            "gst_number": (
                f"33{fake.bothify(text='?????#####?1Z?').upper()}"
                if random.random() < 0.60 else ""
            ),
            "address": f"{random.randint(1, 200)} {area}, Chennai - {pin}",
            "notes": (
                fake.sentence(nb_words=8)
                if random.random() < 0.50 else ""
            ),
            "created_at": random_datetime(
                START_DATE, START_DATE + timedelta(days=60)
            ).isoformat(),
            "is_synthetic": True,
        })
    return customers


def generate_clean_jobs(customers: list[dict], n: int,
                        start_index: int = 1) -> tuple[list, list]:
    """Returns (job_cards, timeline_events)"""
    jobs = []
    all_events = []
    prefix = "JC-SYN-"

    for i in range(n):
        job_no = f"{prefix}{start_index + i:04d}"
        job_id = f"syn-jc-{start_index + i:05d}"
        cust = random.choice(customers)

        job_type = random.choices(JOB_TYPES, weights=JOB_TYPE_WEIGHTS)[0]
        complexity = JOB_TYPE_COMPLEXITY[job_type]

        # Quantity: realistic distribution per job type
        if job_type in ("Visiting Card", "Sticker", "Label"):
            quantity = int(np.random.choice([100, 250, 500, 1000, 2000, 5000],
                                            p=[0.15, 0.20, 0.25, 0.25, 0.10, 0.05]))
        elif job_type in ("Flex", "Standee", "Poster"):
            quantity = random.randint(1, 20)
        elif job_type in ("Catalogue", "Brochure"):
            quantity = int(np.random.choice([50, 100, 200, 500, 1000],
                                            p=[0.20, 0.30, 0.25, 0.15, 0.10]))
        else:
            quantity = random.randint(10, 2000)

        paper_size = random.choice(PAPER_SIZES)
        gsm = random.choice(GSM_VALUES)
        paper_type = random.choice(PAPER_TYPES)

        print_type = random.choice(PRINT_TYPES)
        sides = random.choice(["Single Side", "Double Side"])
        color_mode = random.choice(COLOR_MODES)
        lamination = random.choice(LAMINATES)
        binding = random.choice(BINDINGS)
        cutting = random.choice(CUTTINGS)
        finishing = random.choice(FINISHINGS)

        has_lamination = lamination != "None"
        has_foil = "Foil" in finishing

        priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
        employee = random.choice(EMPLOYEES)
        machine = random.choice(MACHINES)

        job_date = random_date(START_DATE, END_DATE - timedelta(days=7))

        lead_days = compute_lead_days(job_type, quantity, priority, has_lamination)
        promised_date = job_date + timedelta(days=lead_days)

        delay_prob = compute_delay_probability(job_type, quantity, priority, lead_days)
        will_delay = random.random() < delay_prob

        status = choose_status_for_date(job_date)

        # Completion date (only for Delivered / Ready / Finishing)
        if status == "Delivered":
            if will_delay:
                actual_days = lead_days + random.randint(1, 5)
            else:
                actual_days = max(1, lead_days - random.randint(0, 1))
            completion_date = job_date + timedelta(days=actual_days)
            is_on_time = completion_date <= promised_date
        else:
            completion_date = None
            is_on_time = None

        estimated_cost, selling_price = compute_cost(
            job_type, quantity, print_type, has_lamination, has_foil)

        # Billing
        if status in ("Delivered", "Ready"):
            if random.random() < 0.65:
                advance_paid = selling_price
                payment_status = "Paid"
            elif random.random() < 0.50:
                advance_paid = round(selling_price * random.uniform(0.30, 0.70) / 50) * 50
                payment_status = "Partial"
            else:
                advance_paid = 0.0
                payment_status = "Pending"
        elif status == "Cancelled":
            advance_paid = 0.0
            payment_status = "Pending"
        else:
            if random.random() < 0.50:
                advance_paid = round(selling_price * random.uniform(0.30, 0.60) / 50) * 50
                payment_status = "Partial"
            else:
                advance_paid = 0.0
                payment_status = "Pending"

        balance_amount = max(0.0, selling_price - advance_paid)

        # Material usage (synthetic proxy)
        sheets_used = max(1, quantity + random.randint(0, max(1, int(quantity * 0.05))))
        waste_sheets = max(0, sheets_used - quantity)
        rework_required = random.random() < 0.08
        rework_quantity = random.randint(5, 50) if rework_required else 0

        created_dt = random_datetime(
            job_date, job_date + timedelta(hours=4))
        updated_dt = created_dt + timedelta(
            hours=random.randint(1, max(1, lead_days * 8)))

        job = {
            "id": job_id,
            "job_no": job_no,
            "customer_id": cust["id"],
            "customer_name": cust["name"],
            "company": cust["company"],
            "phone": cust["phone"],
            "job_type": job_type,
            "product_name": _product_name(job_type),
            "description": fake.sentence(nb_words=12),
            "quantity": quantity,
            "paper_size": paper_size,
            "paper_gsm": gsm,
            "paper_type": paper_type,
            "print_type": print_type,
            "print_sides": sides,
            "print_color_mode": color_mode,
            "print_lamination": lamination,
            "print_binding": binding,
            "print_cutting": cutting,
            "print_finishing": finishing,
            "special_instructions": (
                fake.sentence(nb_words=6) if random.random() < 0.40 else ""
            ),
            "assigned_to": f"{employee['name']} ({employee['role']})",
            "machine_used": machine,
            "priority": priority,
            "job_date": job_date.isoformat(),
            "expected_delivery_date": promised_date.isoformat(),
            "actual_completion_date": (
                completion_date.isoformat() if completion_date else ""
            ),
            "status": status,
            "estimated_cost": estimated_cost,
            "selling_price": selling_price,
            "advance_paid": advance_paid,
            "balance_amount": balance_amount,
            "payment_status": payment_status,
            "sheets_used": sheets_used,
            "waste_sheets": waste_sheets,
            "rework_required": rework_required,
            "rework_quantity": rework_quantity,
            "is_on_time": is_on_time,
            "will_delay_flag": will_delay,
            "lead_days": lead_days,
            "complexity_score": complexity,
            "remarks": (
                fake.sentence(nb_words=5) if random.random() < 0.30 else ""
            ),
            "is_draft": False,
            "is_synthetic": True,
            "created_at": created_dt.isoformat(),
            "updated_at": updated_dt.isoformat(),
        }
        jobs.append(job)

        # Timeline events
        events = build_timeline(job_id, job_date, status)
        all_events.extend(events)

    return jobs, all_events


def _product_name(job_type: str) -> str:
    """Generate a realistic product name for a given job type."""
    adjectives = ["Premium", "Executive", "Corporate", "Custom", "Deluxe",
                  "Professional", "Branded", "Glossy", "Matt", "Eco"]
    products = {
        "Visiting Card":   ["Business Cards", "NFC Business Cards", "Name Cards"],
        "Brochure":        ["Tri-fold Brochure", "Company Profile Brochure",
                            "Product Catalogue Brochure"],
        "Flex":            ["Outdoor Banner", "Event Backdrop", "Shop Board"],
        "Offset":          ["Offset Flyers", "Bulk Offset Leaflets",
                            "Offset Letterheads"],
        "Sticker":         ["Die-Cut Stickers", "Label Stickers",
                            "Product Stickers"],
        "Letterhead":      ["Letterheads", "Official Letterheads",
                            "Branded Stationery"],
        "Envelope":        ["DL Envelopes", "A4 Envelopes", "Printed Envelopes"],
        "Invitation":      ["Wedding Invitation Cards", "Event Invitations",
                            "Formal Invitation Cards"],
        "Catalogue":       ["Product Catalogue", "Price List Catalogue",
                            "Annual Report"],
        "Poster":          ["A3 Promotional Poster", "Event Poster",
                            "Wall Poster"],
        "Bill Book":       ["Duplicate Bill Books", "NCR Bill Books",
                            "Invoice Books"],
        "Label":           ["Product Labels", "Bottle Labels", "Barcode Labels"],
        "Packaging Box":   ["Gift Boxes", "Product Packaging",
                            "Corrugated Boxes"],
        "Carry Bag":       ["Paper Carry Bags", "Non-Woven Bags",
                            "Branded Bags"],
        "Standee":         ["Roll-up Standee", "X-Banner Standee",
                            "Pop-up Display"],
    }
    adj = random.choice(adjectives)
    prod = random.choice(products.get(job_type, ["Printed Material"]))
    return f"{adj} {prod}"


# ─────────────────────────────────────────────────────────────────────────────
# DIRTY RECORDS (for pipeline validation testing)
# ─────────────────────────────────────────────────────────────────────────────

def generate_dirty_jobs(customers: list[dict], n: int,
                        start_index: int = 9001) -> list[dict]:
    """
    Generate deliberately corrupted records for testing the validation pipeline.
    Each record has a clear corruption_type label.
    """
    dirty = []
    corruption_types = [
        "missing_customer_id",
        "invalid_quantity",        # negative or zero
        "invalid_date_range",      # delivery before job date
        "missing_job_type",
        "impossible_price",        # selling < estimated
        "duplicate_job_no",
        "null_status",
        "future_created_at",       # created_at is in the future
        "blank_customer_name",
        "invalid_payment_status",
    ]

    prefix = "JC-DIRTY-"
    used_job_no = f"{prefix}9001"  # will be duplicated

    for i in range(n):
        ctype = corruption_types[i % len(corruption_types)]
        cust = random.choice(customers)
        job_date = random_date(START_DATE, END_DATE)
        job_id = f"dirty-jc-{start_index + i:05d}"

        base = {
            "id": job_id,
            "job_no": f"{prefix}{start_index + i:04d}",
            "customer_id": cust["id"],
            "customer_name": cust["name"],
            "company": cust["company"],
            "phone": cust["phone"],
            "job_type": random.choice(JOB_TYPES),
            "product_name": "Test Product",
            "quantity": 100,
            "paper_size": "A4",
            "paper_gsm": "130 GSM",
            "paper_type": "Gloss Art Paper",
            "print_type": "Digital",
            "print_sides": "Single Side",
            "print_color_mode": "CMYK",
            "print_lamination": "None",
            "print_binding": "None",
            "print_cutting": "Standard",
            "print_finishing": "None",
            "assigned_to": EMPLOYEES[0]["name"],
            "machine_used": MACHINES[0],
            "priority": "Medium",
            "job_date": job_date.isoformat(),
            "expected_delivery_date": (job_date + timedelta(days=3)).isoformat(),
            "status": "Pending",
            "estimated_cost": 500.0,
            "selling_price": 750.0,
            "advance_paid": 0.0,
            "balance_amount": 750.0,
            "payment_status": "Pending",
            "is_draft": False,
            "is_synthetic": True,
            "corruption_type": ctype,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        # Apply corruption
        if ctype == "missing_customer_id":
            base["customer_id"] = ""
        elif ctype == "invalid_quantity":
            base["quantity"] = random.choice([-50, 0, -1])
        elif ctype == "invalid_date_range":
            base["expected_delivery_date"] = (
                job_date - timedelta(days=2)
            ).isoformat()
        elif ctype == "missing_job_type":
            base["job_type"] = ""
        elif ctype == "impossible_price":
            base["selling_price"] = base["estimated_cost"] * 0.5
        elif ctype == "duplicate_job_no":
            base["job_no"] = used_job_no
        elif ctype == "null_status":
            base["status"] = None
        elif ctype == "future_created_at":
            base["created_at"] = (
                datetime.now() + timedelta(days=365)
            ).isoformat()
        elif ctype == "blank_customer_name":
            base["customer_name"] = ""
        elif ctype == "invalid_payment_status":
            base["payment_status"] = "UNKNOWN_STATUS"

        dirty.append(base)

    return dirty


# ─────────────────────────────────────────────────────────────────────────────
# ACTIVITY LOGS
# ─────────────────────────────────────────────────────────────────────────────

def generate_activity_logs(jobs: list[dict]) -> list[dict]:
    logs = []
    for job in random.sample(jobs, min(len(jobs), 500)):
        actions = [
            ("Job Card Created",
             f"Created Job #{job['job_no']} for {job['customer_name']}",
             job["id"], "JobCard"),
            ("Status Update",
             f"Job #{job['job_no']} → {job['status']}",
             job["id"], "JobCard"),
        ]
        if job["advance_paid"] > 0:
            actions.append((
                "Payment Recorded",
                f"₹{job['advance_paid']:.0f} received for Job #{job['job_no']}",
                job["id"], "JobCard",
            ))
        for action, details, eid, etype in actions:
            logs.append({
                "id": f"log-{uuid.uuid4().hex[:12]}",
                "action": action,
                "details": details,
                "timestamp": random_datetime(
                    date.fromisoformat(job["job_date"]),
                    END_DATE,
                ).isoformat(),
                "entity_id": eid,
                "entity_type": etype,
            })
    return logs


# ─────────────────────────────────────────────────────────────────────────────
# CSV WRITERS
# ─────────────────────────────────────────────────────────────────────────────

def write_csv(records: list[dict], filepath: Path) -> None:
    if not records:
        print(f"  ⚠  No records to write for {filepath.name}")
        return
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    print(f"  ✓  {filepath.name}: {len(records):,} records")


def write_json(data: object, filepath: Path) -> None:
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  ✓  {filepath.name}: written")


# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY STATISTICS
# ─────────────────────────────────────────────────────────────────────────────

def print_summary(customers, clean_jobs, dirty_jobs, events):
    statuses = {}
    for j in clean_jobs:
        statuses[j["status"]] = statuses.get(j["status"], 0) + 1

    job_types = {}
    for j in clean_jobs:
        job_types[j["job_type"]] = job_types.get(j["job_type"], 0) + 1

    total_revenue = sum(j["selling_price"] for j in clean_jobs
                        if j["status"] != "Cancelled")
    on_time = [j for j in clean_jobs
               if j["is_on_time"] is True]
    delivered = [j for j in clean_jobs if j["status"] == "Delivered"]

    print("\n" + "═" * 60)
    print("  PrintPulse Analytics — Synthetic Dataset Summary")
    print("  ⚠  ALL DATA IS SYNTHETIC — FOR DEMO PURPOSES ONLY")
    print("═" * 60)
    print(f"  Customers:          {len(customers):>8,}")
    print(f"  Clean job cards:    {len(clean_jobs):>8,}")
    print(f"  Dirty job cards:    {len(dirty_jobs):>8,}")
    print(f"  Timeline events:    {len(events):>8,}")
    print(f"\n  Status distribution:")
    for s, c in sorted(statuses.items(), key=lambda x: -x[1]):
        bar = "█" * (c // 50)
        print(f"    {s:<15} {c:>5,}  {bar}")
    print(f"\n  Top 5 job types:")
    for jt, c in sorted(job_types.items(), key=lambda x: -x[1])[:5]:
        print(f"    {jt:<20} {c:>5,}")
    print(f"\n  Total synth. revenue: ₹{total_revenue:>14,.2f}")
    if delivered:
        rate = len(on_time) / len(delivered) * 100 if delivered else 0
        print(f"  On-time delivery:   {rate:>7.1f}%  ({len(on_time)}/{len(delivered)})")
    print("═" * 60 + "\n")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic print-job data for PrintPulse Analytics"
    )
    parser.add_argument("--records", type=int, default=NUM_CLEAN_JOBS,
                        help="Number of clean job records to generate (default 4800)")
    parser.add_argument("--dirty", type=int, default=NUM_DIRTY_JOBS,
                        help="Number of dirty records for pipeline testing (default 200)")
    parser.add_argument("--customers", type=int, default=NUM_CUSTOMERS,
                        help="Number of customers to generate (default 150)")
    parser.add_argument("--output-dir", type=str, default="output",
                        help="Output directory for CSV files (default: output/)")
    args = parser.parse_args()

    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    print("\n🖨  PrintPulse Analytics — Generating Synthetic Dataset")
    print(f"   Seed: {RANDOM_SEED} | Date range: {START_DATE} → {END_DATE}")
    print(f"   Records: {args.records:,} clean + {args.dirty:,} dirty\n")

    print("▶ Generating customers...")
    customers = generate_customers(args.customers)
    write_csv(customers, out / "synthetic_customers.csv")

    print("\n▶ Generating clean job cards...")
    clean_jobs, timeline_events = generate_clean_jobs(
        customers, args.records, start_index=1)
    write_csv(clean_jobs, out / "synthetic_jobs_clean.csv")
    write_csv(timeline_events, out / "synthetic_timeline_events.csv")

    print("\n▶ Generating dirty job cards (for pipeline validation testing)...")
    dirty_jobs = generate_dirty_jobs(
        customers, args.dirty, start_index=9001)
    write_csv(dirty_jobs, out / "synthetic_jobs_dirty.csv")

    print("\n▶ Generating activity logs...")
    logs = generate_activity_logs(clean_jobs)
    write_csv(logs, out / "synthetic_activity_logs.csv")

    print("\n▶ Writing metadata manifest...")
    manifest = {
        "generated_at": datetime.now().isoformat(),
        "random_seed": RANDOM_SEED,
        "date_range": {"start": str(START_DATE), "end": str(END_DATE)},
        "record_counts": {
            "customers": len(customers),
            "clean_jobs": len(clean_jobs),
            "dirty_jobs": len(dirty_jobs),
            "timeline_events": len(timeline_events),
            "activity_logs": len(logs),
        },
        "disclaimer": (
            "ALL DATA IS SYNTHETIC. Generated with Faker + NumPy "
            "for portfolio demonstration. Does not represent actual "
            "business performance."
        ),
    }
    write_json(manifest, out / "manifest.json")

    print_summary(customers, clean_jobs, dirty_jobs, timeline_events)
    print(f"  Output directory: {out.resolve()}")
    print("  ✅ Generation complete.\n")


if __name__ == "__main__":
    main()
