import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { 
    HiOutlineCube, 
    HiOutlinePlus, 
    HiOutlinePencil, 
    HiOutlineTrash, 
    HiOutlineArrowPath, 
    HiOutlineUserPlus,
    HiOutlineCheckCircle,
    HiXMark,
    HiOutlineMagnifyingGlass
} from 'react-icons/hi2';

export default function Resources() {
    const [resources, setResources] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('inventory'); // 'inventory' or 'allocations'
    
    // Modals
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [allocatingResource, setAllocatingResource] = useState(null);
    
    // Form States
    const [formData, setFormData] = useState({ name: '', category: '', status: 'AVAILABLE' });
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resData, allocData, studentData] = await Promise.all([
                api.getResources(),
                api.getResourceAllocations(),
                api.getResourceStudents()
            ]);
            setResources(resData);
            setAllocations(allocData);
            setStudents(studentData);
        } catch (err) {
            toast.error(err.message || 'Failed to load resource data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveResource = async (e) => {
        e.preventDefault();
        try {
            if (editingResource) {
                await api.updateResource(editingResource._id, formData);
                toast.success('Resource updated successfully');
            } else {
                await api.createResource(formData);
                toast.success('Resource created successfully');
            }
            setShowResourceModal(false);
            setEditingResource(null);
            setFormData({ name: '', category: '', status: 'AVAILABLE' });
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteResource = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resource?')) return;
        try {
            await api.deleteResource(id);
            toast.success('Resource deleted');
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        if (!selectedStudentId || !allocatingResource) return;
        try {
            await api.allocateResource({
                resourceId: allocatingResource._id,
                studentId: selectedStudentId
            });
            toast.success('Resource allocated successfully');
            setShowAllocateModal(false);
            setAllocatingResource(null);
            setSelectedStudentId('');
            setStudentSearch('');
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleReturn = async (allocId) => {
        try {
            await api.returnResource(allocId);
            toast.success('Resource returned');
            loadData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.itNumber || s.rollNumber || '').toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-10 space-y-10 w-full animate-fade-in transition-colors">
            <div className="page-header mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hostel <span className="text-indigo-500 italic">Resources</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Track and allocate physical assets to students</p>
                </div>
            </div>

            <div className="space-y-8">
            {/* Header / Sub-Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
                    <button 
                        onClick={() => setView('inventory')}
                        className={`px-6 py-2 rounded-lg text-xs font-black transition-all border-none cursor-pointer ${view === 'inventory' ? 'bg-[#FAB95B] text-[#1A3263] shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Inventory List
                    </button>
                    <button 
                        onClick={() => setView('allocations')}
                        className={`px-6 py-2 rounded-lg text-xs font-black transition-all border-none cursor-pointer ${view === 'allocations' ? 'bg-[#FAB95B] text-[#1A3263] shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Active Allocations
                    </button>
                </div>
                
                {view === 'inventory' && (
                    <button 
                        onClick={() => {
                            setEditingResource(null);
                            setFormData({ name: '', category: '', status: 'AVAILABLE' });
                            setShowResourceModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 border-none cursor-pointer"
                    >
                        <HiOutlinePlus className="text-lg" /> Add New Resource
                    </button>
                )}
            </div>

            {/* Inventory Table */}
            {view === 'inventory' && (
                <div className="card !p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Name</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-400 italic">Scanning database...</td></tr>
                                ) : resources.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-400 italic">No resources found. Start by adding one!</td></tr>
                                ) : resources.map(res => (
                                    <tr key={res._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-5 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                                                <HiOutlineCube className="text-xl" />
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{res.name}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider">{res.category}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`badge ${
                                                res.status === 'AVAILABLE' ? 'badge-success' : 
                                                res.status === 'MAINTENANCE' ? 'badge-danger' : 'badge-warning'
                                            }`}>
                                                {res.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {res.status === 'AVAILABLE' && (
                                                    <button 
                                                        onClick={() => {
                                                            setAllocatingResource(res);
                                                            setShowAllocateModal(true);
                                                        }}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all border-none cursor-pointer"
                                                        title="Allocate to Student"
                                                    >
                                                        <HiOutlineUserPlus className="text-lg" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        setEditingResource(res);
                                                        setFormData({ name: res.name, category: res.category, status: res.status });
                                                        setShowResourceModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all border-none cursor-pointer"
                                                >
                                                    <HiOutlinePencil className="text-lg" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteResource(res._id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all border-none cursor-pointer"
                                                >
                                                    <HiOutlineTrash className="text-lg" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Allocations Table */}
            {view === 'allocations' && (
                <div className="card !p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-400 italic">Scanning allocations...</td></tr>
                                ) : allocations.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-400 italic">No active allocations found.</td></tr>
                                ) : allocations.filter(a => a.status === 'ACTIVE').map(alloc => (
                                    <tr key={alloc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">{alloc.student?.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{alloc.student?.studentId}</div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="font-bold text-indigo-600">{alloc.resource?.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase">{alloc.resource?.category}</div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="text-xs font-bold text-slate-500">{new Date(alloc.allocatedAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => handleReturn(alloc._id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border-none cursor-pointer ml-auto"
                                            >
                                                <HiOutlineCheckCircle className="text-base" /> Return Item
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Resource Modal */}
            {showResourceModal && (
                <div className="modal-overlay" onClick={() => setShowResourceModal(false)}>
                    <div className="modal !max-w-md dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h3>
                            <button className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer" onClick={() => setShowResourceModal(false)}><HiXMark className="text-2xl" /></button>
                        </div>
                        <form onSubmit={handleSaveResource} className="modal-body p-8 space-y-6">
                            <div className="form-group">
                                <label className="form-label font-black">Resource Name</label>
                                <input 
                                    className="form-input" 
                                    placeholder="e.g. Study Desk, Steel Locker" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label font-black">Category</label>
                                <select 
                                    className="form-select font-bold"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Furniture">Furniture</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Linen">Linen</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label font-black">Initial Status</label>
                                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    {['AVAILABLE', 'MAINTENANCE'].map(s => (
                                        <button 
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData({...formData, status: s})}
                                            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all border-none cursor-pointer ${formData.status === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4">
                                <button className="btn btn-primary w-full !h-12 !rounded-xl !font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                                    {editingResource ? 'Update Inventory' : 'Add to Inventory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allocation Modal */}
            {showAllocateModal && (
                <div className="modal-overlay" onClick={() => setShowAllocateModal(false)}>
                    <div className="modal !max-w-md dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Allocate Resource</h3>
                                <p className="text-xs text-indigo-500 font-bold uppercase tracking-tight">Resource: {allocatingResource?.name}</p>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer" onClick={() => setShowAllocateModal(false)}><HiXMark className="text-2xl" /></button>
                        </div>
                        <form onSubmit={handleAllocate} className="modal-body p-8 space-y-6">
                            <div className="form-group">
                                <label className="form-label font-black">Search Student</label>
                                <div className="relative">
                                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        className="form-input pl-10" 
                                        placeholder="Name or ID..." 
                                        value={studentSearch}
                                        onChange={e => {
                                            setStudentSearch(e.target.value);
                                            setSelectedStudentId(''); // Reset selection when searching
                                        }}
                                    />
                                </div>
                                {studentSearch.length > 1 && !selectedStudentId && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                                        {filteredStudents.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-400">No students found</div>
                                        ) : filteredStudents.slice(0, 5).map(s => (
                                            <div 
                                                key={s._id}
                                                onClick={() => {
                                                    setSelectedStudentId(s._id);
                                                    setStudentSearch(s.name);
                                                }}
                                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                            >
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase">{s.studentId}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="pt-4">
                                <button 
                                    className="btn btn-primary w-full !h-12 !rounded-xl !font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                                    disabled={!selectedStudentId}
                                >
                                    Proceed Allocation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
