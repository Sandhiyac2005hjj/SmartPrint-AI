import React, { useState, useEffect } from 'react';
import { JobCard, Customer, PaperDetails, PrintDetails, ProductionDetails, BillingDetails, PriorityLevel, Employee } from '../../types';
import { SAMPLE_EMPLOYEES } from '../../services/storage.service';
import { mlApi, CompletionPrediction } from '../../services/ml.service';
import {
  FileText,
  ArrowLeft,
  UserSearch,
  Scissors,
  Printer,
  DollarSign,
  Save,
  X,
  Sparkles,
  Check,
  AlertCircle,
  AlertTriangle,
  Plus,
  UserPlus,
  Zap,
  Clock,
  Flame
} from 'lucide-react';

interface JobCardFormProps {
  isOpen: boolean;
  jobCard?: JobCard;
  preselectedCustomer?: Customer;
  customers: Customer[];
  employees?: Employee[];
  onClose: () => void;
  onSave: (data: Partial<JobCard>) => void;
  onAddEmployee?: (data: { name: string; role: string; phone?: string }) => Employee | void;
  onAutoSaveDraft?: (draft: Partial<JobCard>) => void;
}

export const JobCardForm: React.FC<JobCardFormProps> = ({
  isOpen,
  jobCard,
  preselectedCustomer,
  customers,
  employees = [],
  onClose,
  onSave,
  onAddEmployee,
  onAutoSaveDraft,
}) => {
  // Customer selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Quick Add Employee Modal State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [quickEmpName, setQuickEmpName] = useState('');
  const [quickEmpRole, setQuickEmpRole] = useState('Offset Operator');

  // Available Employees Display List
  const operatorList = employees.length > 0
    ? employees.map(e => e.role ? `${e.name} (${e.role})` : e.name)
    : SAMPLE_EMPLOYEES;

  // Job Details
  const [jobType, setJobType] = useState('Visiting Card');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(500);

  // Paper Details
  const [paperSize, setPaperSize] = useState('A4');
  const [paperGsm, setPaperGsm] = useState('170 GSM');
  const [paperType, setPaperType] = useState('Gloss Art Paper');

  // Print & Finishing Specs
  const [printType, setPrintType] = useState('Digital');
  const [sides, setSides] = useState<'Single Side' | 'Double Side'>('Single Side');
  const [colorMode, setColorMode] = useState('CMYK');
  const [lamination, setLamination] = useState('None');
  const [binding, setBinding] = useState('None');
  const [cutting, setCutting] = useState('Standard');
  const [finishing, setFinishing] = useState('None');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Production & Schedule
  const [assignedTo, setAssignedTo] = useState(operatorList[0] || 'Arun Kumar');
  const [machineUsed, setMachineUsed] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );

  // AI Turnaround Prediction
  const [predictedCompletionDate, setPredictedCompletionDate] = useState<string | undefined>(undefined);
  const [predictedDays, setPredictedDays] = useState<number | undefined>(undefined);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<CompletionPrediction | null>(null);

  // Billing
  const [billNo, setBillNo] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const jobTypeOptions = [
    'Visiting Card',
    'Banner / Flex',
    'Brochure / Flyer',
    'Packaging Box',
    'Vinyl Sticker / Decal',
    'Booklet / Catalog',
    'Letterhead & Envelope',
    'ID Card / Lanyard',
    'Custom Press Order',
  ];

  const paperSizeOptions = ['A4', 'A3', '12x18 (Digital)', '13x19 (Digital)', 'Super A3', '10ft x 4ft', 'Custom Size'];
  const paperGsmOptions = ['80 GSM', '100 GSM', '130 GSM', '170 GSM', '250 GSM', '300 GSM', '350 GSM', 'Star Flex 340 GSM'];
  const paperTypeOptions = ['Gloss Art Paper', 'Matt Art Paper', 'Velvet Board', 'Art Card', 'Textured Paper', 'Star Flex Banner', 'Vinyl Sticker'];
  const printTypeOptions = ['Digital Press', 'Offset Print', 'Screen Print', 'Wide Format Solvent', 'UV Flatbed'];
  const colorModeOptions = ['CMYK 4-Color', 'Multi-color', 'B&W Monochrome', 'Spot Gold / Metallic'];
  const laminationOptions = ['None', 'Gloss Thermal', 'Matt Thermal', 'Velvet Touch', 'Spot UV'];
  const bindingOptions = ['None', 'Perfect Binding', 'Saddle Stitch', 'Spiral / Wiro', 'Hardcover', 'Tri-Fold'];
  const finishingOptions = ['None', 'Die Cut & Creasing', 'Embossing', 'Foil Stamping', 'Punch Holes', 'Corner Rounding'];

  useEffect(() => {
    if (jobCard) {
      setSelectedCustomerId(jobCard.customerId);
      const cust = customers.find((c) => c.id === jobCard.customerId);
      if (cust) setCustomerSearch(`${cust.name} (${cust.company})`);
      setJobType(jobCard.jobType || 'Visiting Card');
      setProductName(jobCard.productName || '');
      setDescription(jobCard.description || '');
      setQuantity(jobCard.quantity || 500);

      setPaperSize(jobCard.paperDetails.size || 'A4');
      setPaperGsm(jobCard.paperDetails.gsm || '170 GSM');
      setPaperType(jobCard.paperDetails.paperType || 'Gloss Art Paper');

      setPrintType(jobCard.printDetails.printType || 'Digital');
      setSides(jobCard.printDetails.sides || 'Single Side');
      setColorMode(jobCard.printDetails.colorMode || 'CMYK');
      setLamination(jobCard.printDetails.lamination || 'None');
      setBinding(jobCard.printDetails.binding || 'None');
      setCutting(jobCard.printDetails.cutting || 'Standard');
      setFinishing(jobCard.printDetails.finishing || 'None');
      setSpecialInstructions(jobCard.printDetails.specialInstructions || '');

      setAssignedTo(jobCard.production.assignedTo || operatorList[0]);
      setMachineUsed(jobCard.production.machineUsed || '');
      setPriority(jobCard.production.priority || 'Medium');
      setJobDate(jobCard.jobDate || new Date().toISOString().split('T')[0]);
      setExpectedDeliveryDate(jobCard.expectedDeliveryDate || new Date().toISOString().split('T')[0]);
      setPredictedCompletionDate(jobCard.predictedCompletionDate);
      setPredictedDays(jobCard.predictedDays);
      setPredictionResult(null);

      setBillNo(jobCard.billing.billNo || '');
      setEstimatedCost(jobCard.billing.estimatedCost || 0);
      setSellingPrice(jobCard.billing.sellingPrice || 0);
      setAdvancePaid(jobCard.billing.advancePaid || 0);
      setRemarks(jobCard.remarks || '');
    } else if (preselectedCustomer) {
      setSelectedCustomerId(preselectedCustomer.id);
      setCustomerSearch(`${preselectedCustomer.name} (${preselectedCustomer.company})`);
      setPredictedCompletionDate(undefined);
      setPredictedDays(undefined);
      setPredictionResult(null);
    } else {
      setSelectedCustomerId('');
      setCustomerSearch('');
      setProductName('');
      setDescription('');
      setQuantity(500);
      setPredictedCompletionDate(undefined);
      setPredictedDays(undefined);
      setPredictionResult(null);
      setBillNo('');
      setEstimatedCost(0);
      setSellingPrice(0);
      setAdvancePaid(0);
      setRemarks('');
    }
  }, [jobCard, preselectedCustomer, isOpen]);

  const handlePredictCompletion = async (priorityOverride?: PriorityLevel) => {
    setIsPredicting(true);
    const activePriority = priorityOverride || priority;
    try {
      const res = await mlApi.predictCompletion({
        job_type: jobType,
        quantity: Number(quantity) || 1,
        priority: activePriority,
        print_type: printType,
        print_lamination: lamination,
        print_finishing: finishing,
        print_sides: sides,
        job_date: jobDate,
        expected_delivery_date: expectedDeliveryDate,
      });
      if (res) {
        setPredictionResult(res);
        setPredictedCompletionDate(res.predicted_completion_date);
        setPredictedDays(res.predicted_days);
      }
    } catch (err) {
      console.error('Failed to predict completion:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  // Balance calculation
  const balanceAmount = Math.max(0, sellingPrice - advancePaid);

  // Auto-save draft mechanism
  useEffect(() => {
    if (!isOpen || jobCard) return;
    const timer = setTimeout(() => {
      if (productName || selectedCustomerId) {
        onAutoSaveDraft?.({
          customerId: selectedCustomerId,
          jobType,
          productName,
          quantity,
          billing: { sellingPrice, advancePaid, balanceAmount, estimatedCost, paymentStatus: 'Pending' },
        });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [productName, selectedCustomerId, sellingPrice, advancePaid, quantity]);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.company.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    let finalCustId = selectedCustomerId;
    let finalCustName = 'Walk-in Customer';
    let finalCompany = 'Direct Client';
    let finalPhone = '';

    if (!finalCustId) {
      if (customerSearch.trim()) {
        const match =
          customers.find(
            (c) =>
              c.name.toLowerCase() === customerSearch.trim().toLowerCase() ||
              c.company.toLowerCase() === customerSearch.trim().toLowerCase() ||
              `${c.name} (${c.company})`.toLowerCase() === customerSearch.trim().toLowerCase()
          ) || filteredCustomers[0];

        if (match) {
          finalCustId = match.id;
          finalCustName = match.name;
          finalCompany = match.company;
          finalPhone = match.phone;
        } else {
          finalCustId = 'cust-walkin-' + Date.now();
          finalCustName = customerSearch.trim();
          finalCompany = 'Walk-in';
          finalPhone = 'N/A';
        }
      } else {
        newErrors.customer = 'Please select or enter customer name';
      }
    } else {
      const selectedCust = customers.find((c) => c.id === finalCustId);
      if (selectedCust) {
        finalCustName = selectedCust.name;
        finalCompany = selectedCust.company;
        finalPhone = selectedCust.phone;
      }
    }

    if (!productName.trim()) newErrors.productName = 'Product name is required';
    if (quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data: Partial<JobCard> = {
      id: jobCard?.id,
      customerId: finalCustId,
      customerName: finalCustName,
      company: finalCompany,
      phone: finalPhone,

      jobType,
      productName: productName.trim(),
      description: description.trim(),
      quantity: Number(quantity),

      paperDetails: {
        size: paperSize,
        gsm: paperGsm,
        paperType,
      },
      printDetails: {
        printType,
        sides,
        colorMode,
        lamination,
        binding,
        cutting,
        finishing,
        specialInstructions,
      },
      production: {
        assignedTo,
        machineUsed,
        priority,
      },
      jobDate,
      expectedDeliveryDate,
      predictedCompletionDate,
      predictedDays,
      billing: {
        billNo: billNo.trim() || undefined,
        estimatedCost: Number(estimatedCost),
        sellingPrice: Number(sellingPrice),
        advancePaid: Number(advancePaid),
        balanceAmount,
        paymentStatus: advancePaid >= sellingPrice && sellingPrice > 0 ? 'Paid' : advancePaid > 0 ? 'Partial' : 'Pending',
      },
      remarks: remarks.trim(),
      status: jobCard?.status || 'Pending',
    };

    onSave(data);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all mr-1"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-sky-300" />
              <span>Back</span>
            </button>
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-base">{jobCard ? `Edit Job Card #${jobCard.jobNo}` : 'Create New Job Card'}</h3>
              <p className="text-[11px] text-sky-200">Generate shop ticket, print specs & billing structure</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-navy-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* SECTION 1: CUSTOMER SELECTION */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
              <UserSearch className="w-4 h-4 text-navy-700" /> 1. Customer Selection
            </h4>

            <div className="relative">
              <label className="block font-semibold text-slate-700 mb-1">
                Search & Select Customer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (selectedCustomerId) setSelectedCustomerId('');
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Type customer name, company, or phone to search..."
                className={`w-full p-2.5 bg-white border ${errors.customer ? 'border-rose-400' : 'border-slate-300'
                  } rounded-lg outline-none focus:ring-2 focus:ring-navy-100 font-medium`}
              />

              {showCustomerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-slate-400 text-center">No matching customer found. Add customer first.</div>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setCustomerSearch(`${cust.name} (${cust.company})`);
                          setShowCustomerDropdown(false);
                          setErrors((prev) => ({ ...prev, customer: '' }));
                        }}
                        className="p-2.5 hover:bg-navy-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{cust.name}</p>
                          <p className="text-[11px] text-slate-500">{cust.company} • {cust.phone}</p>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {cust.customerCode}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.customer && <p className="text-[11px] text-rose-500 mt-1">{errors.customer}</p>}
          </div>

          {/* SECTION 2: JOB DETAILS */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b pb-2">
              <Printer className="w-4 h-4 text-navy-700" /> 2. Job Specification & Order Info
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Type Category</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                >
                  {jobTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. NFC Gold Foil Visiting Cards"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                />
                {errors.productName && <p className="text-[11px] text-rose-500 mt-1">{errors.productName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Quantity (Pcs/Sheets)</label>
                <input
                  type="number"
                  value={quantity === 0 ? '' : quantity}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setQuantity(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Description / Instructions</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about colors, typography, layout dimensions..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* SECTION 3: TECHNICAL PAPER & PRINT SPECS */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b pb-2">
              <Scissors className="w-4 h-4 text-navy-700" /> 3. Paper Stock, Print & Finishing Options
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paper Size</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {paperSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paper GSM</label>
                <select
                  value={paperGsm}
                  onChange={(e) => setPaperGsm(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {paperGsmOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paper Material Type</label>
                <select
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {paperTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Printing Process</label>
                <select
                  value={printType}
                  onChange={(e) => setPrintType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {printTypeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Print Sides</label>
                <select
                  value={sides}
                  onChange={(e) => setSides(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Single Side">Single Side</option>
                  <option value="Double Side">Double Side</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Color Mode</label>
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {colorModeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lamination</label>
                <select
                  value={lamination}
                  onChange={(e) => setLamination(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {laminationOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Binding / Folding</label>
                <select
                  value={binding}
                  onChange={(e) => setBinding(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {bindingOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Finishing Accents</label>
                <select
                  value={finishing}
                  onChange={(e) => setFinishing(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-navy-800"
                >
                  {finishingOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Shop Floor Notes</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Keep extra margin for die-cut"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: PRODUCTION ASSIGNMENT & DATES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Assigned Press Operator</label>
                {onAddEmployee && (
                  <button
                    type="button"
                    onClick={() => setShowAddEmpModal(true)}
                    className="text-[10px] font-bold text-navy-700 hover:text-navy-900 flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add New
                  </button>
                )}
              </div>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium"
              >
                {operatorList.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Machine Allocated</label>
              <input
                type="text"
                value={machineUsed}
                onChange={(e) => setMachineUsed(e.target.value)}
                placeholder="e.g. Konica C4080 / Heidelberg"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-navy-900"
              />
            </div>
          </div>

          {/* SECTION 4.5: AI TURNAROUND & COMPLETION PREDICTOR */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-slate-50 p-4 rounded-xl border border-indigo-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                    AI Turnaround & Completion Predictor
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                      R² 0.77 • ±1.5d
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Predicts physical production turnaround and alerts if completion exceeds customer promised delivery date.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePredictCompletion}
                disabled={isPredicting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-bold text-xs shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPredicting ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Predicting Turnaround...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Predict Completion Date (AI)</span>
                  </>
                )}
              </button>
            </div>

            {/* Prediction Result Display */}
            {(predictedCompletionDate || predictionResult) && (
              <div className="space-y-2 pt-1">
                {(() => {
                  const estDate = predictedCompletionDate || predictionResult?.predicted_completion_date;
                  const days = predictedDays || predictionResult?.predicted_days || 0;
                  const isDelay = estDate && expectedDeliveryDate && estDate > expectedDeliveryDate;
                  const diff = predictionResult?.days_difference ?? (
                    estDate && expectedDeliveryDate
                      ? Math.round((new Date(estDate).getTime() - new Date(expectedDeliveryDate).getTime()) / (1000 * 3600 * 24))
                      : 0
                  );

                  if (isDelay) {
                    return (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap sm:flex-nowrap items-start justify-between gap-3 animate-fadeIn">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-amber-900">
                                ⚡ AI Schedule Advisory — Expedite Required
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                                +{diff} Day(s) Overdue
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800 mt-1">
                              AI turnaround model forecasts <strong>{days} production days</strong> (ready on{' '}
                              <strong className="underline font-bold text-rose-700">{estDate}</strong>), which is after customer promised delivery{' '}
                              <strong className="text-slate-900">({expectedDeliveryDate})</strong>.
                              Accelerate shop-floor scheduling or mark as Urgent.
                            </p>
                          </div>
                        </div>

                        {priority !== 'Urgent' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPriority('Urgent');
                              handlePredictCompletion('Urgent');
                            }}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
                            title="Set Priority to Urgent to speed up press turnaround"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Mark Urgent 🔥</span>
                          </button>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-emerald-900">
                              ✅ On Track — Turnaround Feasible
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-300">
                              Ready by {estDate} ({days} days)
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-1">
                            Estimated completion: <strong>{days} day(s)</strong> (Ready on <strong>{estDate}</strong>).
                            {diff < 0
                              ? ` Customer deadline has a comfortable ${Math.abs(diff)} day buffer.`
                              : ' Completes on the customer deadline.'}
                          </p>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Factors breakdown */}
                {predictionResult?.factors && predictionResult.factors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Factors:</span>
                    {predictionResult.factors.map((f, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700 font-medium"
                      >
                        {f.factor}:{' '}
                        <strong className={f.days > 0 ? 'text-indigo-600' : 'text-emerald-600'}>
                          {f.days > 0 ? `+${f.days}d` : `${f.days}d`}
                        </strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: BILLING CALCULATOR */}
          <div className="bg-gradient-to-r from-slate-900 to-navy-900 text-white p-5 rounded-2xl shadow-md space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-sky-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> 5. Billing & Payment Calculation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Bill / Invoice No</label>
                <input
                  type="text"
                  placeholder="e.g. INV-1002"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-sm outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Selling Price (₹)</label>
                <input
                  type="number"
                  value={sellingPrice === 0 ? '' : sellingPrice}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-black text-base outline-none focus:border-sky-400 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Advance Paid (₹)</label>
                <input
                  type="number"
                  value={advancePaid === 0 ? '' : advancePaid}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAdvancePaid(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-black text-base outline-none focus:border-sky-400 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Auto Balance (₹)</label>
                <div className="p-2.5 bg-white/20 rounded-xl border border-white/30 text-amber-300 font-black text-base">
                  ₹ {balanceAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 italic">
              Auto-saves draft to memory every 2 seconds.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-bold rounded-xl shadow-md transition-all"
              >
                <Save className="w-4 h-4 text-sky-300" />
                <span>{jobCard ? 'Save Job Card Updates' : 'Generate Job Card'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Add Operator Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-navy-700" /> Add New Press Operator
              </h4>
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Kumar"
                  value={quickEmpName}
                  onChange={(e) => setQuickEmpName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-navy-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Specialization</label>
                <select
                  value={quickEmpRole}
                  onChange={(e) => setQuickEmpRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                >
                  <option value="Offset Operator">Offset Operator</option>
                  <option value="Digital Printer">Digital Printer</option>
                  <option value="Design Lead">Design Lead</option>
                  <option value="Finishing Tech">Finishing Tech</option>
                  <option value="Quality Inspector">Quality Inspector</option>
                  <option value="Bindery Specialist">Bindery Specialist</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quickEmpName.trim()) return;
                  const created = onAddEmployee?.({ name: quickEmpName.trim(), role: quickEmpRole });
                  const formatted = quickEmpRole ? `${quickEmpName.trim()} (${quickEmpRole})` : quickEmpName.trim();
                  setAssignedTo(formatted);
                  setQuickEmpName('');
                  setShowAddEmpModal(false);
                }}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-950 text-white font-bold rounded-xl shadow-xs"
              >
                Save & Select Operator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
