import { Customer, JobCard, CompanySettings, ActivityLog, JobStatus, JobCardFile, Employee } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'jobcard_app_customers',
  JOBCARDS: 'jobcard_app_jobcards',
  SETTINGS: 'jobcard_app_settings',
  LOGS: 'jobcard_app_logs',
  DRAFT: 'jobcard_app_draft',
  AUTH: 'jobcard_app_auth',
  EMPLOYEES: 'jobcard_app_employees',
};

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Sai Graphics',
  ownerName: 'G. Chandru',
  logoUrl: '',
  phone: '+91 98765 43210',
  email: 'saigraphicsch5@gmail.com',
  gstNumber: '33AAAAA0000A1Z5',
  address: 'No. 142, Industrial Print Zone, Main Press Road, Chennai - 600032',
  currency: '₹',
  jobPrefix: 'JC-2026-',
  terms: '1. Please check color proof before final approval.\n2. 50% advance required for processing.\n3. Goods once printed will not be taken back.',
};

export const DEFAULT_INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Arun Kumar', role: 'Design Lead', phone: '+91 98400 11223', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'emp-2', name: 'Suresh V.', role: 'Offset Operator', phone: '+91 98400 22334', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'emp-3', name: 'Manish Sharma', role: 'Finishing Tech', phone: '+91 98400 33445', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'emp-4', name: 'Karthik R.', role: 'Digital Printer', phone: '+91 98400 44556', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'emp-5', name: 'Deepak S.', role: 'Quality Inspector', phone: '+91 98400 55667', createdAt: '2026-07-01T00:00:00.000Z' },
];

export const SAMPLE_EMPLOYEES = DEFAULT_INITIAL_EMPLOYEES.map(e => e.role ? `${e.name} (${e.role})` : e.name);

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    customerCode: 'CUST-1001',
    name: 'Rajesh Sharma',
    company: 'Sharma Enterprises',
    phone: '+91 98401 12345',
    altPhone: '+91 98401 54321',
    email: 'rajesh@sharmaent.com',
    gstNumber: '33AAACS1234F1Z9',
    address: '45 Anna Salai, Commercial Hub, Chennai - 600002',
    notes: 'Key client for corporate brochures and letterheads.',
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'cust-2',
    customerCode: 'CUST-1002',
    name: 'Priya Sundaram',
    company: 'Priya Fashion Boutique',
    phone: '+91 97900 67890',
    email: 'priya@boutiquepriya.in',
    gstNumber: '33BGPPS5678K1Z3',
    address: '12 Cathedral Road, Poes Garden, Chennai - 600086',
    notes: 'Prefers velvet lamination and gold foil accents.',
    createdAt: '2026-07-05T14:30:00.000Z',
  },
  {
    id: 'cust-3',
    customerCode: 'CUST-1003',
    name: 'Vikram Mehta',
    company: 'TechVentures Pvt Ltd',
    phone: '+91 99620 99887',
    email: 'vikram@techventures.co',
    gstNumber: '33AAACT9900P1Z1',
    address: '8th Floor, OMR IT Park, Sholinganallur, Chennai - 600119',
    notes: 'Requires bulk visiting cards & event rollup banners.',
    createdAt: '2026-07-12T09:15:00.000Z',
  },
  {
    id: 'cust-4',
    customerCode: 'CUST-1004',
    name: 'Anita Roy',
    company: 'Roy Hospitality & Catering',
    phone: '+91 98840 33221',
    email: 'anita@royhospitality.com',
    address: '77 Kilpauk Garden Road, Chennai - 600010',
    notes: 'Regular order for menu cards and food packaging boxes.',
    createdAt: '2026-07-18T16:45:00.000Z',
  },
];

