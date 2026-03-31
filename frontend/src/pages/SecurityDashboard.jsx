import React, { useState, useEffect, useCallback } from 'react';
import { 
    HiOutlineQrCode, 
    HiOutlineUserGroup, 
    HiOutlineClock, 
    HiOutlineShieldCheck,
    HiOutlineArrowPath,
    HiOutlineIdentification,
    HiOutlineMapPin,
    HiOutlineArrowRightOnRectangle,
    HiOutlineArrowLeftOnRectangle
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SecurityDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        outsideCount: 0,
        lateCount: 0,
        totalToday: 0
    });
    const [recentLogs, setRecentLogs] = useState([]);
    const [outsideStudents, setOutsideStudents] = useState([]);
    const [securityPin, setSecurityPin] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const timeLeftRef = React.useRef(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'outside'

    const fetchData = useCallback(async (isInitial = false) => {
        const token = user?.token || sessionStorage.getItem('hostel_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            if (isInitial) setLoading(true);
            
            // 1. Fetch Logs
            const logsRes = await fetch('/api/qr/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const logsData = await logsRes.json();
            setRecentLogs(Array.isArray(logsData) ? logsData : []);

            // 2. Fetch Outside Students
            const outsideRes = await fetch('/api/qr/outside', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const outsideData = await outsideRes.json();
            if (outsideData.success !== false) {
                setOutsideStudents(outsideData.outside || []);
                setStats(prev => ({ ...prev, outsideCount: outsideData.outsideCount || 0 }));
            }

            // 3. Fetch Security PIN with cache buster
            const pinRes = await fetch(`/api/qr/security-pin?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!pinRes.ok) throw new Error(`PIN API Error: ${pinRes.status}`);
            const pinData = await pinRes.json();
            
            console.log('DEBUG: pinData received:', pinData);
            setSecurityPin(pinData);
            
            // Sync timer if it's far off or just starting
            const serverRemaining = pinData.remainingSeconds || 60;
            if (timeLeftRef.current <= 0 || Math.abs(timeLeftRef.current - serverRemaining) > 5) {
                setTimeLeft(serverRemaining);
                timeLeftRef.current = serverRemaining;
            }

            // 4. Fetch Late Students (optional for stats)
            const lateRes = await fetch('/api/qr/late', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const lateData = await lateRes.json();
            setStats(prev => ({ ...prev, lateCount: lateData.lateCount || 0 }));

            console.log('Security Sync Complete:', { logs: logsData.length, outside: outsideData.outsideCount, pin: pinData.pin });
        } catch (err) {
            console.error('Security Fetch Error:', err);
            toast.error('Failed to sync security data');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData(true); // Initial load
        
        const timerInterval = setInterval(() => {
            setTimeLeft(prev => {
                const newVal = prev <= 1 ? 0 : prev - 1;
                timeLeftRef.current = newVal;
                
                if (newVal === 0) {
                    fetchData(false); // Background refresh
                    return 0; 
                }
                return newVal;
            });
        }, 1000);

        return () => {
            clearInterval(timerInterval);
        };
    }, [fetchData]);

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    useEffect(() => {
        console.log('SecurityDashboard Mounted');
    }, []);

    if (loading && stats.outsideCount === 0 && recentLogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Initializing Security Systems...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <HiOutlineShieldCheck className="text-emerald-500 dark:text-emerald-400 text-xl" />
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">Security Control Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Security <span className="text-slate-400 dark:text-white/40 italic">Overview</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Monitoring gate access and student presence in real-time.</p>
                </div>

                <div className="flex gap-4 relative z-10">
                    <button 
                        onClick={fetchData}
                        className="p-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-2xl transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2 group"
                    >
                        <HiOutlineArrowPath className={`text-xl group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''} text-indigo-500 dark:text-white`} />
                        <span className="font-bold text-sm">Sync Now</span>
                    </button>
                </div>
            </div>

            {/* PIN SECTION - Now more prominent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-emerald-500 rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-2xl shadow-emerald-500/20 relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[60px] -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-xs font-black text-emerald-950/60 uppercase tracking-[0.3em] mb-4">Current Entry PIN</span>
                        <div className="flex gap-4 mb-4">
                            {securityPin?.pin ? (
                                String(securityPin.pin).split('').map((digit, i) => (
                                    <div key={i} className="w-16 h-20 sm:w-20 sm:h-24 bg-emerald-950 text-emerald-400 flex items-center justify-center rounded-2xl text-5xl sm:text-6xl font-black shadow-2xl border border-white/10 animate-bounce-short" style={{ animationDelay: `${i * 100}ms` }}>
                                        {digit}
                                    </div>
                                ))
                            ) : (
                                <div className="h-24 flex items-center justify-center gap-4">
                                    <div className="w-16 h-24 bg-emerald-600/20 animate-pulse rounded-2xl"></div>
                                    <div className="w-16 h-24 bg-emerald-600/20 animate-pulse rounded-2xl"></div>
                                    <div className="w-16 h-24 bg-emerald-600/20 animate-pulse rounded-2xl"></div>
                                    <div className="w-16 h-24 bg-emerald-600/20 animate-pulse rounded-2xl"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                                <HiOutlineClock className="text-lg animate-pulse" />
                                Refreshes in {timeLeft}s
                            </div>
                            
                            <button 
                                onClick={fetchData}
                                className="text-[10px] font-black underline uppercase tracking-tighter text-emerald-900 mt-2 hover:text-emerald-950 transition-colors"
                            >
                                {loading ? 'Syncing...' : 'Force Refresh PIN'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 flex flex-col justify-center shadow-xl transition-colors">
                    <div className="flex items-center gap-6">
                        {/* Fixed QR Code */}
                        <div className="bg-slate-50 dark:bg-white p-3 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-white/5 group relative overflow-hidden transition-colors">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.protocol}//${window.location.host}/public/in-out`}
                                alt="Gate QR"
                                className="w-32 h-32 relative z-10"
                            />
                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h4 className="text-slate-900 dark:text-white font-black text-sm mb-1 uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Fixed Gate QR</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium transition-colors">Students can scan this fixed QR to log attendance without logging into their portal.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <a 
                                    href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${window.location.protocol}//${window.location.host}/public/in-out`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    <HiOutlineQrCode className="text-sm" />
                                    Download / Print QR
                                </a>
                                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-center">Public Portal Active</p>
                                    <p className="text-slate-600 dark:text-white/60 font-bold text-[10px] text-center truncate italic">/public/in-out</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="card-security group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 transition-colors">
                            <HiOutlineMapPin className="text-2xl" />
                        </div>
                        <div>
                            <p className="stat-label">Currently Outside</p>
                            <h3 className="stat-value text-slate-900 dark:text-white transition-colors">{stats.outsideCount} <span className="text-xs text-slate-400 dark:text-white/20 font-medium lowercase">Students</span></h3>
                        </div>
                    </div>
                </div>

                <div className="card-security group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 transition-colors">
                            <HiOutlineClock className="text-2xl" />
                        </div>
                        <div>
                            <p className="stat-label">Late Returns</p>
                            <h3 className="stat-value text-rose-600 dark:text-rose-400 transition-colors">{stats.lateCount}</h3>
                        </div>
                    </div>
                </div>

                <div className="card-security group">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-500 transition-colors">
                            <HiOutlineQrCode className="text-2xl" />
                        </div>
                        <div>
                            <p className="stat-label">Scans Today</p>
                            <h3 className="stat-value text-slate-900 dark:text-white transition-colors">{recentLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit border border-slate-200 dark:border-white/5 transition-colors">
                <button 
                    onClick={() => setActiveTab('logs')}
                    className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'logs' ? 'text-[#1A3263] shadow-lg shadow-[#FAB95B]/20' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                    style={activeTab === 'logs' ? { backgroundColor: '#FAB95B' } : {}}
                >
                    RECENT SCANS
                </button>
                <button 
                    onClick={() => setActiveTab('outside')}
                    className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'outside' ? 'text-[#1A3263] shadow-lg shadow-[#FAB95B]/20' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                    style={activeTab === 'outside' ? { backgroundColor: '#FAB95B' } : {}}
                >
                    OUTSIDE STUDENTS
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HiOutlineUserGroup className="text-slate-300 dark:text-white/20 text-xl transition-colors" />
                        <h4 className="font-bold text-slate-800 dark:text-white italic transition-colors">{activeTab === 'logs' ? 'Gateway Activity Stream' : 'Current Off-Premise Students'}</h4>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">{activeTab === 'logs' ? recentLogs.length : outsideStudents.length} entries</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] transition-colors">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Student Details</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">{activeTab === 'logs' ? 'Event' : 'Exit Time'}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">{activeTab === 'logs' ? 'Destination' : 'Destination'}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Time</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {activeTab === 'logs' ? (
                                recentLogs.length === 0 ? (
                                    <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400 italic font-medium">No recent logs found.</td></tr>
                                ) : recentLogs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black transition-colors">
                                                    {log.studentUserId?.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white transition-colors">{log.studentUserId?.name || 'Unknown Student'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter transition-colors">{log.studentId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                                                log.action === 'entry' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {log.action === 'entry' ? <HiOutlineArrowLeftOnRectangle /> : <HiOutlineArrowRightOnRectangle />}
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-medium text-slate-500 dark:text-white/60 transition-colors">{log.destination || (log.action === 'entry' ? 'Returning to Hostel' : '—')}</p>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-400 dark:text-white/40 italic transition-colors">
                                            {formatTime(log.timestamp)}
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-[10px] text-slate-300 dark:text-white/20 uppercase transition-colors">
                                            {formatDate(log.timestamp)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                outsideStudents.length === 0 ? (
                                    <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400 italic font-medium">All students are currently inside.</td></tr>
                                ) : outsideStudents.map(item => (
                                    <tr key={item.student?.studentId} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black transition-colors">
                                                    {item.student?.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white transition-colors">{item.student?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter transition-colors">{item.student?.studentId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-amber-500 dark:text-amber-400/60 uppercase italic tracking-wider transition-colors">OFF-PREMISE</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-medium text-slate-500 dark:text-white/60 transition-colors">{item.destination}</p>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-400 dark:text-white/40 italic transition-colors">
                                            {formatTime(item.lastExitAt)}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {item.isLate ? (
                                                <span className="px-2 py-1 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse transition-colors">LATE</span>
                                            ) : item.goingHome ? (
                                                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">OVERNIGHT</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 dark:text-white/20 uppercase tracking-widest italic transition-colors">{formatDate(item.lastExitAt)}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .card-security {
                    background: white;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    padding: 1.5rem;
                    border-radius: 2rem;
                    box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .dark .card-security {
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: none;
                }
                .card-security:hover {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: rgba(15, 23, 42, 0.15);
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.15);
                }
                .dark .card-security:hover {
                    background: rgba(15, 23, 42, 0.6);
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.5);
                }
                .stat-icon {
                    width: 3.5rem;
                    height: 3.5rem;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-label {
                    font-size: 0.625rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #94a3b8;
                    margin-bottom: 0.25rem;
                }
                .dark .stat-label {
                    color: rgba(255, 255, 255, 0.4);
                }
                .stat-value {
                    font-size: 1.875rem;
                    font-weight: 900;
                    color: #0f172a;
                    line-height: 1;
                }
                .dark .stat-value {
                    color: white;
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-bounce-short {
                    animation: bounceShort 0.5s ease-out;
                }
                @keyframes bounceShort {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}} />
        </div>
    );
};

export default SecurityDashboard;
