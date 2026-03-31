import React, { useEffect, useMemo, useState } from 'react';
import { HiOutlineShieldCheck, HiOutlineUserPlus, HiOutlineUsers, HiOutlineExclamationCircle, HiOutlineTrash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
    name: '',
    email: '',
    role: 'warden',
    phoneNumber: '',
    password: ''
};

const roleStyles = {
    admin: 'bg-slate-100 text-slate-700',
    warden: 'bg-amber-100 text-amber-800',
    security: 'bg-emerald-100 text-emerald-800',
    financial: 'bg-indigo-100 text-indigo-800'
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [formData, setFormData] = useState(emptyForm);
    const [staffUsers, setStaffUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const token = user?.token || sessionStorage.getItem('hostel_token');

    const stats = useMemo(() => ({
        total: staffUsers.filter(item => item.role !== 'admin').length,
        wardens: staffUsers.filter(item => item.role === 'warden').length,
        security: staffUsers.filter(item => item.role === 'security').length,
        financial: staffUsers.filter(item => item.role === 'financial').length
    }), [staffUsers]);

    const loadUsers = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to load staff users');
            }

            setStaffUsers(data.data || []);
        } catch (err) {
            toast.error(err.message || 'Failed to load staff users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [token]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;

        try {
            setSaving(true);
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to create user');
            }

            toast.success(data.message || 'User created successfully');
            setFormData(emptyForm);
            setStaffUsers(prev => [data.data, ...prev]);
        } catch (err) {
            toast.error(err.message || 'Failed to create user');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStaff = async (id, name) => {
        if (!confirm(`Are you sure you want to delete staff account for ${name}? This action cannot be undone.`)) return;
        if (!token) return;

        try {
            setDeletingId(id);
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete user');
            }

            toast.success(data.message || 'Staff user deleted successfully');
            setStaffUsers(prev => prev.filter(u => u._id !== id));
        } catch (err) {
            toast.error(err.message || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!token) return;

        try {
            const res = await fetch(`/api/admin/users/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to update status');
            }

            toast.success('User status updated');
            setStaffUsers(prev => prev.map(u => u._id === id ? { ...u, accountStatus: newStatus } : u));
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest mb-4">
                        <HiOutlineShieldCheck className="text-base" />
                        Admin Control Center
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Manage Staff Access</h1>
                    <p className="text-slate-500 font-medium mt-2">Create warden, security, and financial accounts without changing the rest of the hostel system.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Accounts</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">{stats.total}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wardens</div>
                    <div className="text-3xl font-black text-amber-600 mt-3">{stats.wardens}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security</div>
                    <div className="text-3xl font-black text-emerald-600 mt-3">{stats.security}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial</div>
                    <div className="text-3xl font-black text-indigo-600 mt-3">{stats.financial}</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1.1fr,1.4fr] gap-8">
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                            <HiOutlineUserPlus />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Create Staff User</h2>
                            <p className="text-sm text-slate-500 font-medium">Use official staff email addresses and assign the correct role.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</span>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="Nimal Perera"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</span>
                            <select
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="warden">Warden</option>
                                <option value="security">Security</option>
                                <option value="financial">Financial</option>
                            </select>
                        </label>

                        <label className="block space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</span>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="staff@sliit.lk"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</span>
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="0712345678"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</span>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="Set a temporary password"
                            />
                        </label>

                        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 font-medium flex gap-3">
                            <HiOutlineExclamationCircle className="text-xl shrink-0 mt-0.5" />
                            <span>Only staff roles can be created here. Students still use the normal registration flow.</span>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Creating User...' : 'Create User'}
                        </button>
                    </form>
                </section>

                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl">
                            <HiOutlineUsers />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Existing Staff Users</h2>
                            <p className="text-sm text-slate-500 font-medium">A quick view of admin and staff accounts already available in the system.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : staffUsers.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                            No staff users found yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {staffUsers.map(item => (
                                        <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-black text-slate-900 dark:text-white">{item.name}</div>
                                                <div className="text-xs text-slate-500 font-medium mt-1">{item.email}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleStyles[item.role] || roleStyles.admin}`}>
                                                    {item.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 font-medium">{item.phoneNumber || '-'}</td>
                                            <td className="px-4 py-4">
                                                {item._id !== user?.id ? (
                                                    <select
                                                        value={item.accountStatus || 'verified'}
                                                        onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                                                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none outline-none cursor-pointer transition-all ${
                                                            item.accountStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                                                            item.accountStatus === 'suspended' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-amber-50 text-amber-600'
                                                        }`}
                                                    >
                                                        <option value="verified">Verified</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="suspended">Deactivate</option>
                                                    </select>
                                                ) : (
                                                    <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                                                        {item.accountStatus || 'verified'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {item._id !== user?.id ? (
                                                    <button 
                                                        disabled={deletingId === item._id}
                                                        onClick={() => handleDeleteStaff(item._id, item.name)}
                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                                                        title="Delete Staff User"
                                                    >
                                                        <HiOutlineTrash className="text-lg" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest px-2 italic">You</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
