import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HiOutlineQrCode, 
    HiOutlineIdentification, 
    HiOutlineShieldCheck,
    HiOutlineMapPin,
    HiOutlineArrowRightOnRectangle,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineClock,
    HiOutlineChevronRight
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const PublicStudentInOut = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);
    const [idInput, setIdInput] = useState('');
    const [formData, setFormData] = useState({
        action: 'exit',
        destination: '',
        securityPin: '',
        goingHome: false
    });

    const studentIdPattern = /^(IT|BM)\d{8}$/i;

    useEffect(() => {
        if (idInput.length >= 10 && studentIdPattern.test(idInput)) {
            fetchStatus(idInput);
        } else {
            setStatus(null);
        }
    }, [idInput]);

    const fetchStatus = async (studentId) => {
        try {
            const res = await fetch(`/api/qr/status/${studentId.toUpperCase()}`);
            const data = await res.json();
            if (data.studentId) {
                setStatus(data);
                // Auto-set the opposite action for better UX
                setFormData(prev => ({
                    ...prev,
                    action: data.status === 'INSIDE' ? 'exit' : 'entry'
                }));
            } else {
                setStatus(null);
            }
        } catch (err) {
            console.error('Error fetching status:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!studentIdPattern.test(idInput)) {
            toast.error('Invalid Student ID format (Ex: IT24100103)');
            return;
        }

        if (!formData.securityPin) {
            toast.error('Security PIN is required');
            return;
        }

        if (formData.action === 'exit' && !formData.destination) {
            toast.error('Destination is required for exit');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/qr/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: idInput.toUpperCase(),
                    action: formData.action,
                    destination: formData.destination,
                    goingHome: formData.goingHome,
                    securityPin: formData.securityPin
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Action logged successfully!');
                // Reset form but keep ID
                setFormData({
                    ...formData,
                    destination: '',
                    securityPin: '',
                    goingHome: false
                });
                fetchStatus(idInput);
            } else {
                toast.error(data.message || 'Failed to log action');
            }
        } catch (err) {
            toast.error('Connection error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] p-4 sm:p-8 flex items-center justify-center font-inter">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-xl relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-4">
                        <HiOutlineQrCode className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Public Gate Portal</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Gate <span className="text-white/40">Attendance</span></h1>
                    <p className="text-slate-400 font-medium text-sm">Scan official QR or enter ID manually to log entry/exit.</p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-150">
                    <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
                        {/* Student ID Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Student ID (IT/BM)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <HiOutlineIdentification className={`text-xl transition-colors ${status ? 'text-emerald-400' : 'text-slate-500'}`} />
                                </div>
                                <input 
                                    type="text"
                                    value={idInput}
                                    onChange={(e) => setIdInput(e.target.value)}
                                    placeholder="Ex: IT24100103"
                                    maxLength={10}
                                    className={`w-full bg-slate-900/50 border ${status ? 'border-emerald-500/30' : 'border-white/10 group-hover:border-white/20'} rounded-2xl py-4 pl-14 pr-5 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase`}
                                />
                                {status && (
                                    <div className="absolute inset-y-0 right-5 flex items-center">
                                        <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-md animate-in fade-in zoom-in-50">VERIFIED</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Feedback */}
                        {status && (
                            <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/5 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${status.status === 'INSIDE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        <HiOutlineClock className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Current Status</p>
                                        <p className="text-sm font-bold text-white tracking-wide">{status.status}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Last Seen</p>
                                    <p className="text-sm font-bold text-white/60 tracking-wide">
                                        {status.lastTime ? new Date(status.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, action: 'entry'})}
                                className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                                    formData.action === 'entry' 
                                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-xl shadow-emerald-500/20' 
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <HiOutlineArrowLeftOnRectangle className="text-lg" />
                                Entry
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, action: 'exit'})}
                                className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                                    formData.action === 'exit' 
                                    ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-xl shadow-amber-500/20' 
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <HiOutlineArrowRightOnRectangle className="text-lg" />
                                Exit
                            </button>
                        </div>

                        {/* Conditional Destination Field */}
                        {formData.action === 'exit' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Destination / Purpose</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <HiOutlineMapPin className="text-xl text-slate-500" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({...formData, destination: e.target.value})}
                                        placeholder="E.g. Library, Home, Supper"
                                        className="w-full bg-slate-900/50 border border-white/10 group-hover:border-white/20 rounded-2xl py-4 pl-14 pr-5 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <label className={`
                                    flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group mt-4
                                    ${formData.goingHome 
                                        ? 'bg-amber-500/10 border-amber-500/30 ring-4 ring-amber-500/5' 
                                        : 'bg-white/5 border-white/10 hover:border-white/20'}
                                `}>
                                    <input 
                                        type="checkbox" 
                                        id="goingHome"
                                        checked={formData.goingHome}
                                        onChange={(e) => setFormData({...formData, goingHome: e.target.checked})}
                                        className="w-5 h-5 bg-slate-900 border-white/20 rounded-lg checked:bg-amber-500 transition-all cursor-pointer accent-amber-500"
                                    />
                                    <div className="flex-1">
                                        <p className={`text-xs font-black uppercase tracking-wider transition-colors ${formData.goingHome ? 'text-amber-400' : 'text-slate-400'}`}>
                                            Going Home (Overnight)
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500">Skip automatic curfew late checks for tonight</p>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Security PIN Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Security Gate PIN</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <HiOutlineShieldCheck className="text-xl text-slate-500" />
                                </div>
                                <input 
                                    type="text"
                                    value={formData.securityPin}
                                    onChange={(e) => setFormData({...formData, securityPin: e.target.value})}
                                    placeholder="Enter 4-digit PIN from Security Officer"
                                    maxLength={4}
                                    className="w-full bg-slate-900/50 border border-white/10 group-hover:border-white/20 rounded-2xl py-4 pl-14 pr-5 text-white font-black tracking-[0.5em] placeholder:text-slate-600 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={submitting || !status}
                            className={`w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-2xl ${
                                !status 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]'
                            }`}
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Log Attendance
                                    <HiOutlineChevronRight className="text-lg group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center px-8">
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                        This is an official gateway control portal. Unauthorized or fraudulent entries are strictly monitored and reported to the Warden's office.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicStudentInOut;
