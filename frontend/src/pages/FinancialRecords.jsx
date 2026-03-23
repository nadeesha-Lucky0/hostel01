import React, { useState, useEffect } from 'react';
import { HiOutlineDocumentChartBar, HiOutlineMagnifyingGlass, HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FinancialRecords = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/financial/records', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRecords(data.data);
                setFilteredRecords(data.data);
            }
        } catch (err) {
            toast.error('Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = records.filter(r =>
            r.studentName.toLowerCase().includes(lowerSearch) ||
            r.rollNumber.toLowerCase().includes(lowerSearch) ||
            r.email.toLowerCase().includes(lowerSearch)
        );
        setFilteredRecords(filtered);
    }, [searchTerm, records]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Only refundable payment records
    const allPayments = [];
    filteredRecords.forEach(record => {
        if (record.refundPayment?.documentUrl) {
            allPayments.push({
                ...record,
                type: 'Refundable',
                amount: record.refundPayment.amount,
                date: record.refundPayment.submittedDate,
                doc: record.refundPayment.documentUrl,
                status: record.refund_status || 'Pending',
                period: 'Security Deposit'
            });
        }
    });

    // Sort by date descending
    allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Refundable Payment Records</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 italic">Security deposit submissions from students</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                        type="text"
                        placeholder="Search student, roll number or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                    />
                </div>
                <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 uppercase tracking-[0.2em] shadow-sm">
                    Total Transactions: {allPayments.length}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Period</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {allPayments.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 dark:text-white">{p.studentName}</span>
                                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{p.rollNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.type === 'Refundable' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {p.type}
                                            </span>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{p.period}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                                        LKR {p.amount?.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-6 align-middle">
                                        <div className={`badge ${p.status === 'Accepted' || p.status === 'Approved' ? 'badge-success' :
                                            p.status === 'Rejected' ? 'badge-rejected' :
                                                'badge-warning'
                                            } uppercase tracking-widest`}>
                                            {p.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <a
                                            href={p.doc}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                                        >
                                            View <HiOutlineArrowTopRightOnSquare className="text-base" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialRecords;
