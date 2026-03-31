import React, { useState } from 'react';
import { 
    HiOutlineCog6Tooth, 
    HiOutlineDevicePhoneMobile, 
    HiOutlineLockClosed, 
    HiOutlineEye, 
    HiOutlineEyeSlash 
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API = '/api';

const StaffSettings = () => {
    const { user, refreshUser } = useAuth();
    const [phoneState, setPhoneState] = useState({ step: 'form', newPhone: '', otp: '', loading: false });
    const [pwdState, setPwdState] = useState({ step: 'form', newPwd: '', confirmPwd: '', otp: '', loading: false });
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ── Phone Update Logic ──
    const requestPhoneOTP = async (e) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(phoneState.newPhone)) return toast.error('Enter a valid 10-digit number');
        setPhoneState(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch(`${API}/auth/request-phone-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ newPhone: phoneState.newPhone })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('OTP sent to new number!');
                setPhoneState(prev => ({ ...prev, step: 'otp' }));
            } else toast.error(data.message);
        } catch { toast.error('Connection error'); }
        finally { setPhoneState(prev => ({ ...prev, loading: false })); }
    };

    const verifyPhoneOTP = async (e) => {
        e.preventDefault();
        setPhoneState(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch(`${API}/auth/verify-phone-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ otp: phoneState.otp })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Phone number updated!');
                setPhoneState({ step: 'success', newPhone: '', otp: '', loading: false });
                await refreshUser();
            } else toast.error(data.message);
        } catch { toast.error('Connection error'); }
        finally { setPhoneState(prev => ({ ...prev, loading: false })); }
    };

    // ── Password Update Logic ──
    const requestPwdOTP = async (e) => {
        e.preventDefault();
        if (pwdState.newPwd !== pwdState.confirmPwd) return toast.error('Passwords do not match');
        if (pwdState.newPwd.length < 6) return toast.error('Min. 6 characters required');
        
        if (!user.phoneNumber) {
            return toast.error('Please add a phone number first to receive security OTPs.');
        }

        setPwdState(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch(`${API}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, newPassword: pwdState.newPwd, confirmPassword: pwdState.confirmPwd })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setPwdState(prev => ({ ...prev, step: 'otp' }));
            } else toast.error(data.message);
        } catch { toast.error('Connection error'); }
        finally { setPwdState(prev => ({ ...prev, loading: false })); }
    };

    const verifyPwdOTP = async (e) => {
        e.preventDefault();
        setPwdState(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch(`${API}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, otp: pwdState.otp })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Password updated successfully!');
                setPwdState({ step: 'success', newPwd: '', confirmPwd: '', otp: '', loading: false });
            } else toast.error(data.message);
        } catch { toast.error('Connection error'); }
        finally { setPwdState(prev => ({ ...prev, loading: false })); }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                        <HiOutlineCog6Tooth size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Staff Settings</h2>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Account & Security Management</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* ── Section: Phone Number ── */}
                    <div className="space-y-6 p-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-100 dark:hover:border-indigo-900/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600">
                                <HiOutlineDevicePhoneMobile size={20} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Phone Number</h3>
                        </div>

                        {phoneState.step === 'form' && (
                            <form onSubmit={requestPhoneOTP} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        {user.phoneNumber ? 'Update Phone Number' : 'Add Phone Number'}
                                    </label>
                                    <div className="text-[10px] text-slate-400 mb-1 px-1">
                                        {user.phoneNumber ? `Current: ${user.phoneNumber}` : 'No phone number registered.'}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. 07XXXXXXXX"
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                        value={phoneState.newPhone}
                                        onChange={e => setPhoneState({ ...phoneState, newPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    />
                                </div>
                                <button type="submit" disabled={phoneState.loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">
                                    {phoneState.loading ? 'Sending OTP...' : 'Get Verification OTP'}
                                </button>
                            </form>
                        )}

                        {phoneState.step === 'otp' && (
                            <form onSubmit={verifyPhoneOTP} className="space-y-5">
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Verification Required</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Enter the code sent to {phoneState.newPhone}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">6-Digit OTP</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="• • • • • •"
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all text-slate-700 dark:text-slate-200"
                                        value={phoneState.otp}
                                        onChange={e => setPhoneState({ ...phoneState, otp: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setPhoneState({ ...phoneState, step: 'form' })} className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest">Back</button>
                                    <button type="submit" disabled={phoneState.loading} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">
                                        Verify & Save
                                    </button>
                                </div>
                            </form>
                        )}

                        {phoneState.step === 'success' && (
                            <div className="text-center py-6 space-y-4 animate-in zoom-in duration-500">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-sm shadow-emerald-500/20">✓</div>
                                <div>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Success!</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Your phone number is now verified.</p>
                                </div>
                                <button onClick={() => setPhoneState({ ...phoneState, step: 'form' })} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline px-4 py-2">Update again</button>
                            </div>
                        )}
                    </div>

                    {/* ── Section: Password Change ── */}
                    <div className="space-y-6 p-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-rose-100 dark:hover:border-rose-900/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600">
                                <HiOutlineLockClosed size={20} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Security</h3>
                        </div>

                        {pwdState.step === 'form' && (
                            <form onSubmit={requestPwdOTP} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPwd ? 'text' : 'password'}
                                                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                                value={pwdState.newPwd}
                                                onChange={e => setPwdState({ ...pwdState, newPwd: e.target.value })}
                                            />
                                            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                {showPwd ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                                value={pwdState.confirmPwd}
                                                onChange={e => setPwdState({ ...pwdState, confirmPwd: e.target.value })}
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                {showConfirm ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={pwdState.loading} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50">
                                    {pwdState.loading ? 'Requesting OTP...' : 'Send Security OTP'}
                                </button>
                                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2 px-4">
                                    A security code will be sent to your registered phone number.
                                </p>
                            </form>
                        )}

                        {pwdState.step === 'otp' && (
                            <form onSubmit={verifyPwdOTP} className="space-y-5">
                                <div className="p-4 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-100/50">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Security OTP Sent</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Please check your registered phone for the 6-digit code.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Enter Security Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="• • • • • •"
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all text-slate-700 dark:text-slate-200"
                                        value={pwdState.otp}
                                        onChange={e => setPwdState({ ...pwdState, otp: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setPwdState({ ...pwdState, step: 'form' })} className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest">Back</button>
                                    <button type="submit" disabled={pwdState.loading} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}

                        {pwdState.step === 'success' && (
                            <div className="text-center py-6 space-y-4 animate-in zoom-in duration-500">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-sm shadow-emerald-500/20">✓</div>
                                <div>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">System Secure</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Your password has been changed successfully.</p>
                                </div>
                                <button onClick={() => setPwdState({ ...pwdState, step: 'form' })} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline px-4 py-2">Update again</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 pt-10 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-center text-slate-300 dark:text-slate-600 font-bold uppercase tracking-[0.3em]">
                        SLIIT Kandy Uni - Staff Security Portal
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffSettings;
