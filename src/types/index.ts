export type JobStatus = 
  | 'Pending'
  | 'Designing'
  | 'Printing'
  | 'Finishing'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export type PaymentStatus = 'Pending' | 'Partial' | 'Paid';

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  company: string;
  phone: string;
  altPhone?: string;
  email?: string;
  gstNumber?: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface PaperDetails {
  size: string;
  gsm: string;
  paperType: string;
}

export interface PrintDetails {
  printType: string;
  sides: 'Single Side' | 'Double Side';
  colorMode: string;
  lamination: string;
  binding: string;
  cutting: string;
  finishing: string;
  specialInstructions?: string;
}

export interface ProductionDetails {
  assignedTo: string;
  machineUsed?: string;
  priority: PriorityLevel;
}

export interface BillingDetails {
  billNo?: string;
  estimatedCost: number;
  sellingPrice: number;
  advancePaid: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
}

export interface TimelineEvent {
  id: string;
  status: JobStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface JobCardFile {
  id: string;
  jobCardId: string;
  name: string;
  size: number;
  type: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface JobCard {
  id: string;
  jobNo: string;
  customerId: string;
  customerName: string;
  company: string;
  phone: string;
  
  jobType: string;
  productName: string;
  description?: string;
  quantity: number;
  
  paperDetails: PaperDetails;
  printDetails: PrintDetails;
  production: ProductionDetails;
  
  jobDate: string;
  expectedDeliveryDate: string;
  
  status: JobStatus;
  billing: BillingDetails;
  timeline: TimelineEvent[];
  remarks?: string;
  files: JobCardFile[];
  
  isDraft?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  companyName: string;
  ownerName: string;
  logoUrl?: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  currency: string;
  jobPrefix: string;
  terms: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  entityId?: string;
  entityType?: 'JobCard' | 'Customer' | 'Settings' | 'Employee';
}

export type ActiveTab = 'dashboard' | 'customers' | 'jobcards' | 'billing' | 'files' | 'reports' | 'settings';
