import React, { useState, useEffect } from 'react';
import { ActiveTab, Customer, JobCard, CompanySettings, ActivityLog, JobStatus, PaymentStatus, Employee } from './types';
import { storageService } from './services/storage.service';
import { apiService } from './services/api.service';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerModal } from './components/customers/CustomerModal';
import { CustomerProfileModal } from './components/customers/CustomerProfileModal';
import { JobCardList } from './components/jobcards/JobCardList';
import { JobCardForm } from './components/jobcards/JobCardForm';
import { JobCardDetailModal } from './components/jobcards/JobCardDetailModal';
import { BillingDashboard } from './components/billing/BillingDashboard';
import { FileArchive } from './components/files/FileArchive';
import { Reports } from './components/reports/Reports';
import { Settings } from './components/settings/Settings';
import { ToastContainer, ToastMessage, ConfirmDialog } from './components/common/Toast';
import { PrintPulseAnalytics } from './components/analytics/PrintPulseAnalytics';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Application Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(storageService.getSettings());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Modals & Drawers
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | undefined>(undefined);

  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState<JobCard | undefined>(undefined);
  const [preselectedCustomer, setPreselectedCustomer] = useState<Customer | undefined>(undefined);
  const [selectedJobCardDetail, setSelectedJobCardDetail] = useState<JobCard | undefined>(undefined);

  const [initialJobFilterStatus, setInitialJobFilterStatus] = useState<JobStatus | undefined>(undefined);

  // Toasts & Confirmations
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load Data
  const refreshData = async () => {
    try {
      const [apiCusts, apiJobs, apiEmps, apiSettings, apiLogs] = await Promise.all([
        apiService.getCustomers().catch(() => null),
        apiService.getJobCards().catch(() => null),
        apiService.getEmployees().catch(() => null),
        apiService.getSettings().catch(() => null),
        apiService.getLogs().catch(() => null),
      ]);

      if (apiCusts && apiCusts.length > 0) {
        setCustomers(apiCusts);
      } else {
        setCustomers(storageService.getCustomers());
      }

      if (apiJobs && apiJobs.length > 0) {
        setJobCards(apiJobs);
      } else {
        setJobCards(storageService.getJobCards());
      }

      if (apiEmps && apiEmps.length > 0) {
        setEmployees(apiEmps);
      } else {
        setEmployees(storageService.getEmployees());
      }

      if (apiSettings && apiSettings.companyName) {
        setSettings(apiSettings);
      } else {
        setSettings(storageService.getSettings());
      }

      if (apiLogs && apiLogs.length > 0) {
        setLogs(apiLogs);
      } else {
        setLogs(storageService.getLogs());
      }
    } catch (err) {
      console.warn('[App] Backend load failed, falling back to local storage:', err);
      setCustomers(storageService.getCustomers());
      setJobCards(storageService.getJobCards());
      setSettings(storageService.getSettings());
      setEmployees(storageService.getEmployees());
      setLogs(storageService.getLogs());
    }
  };

  useEffect(() => {
    refreshData();
    const hash = window.location.hash.replace('#', '');
    const validTabs: ActiveTab[] = ['dashboard', 'customers', 'jobcards', 'billing', 'files', 'reports', 'settings', 'analytics'];
    if (validTabs.includes(hash as ActiveTab)) {
      setActiveTab(hash as ActiveTab);
    } else {
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    }
  }, []);

  // Sync browser back/forward and Escape key
  useEffect(() => {
    const handlePopState = () => {
      if (selectedJobCardDetail || viewingCustomer || isJobFormOpen || isCustomerModalOpen || confirmDialog.isOpen) {
        setSelectedJobCardDetail(undefined);
        setViewingCustomer(undefined);
        setIsJobFormOpen(false);
        setIsCustomerModalOpen(false);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        return;
      }
      const hash = window.location.hash.replace('#', '');
      const validTabs: ActiveTab[] = ['dashboard', 'customers', 'jobcards', 'billing', 'files', 'reports', 'settings', 'analytics'];
      if (validTabs.includes(hash as ActiveTab)) {
        setActiveTab(hash as ActiveTab);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedJobCardDetail || viewingCustomer || isJobFormOpen || isCustomerModalOpen || confirmDialog.isOpen) {
          if (window.history.state?.modal) {
            window.history.back();
          } else {
            setSelectedJobCardDetail(undefined);
            setViewingCustomer(undefined);
            setIsJobFormOpen(false);
            setIsCustomerModalOpen(false);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedJobCardDetail, viewingCustomer, isJobFormOpen, isCustomerModalOpen, confirmDialog.isOpen]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
  };

  const handleSelectJobCard = (job: JobCard | undefined) => {
    setSelectedJobCardDetail(job);
    if (job) {
      window.history.pushState({ modal: 'job', id: job.id }, '', `#jobcard-${job.jobNo}`);
    }
  };

  const handleCloseJobDetail = () => {
    if (window.history.state?.modal === 'job') {
      window.history.back();
    } else {
      setSelectedJobCardDetail(undefined);
    }
  };

  const handleSelectCustomer = (cust: Customer | undefined) => {
    setViewingCustomer(cust);
    if (cust) {
      window.history.pushState({ modal: 'customer', id: cust.id }, '', `#customer-${cust.customerCode}`);
    }
  };

  const handleCloseCustomerProfile = () => {
    if (window.history.state?.modal === 'customer') {
      window.history.back();
    } else {
      setViewingCustomer(undefined);
    }
  };

  const handleOpenJobForm = (open: boolean, job?: JobCard, preCust?: Customer) => {
    setIsJobFormOpen(open);
    setEditingJobCard(job);
    setPreselectedCustomer(preCust);
    if (open) {
      window.history.pushState({ modal: 'jobform' }, '', '#new-jobcard');
    }
  };

  const handleCloseJobForm = () => {
    if (window.history.state?.modal === 'jobform') {
      window.history.back();
    } else {
      setIsJobFormOpen(false);
      setEditingJobCard(undefined);
      setPreselectedCustomer(undefined);
    }
  };

  const handleOpenCustomerModal = (open: boolean, cust?: Customer) => {
    setIsCustomerModalOpen(open);
    setEditingCustomer(cust);
    if (open) {
      window.history.pushState({ modal: 'customermodal' }, '', '#new-customer');
    }
  };

  const handleCloseCustomerModal = () => {
    if (window.history.state?.modal === 'customermodal') {
      window.history.back();
    } else {
      setIsCustomerModalOpen(false);
      setEditingCustomer(undefined);
    }
  };

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = { id: 'toast-' + Date.now(), type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  // --- CUSTOMER ACTIONS ---
  const handleSaveCustomer = async (data: Omit<Customer, 'id' | 'customerCode' | 'createdAt'> & { id?: string }) => {
    const isEdit = !!data.id;
    try {
      const saved = await apiService.saveCustomer(data);
      storageService.saveCustomer(data);
      await refreshData();
      setIsCustomerModalOpen(false);
      setEditingCustomer(undefined);
      addToast('success', isEdit ? 'Customer Profile Updated' : 'New Customer Registered', `${saved.name} (${saved.company})`);
    } catch {
      const saved = storageService.saveCustomer(data);
      await refreshData();
      setIsCustomerModalOpen(false);
      setEditingCustomer(undefined);
      addToast('success', isEdit ? 'Customer Profile Updated' : 'New Customer Registered', `${saved.name} (${saved.company})`);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Customer Record?',
      message: 'Are you sure you want to permanently delete this customer from press records?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiService.deleteCustomer(id);
        } catch {
          // ignore
        }
        storageService.deleteCustomer(id);
        await refreshData();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        addToast('warning', 'Customer Record Deleted');
      },
    });
  };

  // --- JOB CARD ACTIONS ---
  const handleSaveJobCard = async (data: Partial<JobCard>) => {
    const isEdit = !!data.id;
    try {
      const saved = await apiService.saveJobCard(data);
      storageService.saveJobCard(data);
      await refreshData();
      setIsJobFormOpen(false);
      setEditingJobCard(undefined);
      setPreselectedCustomer(undefined);
      if (selectedJobCardDetail?.id === saved.id) {
        setSelectedJobCardDetail(saved);
      }
      addToast('success', isEdit ? `Job Card #${saved.jobNo} Updated` : `Job Card #${saved.jobNo} Generated`, `Product: ${saved.productName}`);
    } catch {
      const saved = storageService.saveJobCard(data);
      await refreshData();
      setIsJobFormOpen(false);
      setEditingJobCard(undefined);
      setPreselectedCustomer(undefined);
      if (selectedJobCardDetail?.id === saved.id) {
        setSelectedJobCardDetail(saved);
      }
      addToast('success', isEdit ? `Job Card #${saved.jobNo} Updated` : `Job Card #${saved.jobNo} Generated`, `Product: ${saved.productName}`);
    }
  };

  const handleDuplicateJobCard = async (id: string) => {
    try {
      const duplicated = await apiService.duplicateJobCard(id);
      storageService.duplicateJobCard(id);
      await refreshData();
      addToast('info', 'Job Card Cloned', `Created new duplicate order #${duplicated.jobNo}`);
    } catch {
      const duplicated = storageService.duplicateJobCard(id);
      if (duplicated) {
        await refreshData();
        addToast('info', 'Job Card Cloned', `Created new duplicate order #${duplicated.jobNo}`);
      }
    }
  };

  const handleDeleteJobCard = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Job Card?',
      message: 'Are you sure you want to delete this Job Card ticket from database?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiService.deleteJobCard(id);
        } catch {
          // ignore
        }
        storageService.deleteJobCard(id);
        await refreshData();
        setSelectedJobCardDetail(undefined);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        addToast('warning', 'Job Card Deleted');
      },
    });
  };

  const handleUpdateJobStatus = async (id: string, status: JobStatus, note?: string) => {
    try {
      const updated = await apiService.updateJobStatus(id, status, note);
      storageService.updateJobStatus(id, status, note);
      await refreshData();
      setSelectedJobCardDetail(updated);
      addToast('success', `Status Changed to ${status}`, `Job #${updated.jobNo}`);
    } catch {
      const updated = storageService.updateJobStatus(id, status, note);
      if (updated) {
        await refreshData();
        setSelectedJobCardDetail(updated);
        addToast('success', `Status Changed to ${status}`, `Job #${updated.jobNo}`);
      }
    }
  };

  const handleUpdatePayment = async (jobId: string, advancePaid: number, paymentStatus: PaymentStatus, billNo?: string) => {
    try {
      const updated = await apiService.updateJobPayment(jobId, advancePaid, paymentStatus, billNo);
      storageService.updateJobPayment(jobId, advancePaid, paymentStatus, billNo);
      await refreshData();
      if (selectedJobCardDetail?.id === updated.id) {
        setSelectedJobCardDetail(updated);
      }
      addToast('success', 'Payment Recorded', `Job #${updated.jobNo}: Paid ₹${advancePaid.toLocaleString()}, Balance ₹${updated.billing.balanceAmount.toLocaleString()}`);
    } catch {
      const updated = storageService.updateJobPayment(jobId, advancePaid, paymentStatus, billNo);
      if (updated) {
        await refreshData();
        if (selectedJobCardDetail?.id === updated.id) {
          setSelectedJobCardDetail(updated);
        }
        addToast('success', 'Payment Recorded', `Job #${updated.jobNo}: Paid ₹${advancePaid.toLocaleString()}, Balance ₹${updated.billing.balanceAmount.toLocaleString()}`);
      }
    }
  };

  // --- FILE ACTIONS ---
  const handleFileUpload = (jobCardId: string, file: { name: string; size: number; type: string; dataUrl: string }) => {
    const attached = storageService.attachFile(jobCardId, file);
    if (attached) {
      refreshData();
      const updated = storageService.getJobCardById(jobCardId);
      if (updated) setSelectedJobCardDetail(updated);
      addToast('success', 'File Attached', file.name);
    }
  };

  const handleFileDelete = (jobCardId: string, fileId: string) => {
    storageService.deleteFile(jobCardId, fileId);
    refreshData();
    const updated = storageService.getJobCardById(jobCardId);
    if (updated) setSelectedJobCardDetail(updated);
    addToast('info', 'File Removed');
  };

  // --- SETTINGS & STAFF ACTIONS ---
  const handleSaveSettings = (newSettings: CompanySettings) => {
    storageService.saveSettings(newSettings);
    refreshData();
    addToast('success', 'Settings Saved', 'Press header branding and invoice layout updated');
  };

  const handleAddEmployee = (data: { name: string; role: string; phone?: string }) => {
    const newEmp = storageService.saveEmployee(data);
    refreshData();
    addToast('success', 'Operator Registered', `${newEmp.name} (${newEmp.role})`);
    return newEmp;
  };

  const handleDeleteEmployee = (id: string) => {
    storageService.deleteEmployee(id);
    refreshData();
    addToast('warning', 'Operator Removed from Roster');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        settings={settings}
        jobCount={jobCards.length}
        customerCount={customers.length}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          onOpenNewJobCard={() => handleOpenJobForm(true)}
          onOpenNewCustomer={() => handleOpenCustomerModal(true)}
          jobCards={jobCards}
          customers={customers}
          onSelectJobCard={handleSelectJobCard}
          onSelectCustomer={handleSelectCustomer}
        />

        {/* Dynamic View Routing */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <Dashboard
              jobCards={jobCards}
              customers={customers}
              logs={logs}
              onOpenNewJobCard={() => handleOpenJobForm(true)}
              onOpenNewCustomer={() => handleOpenCustomerModal(true)}
              onSelectJobCard={handleSelectJobCard}
              onNavigateToJobCards={(status) => {
                setInitialJobFilterStatus(status);
                handleTabChange('jobcards');
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerList
              customers={customers}
              jobCards={jobCards}
              onOpenAddModal={() => handleOpenCustomerModal(true)}
              onEditCustomer={(cust) => handleOpenCustomerModal(true, cust)}
              onDeleteCustomer={handleDeleteCustomer}
              onViewCustomerProfile={handleSelectCustomer}
            />
          )}

          {activeTab === 'jobcards' && (
            <JobCardList
              jobCards={jobCards}
              initialFilterStatus={initialJobFilterStatus}
              onOpenCreateModal={() => handleOpenJobForm(true)}
              onSelectJobCard={handleSelectJobCard}
              onEditJobCard={(job) => handleOpenJobForm(true, job)}
              onDuplicateJobCard={handleDuplicateJobCard}
              onDeleteJobCard={handleDeleteJobCard}
            />
          )}

          {activeTab === 'billing' && (
            <BillingDashboard
              jobCards={jobCards}
              onSelectJobCard={handleSelectJobCard}
              onUpdatePayment={handleUpdatePayment}
            />
          )}

          {activeTab === 'files' && (
            <FileArchive
              jobCards={jobCards}
              onSelectJobCard={handleSelectJobCard}
            />
          )}

          {activeTab === 'reports' && <Reports jobCards={jobCards} />}

          {activeTab === 'analytics' && <PrintPulseAnalytics />}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onSaveSettings={handleSaveSettings}
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}
        </main>
      </div>

      {/* --- MODAL DIALOGS & OVERLAYS --- */}

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={editingCustomer}
        onClose={handleCloseCustomerModal}
        onSave={handleSaveCustomer}
      />

      {/* Customer Profile View Drawer */}
      <CustomerProfileModal
        isOpen={!!viewingCustomer}
        customer={viewingCustomer}
        customerJobCards={jobCards.filter((j) => j.customerId === viewingCustomer?.id)}
        onClose={handleCloseCustomerProfile}
        onEditCustomer={(cust) => {
          setViewingCustomer(undefined);
          handleOpenCustomerModal(true, cust);
        }}
        onCreateJobCardForCustomer={(cust) => {
          setViewingCustomer(undefined);
          handleOpenJobForm(true, undefined, cust);
        }}
        onSelectJobCard={handleSelectJobCard}
      />

      {/* Add / Edit Job Card Form Modal */}
      <JobCardForm
        isOpen={isJobFormOpen}
        jobCard={editingJobCard}
        preselectedCustomer={preselectedCustomer}
        customers={customers}
        employees={employees}
        onClose={handleCloseJobForm}
        onSave={handleSaveJobCard}
        onAddEmployee={handleAddEmployee}
        onAutoSaveDraft={(draft) => storageService.saveDraft(draft)}
      />

      {/* Detailed Job Card View & Timeline Modal */}
      <JobCardDetailModal
        isOpen={!!selectedJobCardDetail}
        jobCard={selectedJobCardDetail}
        settings={settings}
        onClose={handleCloseJobDetail}
        onEdit={(job) => {
          setSelectedJobCardDetail(undefined);
          handleOpenJobForm(true, job);
        }}
        onDuplicate={handleDuplicateJobCard}
        onDelete={handleDeleteJobCard}
        onUpdateStatus={handleUpdateJobStatus}
        onFileUpload={handleFileUpload}
        onFileDelete={handleFileDelete}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((item) => item.id !== id))} />
    </div>
  );
}

export default App;
