import React, { useState, useEffect, useCallback } from 'react';
import { 
    HiOutlineMagnifyingGlass, 
    HiOutlineFunnel,
    HiOutlineArrowDownTray,
    HiOutlineArrowsRightLeft
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const WardenScanRecords = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'entry', 'exit', 'outside'

    const fetchLogs = useCallback(async () => {
        const token = user?.token || sessionStorage.getItem('hostel_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [logsRes, outsideRes] = await Promise.all([
                fetch('/api/qr/logs', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/qr/outside', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const logsData = await logsRes.json();
            const outsideData = await outsideRes.json();

            const formattedLogs = Array.isArray(logsData) ? logsData : [];
            const formattedOutside = (outsideData.outside || []).map(o => ({
                _id: `outside-${o.studentId}-${o.lastExitAt}`,
                studentUserId: { name: o.name },
                studentId: o.studentId,
                action: 'exit',
                destination: o.destination,
                timestamp: o.lastExitAt,
                goingHome: o.goingHome,
                isLate: o.isLate,
                isCurrentlyOutside: true
            }));

            setLogs(formattedLogs);
            setFilteredLogs(formattedLogs); // default to all
            // Store outside students separately to avoid mixing them into 'all' if not desired, 
            // but the user wants it as a tab.
            window.lastOutsideData = formattedOutside; 
        } catch (err) {
            console.error('Fetch Error:', err);
            toast.error('Failed to load activity records');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (filter === 'outside') {
            let result = window.lastOutsideData || [];
            if (searchTerm) {
                const low = searchTerm.toLowerCase();
                result = result.filter(l => 
                    (l.studentUserId?.name || '').toLowerCase().includes(low) ||
                    (l.studentId || '').toLowerCase().includes(low) ||
                    (l.destination || '').toLowerCase().includes(low)
                );
            }
            setFilteredLogs(result);
        } else {
            let result = logs;
            if (searchTerm) {
                const low = searchTerm.toLowerCase();
                result = result.filter(l => 
                    (l.studentUserId?.name || '').toLowerCase().includes(low) ||
                    (l.studentId || '').toLowerCase().includes(low) ||
                    (l.destination || '').toLowerCase().includes(low)
                );
            }
            if (filter !== 'all') {
                result = result.filter(l => l.action === filter);
            }
            setFilteredLogs(result);
        }
    }, [searchTerm, filter, logs]);

    const handleExport = () => {
        const headers = ["Date", "Time", "Student Name", "IT Number", "Action", "Destination", "Overnight", "Status", "Late"];
        const csvData = filteredLogs.map(l => [
            new Date(l.timestamp).toLocaleDateString(),
            new Date(l.timestamp).toLocaleTimeString(),
            l.studentUserId?.name || 'N/A',
            l.studentId,
            (l.isCurrentlyOutside ? 'OUTSIDE' : l.action).toUpperCase(),
            l.destination || 'N/A',
            l.goingHome ? 'YES' : 'NO',
            l.isCurrentlyOutside ? 'STILL OUTSIDE' : 'LOGGED',
            l.isLate ? 'YES' : 'NO'
        ]);

        const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Warden_ScanLogs_${new Date().toLocaleDateString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Logs exported successfully');
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Student <span className="text-indigo-500 italic">In/Out</span> Logs</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 transition-colors">Complete audit trail of student gate movements and overnight stays.</p>
                </div>
                
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-2xl transition-all border border-slate-200 dark:border-white/10 font-bold text-sm shadow-sm"
                >
                    <HiOutlineArrowDownTray className="text-lg text-indigo-600 dark:text-indigo-400" />
                    Export Audit CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Search & Filters */}
                <div className="md:col-span-12 flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors">
                            <HiOutlineMagnifyingGlass className="text-xl group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium shadow-sm"
                            placeholder="Search by student, ID, or destination..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 h-fit self-center transition-colors">
                        {['all', 'entry', 'exit', 'outside'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'text-[#1A3263] shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white'}`}
                                style={filter === f ? { backgroundColor: '#FAB95B' } : {}}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="md:col-span-12 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Date & Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Student Information</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Action</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Destination</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-8 py-6">
                                                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length === 0 ? (
                                    <tr><td colSpan="4" className="px-8 py-20 text-center text-slate-400 dark:text-slate-500 italic font-medium">No activity records found matching your selection.</td></tr>
                                ) : filteredLogs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 dark:text-white font-black text-sm transition-colors">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                <span className="text-slate-400 dark:text-white/30 text-[10px] font-bold mt-0.5 italic transition-colors">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold shadow-inner transition-colors">
                                                    {log.studentUserId?.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white transition-colors">{log.studentUserId?.name || 'N/A'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 tracking-tight transition-colors">{log.studentId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors w-fit ${
                                                    log.isCurrentlyOutside ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                                    log.action === 'entry' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 
                                                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {log.isCurrentlyOutside ? 'Currently Outside' : log.action}
                                                </span>
                                                {log.action === 'exit' && log.goingHome && (
                                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 w-fit">
                                                        Overnight Stay
                                                    </span>
                                                )}
                                                {log.isCurrentlyOutside && log.isLate && (
                                                    <span className="px-2 py-0.5 bg-red-600/10 text-red-600 dark:text-red-400 animate-pulse rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/20 w-fit">
                                                        LATE (Past Curfew)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-slate-600 dark:text-white/70 max-w-xs truncate transition-colors font-medium">{log.destination || '—'}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .animate-fade-in {
                    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default WardenScanRecords;
