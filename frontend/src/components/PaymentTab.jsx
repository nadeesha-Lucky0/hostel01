import React, { useState, useEffect, useRef } from 'react';
import {
    HiOutlineCurrencyDollar,
    HiOutlineDocumentArrowUp,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineInformationCircle,
    HiOutlineCloudArrowUp,
    HiOutlineCalendarDays,
    HiOutlineDocumentText,
    HiOutlineExclamationTriangle,
    HiOutlineUser
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const API = '/api';

const PaymentTab = ({ user }) => {
    const [initialData, setInitialData] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Refundable Form State
    const [refundableAmount, setRefundableAmount] = useState('');
    const [refundableFile, setRefundableFile] = useState(null);
    const refundableFileRef = useRef(null);

    // Monthly Form State
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [monthlyAmount, setMonthlyAmount] = useState('');
    const [monthlyFile, setMonthlyFile] = useState(null);
    const monthlyFileRef = useRef(null);

    const monthOptions = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const paidMonths = paymentStatus?.submittedMonths
        ? paymentStatus.submittedMonths
            .filter(m => m.status === 'Accepted' && m.year === currentYear)
            .flatMap(m => m.months || [m.month])
        : [];

    const toggleMonth = (m) => {
        if (paidMonths.includes(m)) return;
        setSelectedMonths(prev =>
            prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
        );
    };

    useEffect(() => {
        fetchInitialData();
        fetchPaymentStatus();
    }, []);

    const fetchInitialData = async () => {
        try {
            const res = await fetch(`${API}/student-payments/initial-data`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInitialData(data.data);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchPaymentStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/student-payments/status`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPaymentStatus(data.data);
            }
        } catch (err) {
            console.error('Error fetching payment status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, setFile) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
        if (!allowedTypes.includes(file.mimetype || file.type)) {
            toast.error('Invalid file format. Allowed: PDF, DOC, PNG, JPG');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB');
            return;
        }

        setFile(file);
    };

    const submitRefundable = async (e) => {
        e.preventDefault();
        if (!refundableAmount || !refundableFile) {
            toast.error('Please fill all fields and upload payment proof');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('amount', refundableAmount);
        formData.append('document', refundableFile);
        formData.append('paymentType', 'Refundable');

        // Include initial data for model creation
        if (initialData) {
            Object.keys(initialData).forEach(key => {
                formData.append(key, initialData[key]);
            });
        }

        try {
            const res = await fetch(`${API}/student-payments/refundable`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Refundable payment submitted successfully!');
                setPaymentStatus(data.data);
                setRefundableAmount('');
                setRefundableFile(null);
            } else {
                toast.error(data.msg || 'Submission failed');
            }
        } catch (err) {
            toast.error('Error submitting payment');
        } finally {
            setSubmitting(false);
        }
    };

    const submitMonthly = async (e) => {
        e.preventDefault();
        if (selectedMonths.length === 0 || !monthlyAmount || !monthlyFile) {
            toast.error('Please select months, enter amount and upload payment proof');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        const now = new Date();
        formData.append('year', now.getFullYear());
        formData.append('amount', monthlyAmount);
        formData.append('document', monthlyFile);
        formData.append('months', JSON.stringify(selectedMonths));
        formData.append('monthCount', selectedMonths.length);

        try {
            const res = await fetch(`${API}/student-payments/monthly`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Monthly payment submitted successfully!');
                setPaymentStatus(data.data);
                setMonthlyAmount('');
                setMonthlyFile(null);
                setSelectedMonths([]);
            } else {
                toast.error(data.msg || 'Submission failed');
            }
        } catch (err) {
            toast.error('Error submitting payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isRefundableSubmitted = paymentStatus?.refundPayment?.documentUrl;

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* ── Student Information ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <HiOutlineUser className="text-xl" />
                    </div>
                    Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoBox label="Student Name" value={initialData?.studentName || user?.name} />
                    <InfoBox label="Email Address" value={initialData?.email || user?.email} />
                    <InfoBox label="Roll Number" value={initialData?.rollNumber || 'N/A'} />
                    <InfoBox label="Wing" value={initialData?.wing || 'N/A'} isCapitalized />
                    <InfoBox label="Room Type" value={initialData?.roomType || 'N/A'} isCapitalized />
                </div>
            </div>


            <div className="grid lg:grid-cols-2 gap-8">
                {/* ── Refundable Payment Section ── */}
                <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all ${isRefundableSubmitted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <HiOutlineCurrencyDollar />
                        </div>
                        Refundable Payment
                    </h2>

                    {isRefundableSubmitted ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-[2rem] p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <HiOutlineCheckCircle className="text-4xl text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-100">Payment Completed</h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Your refundable payment has been successfully recorded.</p>
                            </div>
                            <div className="pt-4 flex flex-col items-center gap-4">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Amount Paid</span>
                                    <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">LKR {paymentStatus.refundPayment.amount?.toLocaleString()}</span>
                                </div>

                                {/* Refund Status Badge */}
                                <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-emerald-100/50 dark:border-emerald-900/30">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Refund Status</span>
                                    <div className={`px-6 py-2 rounded-2xl font-black text-[11px] uppercase tracking-wider border-2 ${paymentStatus.refund_status === 'Accepted' ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-100 dark:shadow-none' :
                                            paymentStatus.refund_status === 'Rejected' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-100 dark:shadow-none' :
                                                'bg-amber-400 text-amber-900 border-amber-300 shadow-lg shadow-amber-100 dark:shadow-none'
                                        }`}>
                                        {paymentStatus.refund_status || 'Pending'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={submitRefundable} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Payment Amount (LKR)</label>
                                <div className="relative">
                                    <HiOutlineCurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg" />
                                    <input
                                        type="number"
                                        value={refundableAmount}
                                        onChange={(e) => setRefundableAmount(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Payment Proof (PDF, DOC, PNG, JPG)</label>
                                <div
                                    onClick={() => refundableFileRef.current.click()}
                                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${refundableFile ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <input
                                        type="file"
                                        ref={refundableFileRef}
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, setRefundableFile)}
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    />
                                    {refundableFile ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineDocumentText className="text-4xl text-emerald-500" />
                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">{refundableFile.name}</span>
                                            <span className="text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-widest">Click to change</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <HiOutlineCloudArrowUp className="text-4xl" />
                                            <span className="text-sm font-bold">Select payment slip or screenshot</span>
                                            <span className="text-[10px] uppercase font-black tracking-widest">Max size: 10MB</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3"
                            >
                                {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <HiOutlineCloudArrowUp className="text-xl" />}
                                Submit Refundable Payment
                            </button>
                        </form>
                    )}
                </div>

                {/* ── Monthly Payment Section ── */}
                <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all ${!isRefundableSubmitted ? 'opacity-40 select-none' : ''}`}>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <HiOutlineCalendarDays />
                        </div>
                        Monthly Payment
                    </h2>

                    {!isRefundableSubmitted ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-12 text-center space-y-4">
                            <HiOutlineClock className="text-5xl text-slate-300 dark:text-slate-400 mx-auto" />
                            <p className="text-slate-500 dark:text-slate-500 font-bold text-sm max-w-[250px] mx-auto italic">Complete your refundable payment first to unlock monthly payments.</p>
                        </div>
                    ) : (
                        <form onSubmit={submitMonthly} className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Select Months</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {monthOptions.map(m => {
                                        const isPaid = paidMonths.includes(m);
                                        const isSelected = selectedMonths.includes(m);
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => toggleMonth(m)}
                                                disabled={isPaid}
                                                className={`py-2.5 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${isPaid
                                                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-100 dark:shadow-none cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 ring-2 ring-amber-50 dark:ring-amber-900/20'
                                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:border-amber-200 dark:hover:border-amber-500'
                                                    }`}
                                            >
                                                {m.substring(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedMonths.length > 0 && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center justify-between transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-amber-400 dark:text-amber-500 uppercase tracking-widest">Selected Period</span>
                                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{selectedMonths.join(', ')}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-amber-400 dark:text-amber-500 uppercase tracking-widest">Count</span>
                                            <span className="block text-lg font-black text-amber-900 dark:text-amber-100">{selectedMonths.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Total Fee (LKR)</label>
                                <div className="relative">
                                    <HiOutlineCurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg" />
                                    <input
                                        type="number"
                                        value={monthlyAmount}
                                        onChange={(e) => setMonthlyAmount(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Payment Proof (Monthly_Payment)</label>
                                <div
                                    onClick={() => monthlyFileRef.current.click()}
                                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${monthlyFile ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <input
                                        type="file"
                                        ref={monthlyFileRef}
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, setMonthlyFile)}
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    />
                                    {monthlyFile ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineDocumentText className="text-4xl text-emerald-500" />
                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">{monthlyFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <HiOutlineCloudArrowUp className="text-4xl" />
                                            <span className="text-sm font-bold">Upload slip for {selectedMonths.length > 0 ? selectedMonths.length : 'selected'} month{selectedMonths.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] font-black text-sm hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-3"
                            >
                                {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <HiOutlineDocumentArrowUp className="text-xl" />}
                                Submit Monthly Payment
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Payment History ── */}
            {paymentStatus?.submittedMonths?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <HiOutlineClock />
                        </div>
                        Monthly Submission History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paymentStatus.submittedMonths.map((m, idx) => (
                            <div key={idx} className="group p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-lg dark:hover:shadow-none transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 font-black transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                        {m.months?.join(', ') || m.month} {m.year}
                                    </div>
                                </div>
                                <div className="space-y-4 mb-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">Amount Paid</div>
                                            <div className="text-lg font-black text-slate-800 dark:text-slate-100">LKR {m.amount?.toLocaleString()}</div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${m.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' :
                                                    m.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                                        'bg-amber-100 text-amber-600'
                                                }`}>
                                                {m.status || 'Pending'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={m.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                >
                                    <HiOutlineDocumentText className="text-base" />
                                    View Receipt
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoBox = ({ label, value, isCapitalized }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col gap-1 transition-all hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-100 dark:hover:border-indigo-500/30 group">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] group-hover:text-indigo-400 transition-colors">{label}</span>
        <span className={`text-sm font-bold text-slate-700 dark:text-slate-200 ${isCapitalized ? 'capitalize' : ''} truncate`}>{value || '—'}</span>
    </div>
);

export default PaymentTab;
