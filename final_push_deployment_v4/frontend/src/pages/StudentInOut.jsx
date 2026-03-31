import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HiOutlineArrowLeft, 
    HiOutlineShieldCheck, 
    HiOutlineMapPin, 
    HiOutlineHome, 
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineIdentification,
    HiOutlineClock,
    HiOutlineArrowRightOnRectangle,
    HiOutlineExclamationCircle
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StudentInOut = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isAllocated, setIsAllocated] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // Current status (INSIDE/OUTSIDE)

    const [formData, setFormData] = useState({
        studentId: user?.studentId || '',
        action: 'exit',
        destination: '',
        goingHome: false,
        securityPin: ''
    });

    useEffect(() => {
        const checkAllocation = async () => {
            setLoading(true);
            try {
                const token = user?.token || sessionStorage.getItem('hostel_token');
                const res = await fetch('/api/allocations/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setIsAllocated(true);
                    fetchStatus(); // Only fetch status if allocated
                } else {
                    setIsAllocated(false);
                }
            } catch (err) {
                console.error('Error checking allocation:', err);
                setIsAllocated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAllocation();
    }, [user?.token]);

    const fetchStatus = async () => {
        try {
            const token = user?.token || sessionStorage.getItem('hostel_token');
            const res = await fetch('/api/qr/my-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.status);
                // Default action to opposite of current status
                setFormData(prev => ({ 
                    ...prev, 
                    action: data.status === 'INSIDE' ? 'exit' : 'entry' 
                }));
            }
        } catch (err) {
            console.error('Error fetching status:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const validateForm = () => {
        const studentIdRegex = /^(IT|BM)\d{8}$/i;
        if (!studentIdRegex.test(formData.studentId)) {
            toast.error('Invalid Student ID format (e.g. IT24102141)');
            return false;
        }

        if (formData.action === 'exit' && !formData.destination.trim()) {
            toast.error('Please enter a note/destination for going out');
            return false;
        }

        if (!formData.securityPin || formData.securityPin.length !== 4) {
            toast.error('Please enter the 4-digit Security PIN');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const token = user?.token || sessionStorage.getItem('hostel_token');
            const res = await fetch('/api/qr/scan', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    action: formData.action,
                    destination: formData.action === 'exit' ? formData.destination : 'Entry',
                    goingHome: formData.action === 'exit' ? formData.goingHome : false,
                    securityPin: formData.securityPin
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Successfully logged ${formData.action === 'exit' ? 'Exit' : 'Entry'}!`);
                navigate('/student');
            } else {
                toast.error(data.message || 'Verification failed');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAllocated) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                <div className="w-full max-w-lg space-y-8 animate-fade-in text-center">
                    <button 
                        onClick={() => navigate('/student')}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm mx-auto"
                    >
                        <HiOutlineArrowLeft /> Back to Dashboard
                    </button>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] -mr-16 -mt-16"></div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner">
                                <HiOutlineExclamationCircle className="text-rose-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Access Restricted</h2>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium leading-relaxed">
                                You cannot log attendance because you don't have an <span className="text-indigo-500 font-bold">active room allocation</span>.
                            </p>
                            <div className="pt-4">
                                <button 
                                    onClick={() => navigate('/student')}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                                >
                                    Return to Portal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-lg space-y-8 animate-fade-in">
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/student')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
                >
                    <HiOutlineArrowLeft /> Back to Dashboard
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16"></div>
                    
                    <div className="relative z-10 space-y-8">
                        {/* Title */}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <HiOutlineShieldCheck className="text-indigo-500 text-xl" />
                                </div>
                                <span className="text-indigo-500 font-bold text-xs uppercase tracking-[0.2em]">Gate Authorization</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                Log <span className="text-indigo-500">In & Out</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-sm mt-2">
                                Synchronize your status with the gate security system.
                            </p>
                        </div>

                        {/* Status Badge */}
                        {status && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                                status === 'INSIDE' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                            }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'INSIDE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <span className="text-xs font-black uppercase tracking-wider">Current Status: {status}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Student ID */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <HiOutlineIdentification className="text-lg" /> Student ID (IT/BM)
                                </label>
                                <input 
                                    type="text" 
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    placeholder="e.g. IT24102141"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500/30 transition-all uppercase"
                                />
                            </div>

                            {/* Action Radios */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <HiOutlineMapPin className="text-lg" /> Action
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`
                                        cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2
                                        ${formData.action === 'entry' 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}
                                    `}>
                                        <input 
                                            type="radio" 
                                            name="action" 
                                            value="entry" 
                                            checked={formData.action === 'entry'}
                                            onChange={handleChange}
                                            className="hidden" 
                                        />
                                        <HiOutlineHome className="text-2xl" />
                                        <span className="font-black text-sm uppercase">Entering</span>
                                    </label>

                                    <label className={`
                                        cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2
                                        ${formData.action === 'exit' 
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}
                                    `}>
                                        <input 
                                            type="radio" 
                                            name="action" 
                                            value="exit" 
                                            checked={formData.action === 'exit'}
                                            onChange={handleChange}
                                            className="hidden" 
                                        />
                                        <HiOutlineArrowRightOnRectangle className="text-2xl" />
                                        <span className="font-black text-sm uppercase">Exiting</span>
                                    </label>
                                </div>
                            </div>

                            {/* Destination/Note - Only for Exit */}
                            {formData.action === 'exit' && (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <HiOutlineChatBubbleBottomCenterText className="text-lg" /> Destination / Note
                                        </label>
                                        <textarea 
                                            name="destination"
                                            value={formData.destination}
                                            onChange={handleChange}
                                            placeholder="e.g. Going Home / Library / Dinner"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500/30 transition-all min-h-[100px]"
                                        />
                                    </div>

                                    <label className={`
                                        flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group
                                        ${formData.goingHome 
                                            ? 'bg-indigo-500/10 border-indigo-500/30 ring-4 ring-indigo-500/5' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-200'}
                                    `}>
                                        <input 
                                            type="checkbox"
                                            name="goingHome"
                                            checked={formData.goingHome}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-indigo-500 transition-all cursor-pointer accent-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <p className={`text-xs font-black uppercase tracking-wider transition-colors ${formData.goingHome ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                Going Home (Overnight)
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400">Skip automatic curfew late checks for tonight</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Security PIN */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <HiOutlineClock className="text-lg" /> Gate Verification PIN
                                </label>
                                <input 
                                    type="text" 
                                    name="securityPin"
                                    value={formData.securityPin}
                                    onChange={handleChange}
                                    maxLength={4}
                                    placeholder="••••"
                                    className="w-full bg-indigo-500/5 dark:bg-indigo-500/10 border-2 border-indigo-500/20 rounded-2xl px-5 py-5 font-black text-3xl tracking-[0.5em] text-center text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500/40 transition-all"
                                />
                                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider">
                                    Ask the Security Officer for the current 1-minute PIN
                                </p>
                            </div>

                            {/* Submit */}
                            <button 
                                type="submit"
                                disabled={submitting}
                                className={`
                                    w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl
                                    ${submitting 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-95'}
                                `}
                            >
                                {submitting ? 'Verifying PIN...' : 'Submit Log'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Link */}
                <p className="text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                    Unauthorized access is monitored • Secure Transaction
                </p>
            </div>
        </div>
    );
};

export default StudentInOut;