const SEED_JOBCARDS: JobCard[] = [
  {
    id: 'jc-101',
    jobNo: 'JC-2026-0001',
    customerId: 'cust-3',
    customerName: 'Vikram Mehta',
    company: 'TechVentures Pvt Ltd',
    phone: '+91 99620 99887',
    jobType: 'Visiting Card',
    productName: 'Executive NFC Business Cards',
    description: '350 GSM Art Card with Matt Lamination, Spot UV on Logo and Rounded Corners.',
    quantity: 1000,
    paperDetails: {
      size: '90mm x 54mm',
      gsm: '350 GSM',
      paperType: 'Art Card Premium',
    },
    printDetails: {
      printType: 'Digital',
      sides: 'Double Side',
      colorMode: 'CMYK + Spot Gold',
      lamination: 'Matt Thermal',
      binding: 'None',
      cutting: 'Rounded Corners',
      finishing: 'Spot UV',
      specialInstructions: 'Ensure crisp print on dark background color.',
    },
    production: {
      assignedTo: 'Arun Kumar (Design Lead)',
      machineUsed: 'Konica Minolta AccurioPress C4080',
      priority: 'High',
    },
    jobDate: '2026-07-28',
    expectedDeliveryDate: '2026-08-02',
    status: 'Designing',
    billing: {
      estimatedCost: 1800,
      sellingPrice: 3200,
      advancePaid: 1500,
      balanceAmount: 1700,
      paymentStatus: 'Partial',
    },
    timeline: [
      { id: 't1', status: 'Pending', timestamp: '2026-07-28T10:00:00.000Z', note: 'Job Card registered into press database', updatedBy: 'G. Chandru' },
      { id: 't2', status: 'Designing', timestamp: '2026-07-28T11:30:00.000Z', note: 'Assigned to Arun Kumar for alignment & proof verification', updatedBy: 'G. Chandru' },
    ],
    remarks: 'Customer requested vector proof via WhatsApp before printing.',
    files: [],
    createdAt: '2026-07-28T10:00:00.000Z',
    updatedAt: '2026-07-28T11:30:00.000Z',
  },
  {
    id: 'jc-102',
    jobNo: 'JC-2026-0002',
    customerId: 'cust-2',
    customerName: 'Priya Sundaram',
    company: 'Priya Fashion Boutique',
    phone: '+91 97900 67890',
    jobType: 'Flex',
    productName: 'Grand Opening Sale Backdrop Banner',
    description: '10ft x 5ft Heavy Star Flex Banner with Metal Eyelets.',
    quantity: 2,
    paperDetails: {
      size: '10ft x 5ft',
      gsm: '340 GSM',
      paperType: 'Star Flex Banner',
    },
    printDetails: {
      printType: 'Wide Format Outdoor',
      sides: 'Single Side',
      colorMode: 'CMYK Vivid',
      lamination: 'None',
      binding: 'Hemming & Eyelets',
      cutting: 'Trim to Size',
      finishing: 'Metal Eyelets every 2 feet',
      specialInstructions: 'Vibrant pink and gold color calibration required.',
    },
    production: {
      assignedTo: 'Karthik R. (Digital Printer)',
      machineUsed: 'Roland Solvent 3.2m',
      priority: 'Urgent',
    },
    jobDate: '2026-07-29',
    expectedDeliveryDate: '2026-07-31',
    status: 'Printing',
    billing: {
      estimatedCost: 1200,
      sellingPrice: 2500,
      advancePaid: 2500,
      balanceAmount: 0,
      paymentStatus: 'Paid',
    },
    timeline: [
      { id: 't1', status: 'Pending', timestamp: '2026-07-29T09:00:00.000Z', note: 'Order confirmed with full payment', updatedBy: 'G. Chandru' },
      { id: 't2', status: 'Designing', timestamp: '2026-07-29T10:00:00.000Z', note: 'Customer approved proof', updatedBy: 'Arun Kumar' },
      { id: 't3', status: 'Printing', timestamp: '2026-07-29T14:20:00.000Z', note: 'Loaded into Roland solvent printer', updatedBy: 'Karthik R.' },
    ],
    files: [],
    createdAt: '2026-07-29T09:00:00.000Z',
    updatedAt: '2026-07-29T14:20:00.000Z',
  },
];

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!existingSettings || JSON.parse(existingSettings).companyName?.includes('Apex') || !JSON.parse(existingSettings).email?.includes('saigraphicsch5')) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOBCARDS)) {
      localStorage.setItem(STORAGE_KEYS.JOBCARDS, JSON.stringify(SEED_JOBCARDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_INITIAL_EMPLOYEES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([
        {
          id: 'log-1',
          action: 'System Initialized',
          details: 'Sai Graphics Job Card System Version 1 active.',
          timestamp: new Date().toISOString(),
        }
      ]));
    }
  }

  // --- SETTINGS ---
  getSettings(): CompanySettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = data ? JSON.parse(data) : DEFAULT_SETTINGS;
    if (!parsed.email?.includes('saigraphicsch5') || parsed.companyName?.includes('Apex')) {
      parsed.companyName = 'Sai Graphics';
      parsed.ownerName = 'G. Chandru';
      parsed.email = 'saigraphicsch5@gmail.com';
      this.saveSettings(parsed);
    }
    return parsed;
  }

  saveSettings(settings: CompanySettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.addLog('Settings Updated', 'Company branding and owner details updated.');
  }

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  }

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  saveCustomer(customerData: Omit<Customer, 'id' | 'customerCode' | 'createdAt'> & { id?: string }): Customer {
    const customers = this.getCustomers();
    
    if (customerData.id) {
      const index = customers.findIndex(c => c.id === customerData.id);
      if (index !== -1) {
        const updated: Customer = {
          ...customers[index],
          ...customerData,
        };
        customers[index] = updated;
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        this.addLog('Customer Updated', `Updated customer ${updated.name} (${updated.company})`, updated.id, 'Customer');
        return updated;
      }
    }

    const nextCode = `CUST-${1000 + customers.length + 1}`;
    const newCustomer: Customer = {
      ...customerData,
      id: 'cust-' + Date.now(),
      customerCode: nextCode,
      createdAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.addLog('Customer Added', `Added customer ${newCustomer.name} (${newCustomer.company})`, newCustomer.id, 'Customer');
    return newCustomer;
  }

  deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === id);
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
    if (customer) {
      this.addLog('Customer Deleted', `Deleted customer ${customer.name}`);
    }
    return true;
  }

  // --- EMPLOYEES ---
  getEmployees(): Employee[] {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : DEFAULT_INITIAL_EMPLOYEES;
  }

  saveEmployee(employeeData: Omit<Employee, 'id' | 'createdAt'> & { id?: string }): Employee {
    const employees = this.getEmployees();

    if (employeeData.id) {
      const index = employees.findIndex(e => e.id === employeeData.id);
      if (index !== -1) {
        const updated: Employee = {
          ...employees[index],
          ...employeeData,
        };
        employees[index] = updated;
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        this.addLog('Employee Updated', `Updated staff record for ${updated.name} (${updated.role})`, updated.id, 'Employee');
        return updated;
      }
    }

    const newEmployee: Employee = {
      ...employeeData,
      id: 'emp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    employees.unshift(newEmployee);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    this.addLog('Employee Added', `Registered press operator ${newEmployee.name} (${newEmployee.role})`, newEmployee.id, 'Employee');
    return newEmployee;
  }

  deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === id);
    const filtered = employees.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
    if (emp) {
      this.addLog('Employee Removed', `Removed operator ${emp.name} from staff list`, id, 'Employee');
    }
    return true;
  }

  // --- JOB CARDS ---
  getJobCards(): JobCard[] {
    const data = localStorage.getItem(STORAGE_KEYS.JOBCARDS);
    return data ? JSON.parse(data) : [];
  }

  getJobCardById(id: string): JobCard | undefined {
    return this.getJobCards().find(j => j.id === id);
  }

  generateNextJobNo(): string {
    const settings = this.getSettings();
    const jobCards = this.getJobCards();
    const nextNum = jobCards.length + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `${settings.jobPrefix}${padded}`;
  }

  saveJobCard(jobCardData: Partial<JobCard>): JobCard {
    const jobCards = this.getJobCards();
    const now = new Date().toISOString();
    const settings = this.getSettings();

    if (jobCardData.id) {
      const index = jobCards.findIndex(j => j.id === jobCardData.id);
      if (index !== -1) {
        const existing = jobCards[index];
        const updated: JobCard = {
          ...existing,
          ...jobCardData,
          updatedAt: now,
          billing: {
            ...existing.billing,
            ...(jobCardData.billing || {}),
            balanceAmount: (jobCardData.billing?.sellingPrice ?? existing.billing.sellingPrice) - 
                          (jobCardData.billing?.advancePaid ?? existing.billing.advancePaid),
          }
        };
        jobCards[index] = updated;
        localStorage.setItem(STORAGE_KEYS.JOBCARDS, JSON.stringify(jobCards));
        this.addLog('Job Card Updated', `Updated Job #${updated.jobNo} (${updated.productName})`, updated.id, 'JobCard');
        return updated;
      }
    }

    const jobNo = this.generateNextJobNo();
    const initialStatus: JobStatus = jobCardData.status || 'Pending';
    const selling = jobCardData.billing?.sellingPrice || 0;
    const advance = jobCardData.billing?.advancePaid || 0;
    
    const newJobCard: JobCard = {
      id: 'jc-' + Date.now(),
      jobNo,
      customerId: jobCardData.customerId || '',
      customerName: jobCardData.customerName || 'Walk-in Customer',
      company: jobCardData.company || 'N/A',
      phone: jobCardData.phone || '',
      jobType: jobCardData.jobType || 'Visiting Card',
      productName: jobCardData.productName || 'Printed Collateral',
      description: jobCardData.description || '',
      quantity: jobCardData.quantity || 100,
      paperDetails: jobCardData.paperDetails || { size: 'A4', gsm: '130 GSM', paperType: 'Gloss Art' },
      printDetails: jobCardData.printDetails || {
        printType: 'Digital',
        sides: 'Single Side',
        colorMode: 'CMYK',
        lamination: 'None',
        binding: 'None',
        cutting: 'Standard',
        finishing: 'None',
      },
      production: jobCardData.production || {
        assignedTo: SAMPLE_EMPLOYEES[0],
        priority: 'Medium',
      },
      jobDate: jobCardData.jobDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: jobCardData.expectedDeliveryDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: initialStatus,
      billing: {
        estimatedCost: jobCardData.billing?.estimatedCost || 0,
        sellingPrice: selling,
        advancePaid: advance,
        balanceAmount: selling - advance,
        paymentStatus: advance >= selling ? 'Paid' : advance > 0 ? 'Partial' : 'Pending',
      },
      timeline: [
        {
          id: 't-' + Date.now(),
          status: initialStatus,
          timestamp: now,
          note: 'Job Card created and logged into system.',
          updatedBy: settings.ownerName || 'G. Chandru',
        }
      ],
      remarks: jobCardData.remarks || '',
      files: jobCardData.files || [],
      isDraft: jobCardData.isDraft || false,
      createdAt: now,
      updatedAt: now,
    };

    jobCards.unshift(newJobCard);
    localStorage.setItem(STORAGE_KEYS.JOBCARDS, JSON.stringify(jobCards));
    this.addLog('Job Card Created', `Created Job #${newJobCard.jobNo} for ${newJobCard.customerName}`, newJobCard.id, 'JobCard');
    
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
    return newJobCard;
  }

  updateJobStatus(id: string, status: JobStatus, note?: string): JobCard | null {
    const jobCard = this.getJobCardById(id);
    if (!jobCard) return null;
    const settings = this.getSettings();

    const now = new Date().toISOString();
    const newTimelineEvent = {
      id: 't-' + Date.now(),
      status,
      timestamp: now,
      note: note || `Status transitioned to ${status}`,
      updatedBy: settings.ownerName || 'G. Chandru',
    };

    const updated = this.saveJobCard({
      id: jobCard.id,
      status,
      timeline: [...jobCard.timeline, newTimelineEvent],
    });

    this.addLog('Status Update', `Job #${jobCard.jobNo} status changed to ${status}`, jobCard.id, 'JobCard');
    return updated;
  }

  updateJobPayment(id: string, advancePaid: number, paymentStatus?: import('../types').PaymentStatus, billNo?: string): JobCard | null {
    const jobCard = this.getJobCardById(id);
    if (!jobCard) return null;

    const sellingPrice = jobCard.billing.sellingPrice;
    const computedBalance = Math.max(0, sellingPrice - advancePaid);
    const computedStatus = paymentStatus || (advancePaid >= sellingPrice ? 'Paid' : advancePaid > 0 ? 'Partial' : 'Pending');

    const updatedBilling = {
      ...jobCard.billing,
      advancePaid,
      balanceAmount: computedBalance,
      paymentStatus: computedStatus,
      ...(billNo ? { billNo } : {}),
    };

    const updated = this.saveJobCard({
      id: jobCard.id,
      billing: updatedBilling,
    });

    this.addLog('Payment Recorded', `Payment updated for Job #${jobCard.jobNo}: Paid ₹${advancePaid}, Balance ₹${computedBalance} (${computedStatus})`, jobCard.id, 'JobCard');
    return updated;
  }

  deleteJobCard(id: string): boolean {
    const jobCards = this.getJobCards();
    const jc = jobCards.find(j => j.id === id);
    const filtered = jobCards.filter(j => j.id !== id);
    localStorage.setItem(STORAGE_KEYS.JOBCARDS, JSON.stringify(filtered));
    if (jc) {
      this.addLog('Job Card Deleted', `Deleted Job #${jc.jobNo}`);
    }
    return true;
  }

  duplicateJobCard(id: string): JobCard | null {
    const jc = this.getJobCardById(id);
    if (!jc) return null;

    const duplicated: Partial<JobCard> = {
      customerId: jc.customerId,
      customerName: jc.customerName,
      company: jc.company,
      phone: jc.phone,
      jobType: jc.jobType,
      productName: `${jc.productName} (Copy)`,
      description: jc.description,
      quantity: jc.quantity,
      paperDetails: { ...jc.paperDetails },
      printDetails: { ...jc.printDetails },
      production: { ...jc.production },
      billing: { ...jc.billing, advancePaid: 0, balanceAmount: jc.billing.sellingPrice, paymentStatus: 'Pending' },
      remarks: jc.remarks,
      status: 'Pending',
    };

    return this.saveJobCard(duplicated);
  }

  // --- DRAFTS ---
  saveDraft(draftData: Partial<JobCard>): void {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify({
      ...draftData,
      updatedAt: new Date().toISOString(),
    }));
  }

  getDraft(): Partial<JobCard> | null {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return data ? JSON.parse(data) : null;
  }

  clearDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }

  // --- LOGS ---
  getLogs(): ActivityLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  }

  addLog(action: string, details: string, entityId?: string, entityType?: 'JobCard' | 'Customer' | 'Settings' | 'Employee'): void {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      entityId,
      entityType,
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100)));
  }

  // --- FILES ATTACHMENT ---
  attachFile(jobCardId: string, file: { name: string; size: number; type: string; dataUrl: string }): JobCardFile | null {
    const jc = this.getJobCardById(jobCardId);
    if (!jc) return null;

    const newFile: JobCardFile = {
      id: 'file-' + Date.now(),
      jobCardId,
      name: file.name,
      size: file.size,
      type: file.type,
      fileUrl: file.dataUrl,
      uploadedAt: new Date().toISOString(),
    };

    const updatedFiles = [...jc.files, newFile];
    this.saveJobCard({ id: jc.id, files: updatedFiles });
    this.addLog('File Uploaded', `Attached file ${file.name} to Job #${jc.jobNo}`, jc.id, 'JobCard');
    return newFile;
  }

  deleteFile(jobCardId: string, fileId: string): void {
    const jc = this.getJobCardById(jobCardId);
    if (!jc) return;
    const updatedFiles = jc.files.filter(f => f.id !== fileId);
    this.saveJobCard({ id: jc.id, files: updatedFiles });
  }
}

export const storageService = new StorageService();
