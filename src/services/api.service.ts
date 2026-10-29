import { Customer, JobCard, CompanySettings, ActivityLog, JobStatus, JobCardFile, Employee, PaymentStatus } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async getCustomerById(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async saveCustomer(customer: Partial<Customer>): Promise<Customer> {
    if (customer.id) {
      return this.request<Customer>(`/customers/${customer.id}`, {
        method: 'PUT',
        body: JSON.stringify(customer),
      });
    }
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, { method: 'DELETE' });
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('/employees');
  }

  async saveEmployee(employee: Partial<Employee>): Promise<Employee> {
    if (employee.id) {
      return this.request<Employee>(`/employees/${employee.id}`, {
        method: 'PUT',
        body: JSON.stringify(employee),
      });
    }
    return this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.request<void>(`/employees/${id}`, { method: 'DELETE' });
  }

  // Job Cards
  async getJobCards(): Promise<JobCard[]> {
    return this.request<JobCard[]>('/jobcards');
  }

  async getJobCardById(id: string): Promise<JobCard> {
    return this.request<JobCard>(`/jobcards/${id}`);
  }

  async saveJobCard(jobCard: Partial<JobCard>): Promise<JobCard> {
    if (jobCard.id) {
      return this.request<JobCard>(`/jobcards/${jobCard.id}`, {
        method: 'PUT',
        body: JSON.stringify(jobCard),
      });
    }
    return this.request<JobCard>('/jobcards', {
      method: 'POST',
      body: JSON.stringify(jobCard),
    });
  }

  async updateJobStatus(id: string, status: JobStatus, note?: string): Promise<JobCard> {
    return this.request<JobCard>(`/jobcards/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async updateJobPayment(id: string, advancePaid: number, paymentStatus?: PaymentStatus, billNo?: string): Promise<JobCard> {
    return this.request<JobCard>(`/jobcards/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ advancePaid, paymentStatus, billNo }),
    });
  }

  async duplicateJobCard(id: string): Promise<JobCard> {
    return this.request<JobCard>(`/jobcards/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async deleteJobCard(id: string): Promise<void> {
    return this.request<void>(`/jobcards/${id}`, { method: 'DELETE' });
  }

  // Company Settings
  async getSettings(): Promise<CompanySettings> {
    return this.request<CompanySettings>('/settings');
  }

  async updateSettings(settings: CompanySettings): Promise<CompanySettings> {
    return this.request<CompanySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Activity Logs
  async getLogs(): Promise<ActivityLog[]> {
    return this.request<ActivityLog[]>('/logs');
  }

  async addLog(action: string, details: string, entityId?: string, entityType?: string): Promise<ActivityLog> {
    return this.request<ActivityLog>('/logs', {
      method: 'POST',
      body: JSON.stringify({ action, details, entityId, entityType }),
    });
  }

  // File Upload
  async uploadFile(jobCardId: string, file: File): Promise<JobCardFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/files/upload/${jobCardId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return response.json();
  }

  async deleteFile(jobCardId: string, fileId: string): Promise<void> {
    return this.request<void>(`/files/${jobCardId}/${fileId}`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
