import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { HiOutlineEye, HiOutlineCurrencyDollar, HiOutlineArrowRight, HiOutlineMagnifyingGlass, HiXMark } from 'react-icons/hi2'

export default function StudentApplications({ setAllocatingStudent }) {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewingStudent, setViewingStudent] = useState(null)
    const [search, setSearch] = useState('')
    const [filterPayment, setFilterPayment] = useState('')
    const [filterWing, setFilterWing] = useState('')
    const navigate = useNavigate()

    useEffect(() => { loadStudents() }, [filterPayment, filterWing])

    const loadStudents = async () => {
        try {
            setLoading(true)
            const params = {}
            if (filterPayment) params.paymentStatus = filterPayment
            if (filterWing) params.wing = filterWing
            const data = await api.getStudents(params)
            setStudents(data)
        } catch (err) {
            toast.error('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    const handleAllocate = (student) => {
        setAllocatingStudent(student)
        toast.success(`Redirecting to Room Allocation for ${student.name}...`)
        navigate('/room-management', { state: { tab: 'allocation' } })
    }

    const handleUpdatePayment = async (studentId, status) => {
        try {
            await api.updatePayment(studentId, status)
            toast.success(`Payment marked as "${status}"`)
            loadStudents()
            if (viewingStudent?._id === studentId) {
                const updated = await api.getStudent(studentId)
                setViewingStudent(updated)
            }
        } catch (err) {
            toast.error(err.message)
        }
    }

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.degree?.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(search.toLowerCase())
    )

    const payBadge = (status) => {
        if (status === 'success') return <span className="badge badge-success">Paid</span>
        if (status === 'failed') return <span className="badge badge-danger">Failed</span>
        if (status === 'rejected') return <span className="badge badge-rejected">Rejected</span>
        return <span className="badge badge-warning">Pending</span>
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h2 className="dark:text-white">Student Allocations</h2>
                <p className="dark:text-slate-400">Review and manage student room allocations</p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar dark:bg-slate-800/50 dark:border-slate-700">
                <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label dark:text-slate-300">Search</label>
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        <input
                            className="form-input pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                            placeholder="Search by name, email, degree, roll number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">Payment</label>
                    <select className="form-select dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="success">Verified</option>
                        <option value="failed">Failed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">Wing</label>
                    <select className="form-select dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={filterWing} onChange={e => setFilterWing(e.target.value)}>
                        <option value="">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card dark:bg-slate-900 dark:border-slate-800" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Roll No.</th>
                                <th>Degree</th>
                                <th>Year</th>
                                <th>Wing</th>
                                <th>Refundable Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center py-16 text-slate-400">Loading allocations...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-16 text-slate-400">No allocations found</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s._id} className="clickable-row" onClick={() => setViewingStudent(s)}>
                                    <td>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">{s.name}</div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-400">{s.email}</div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{s.rollNumber}</span></td>
                                    <td className="font-medium">{s.degree}</td>
                                    <td>{s.year}</td>
                                    <td><span className={`badge ${s.wing === 'male' ? 'badge-info' : 'badge-neutral'}`}>{s.wing === 'male' ? 'Male' : 'Female'}</span></td>
                                    <td>{payBadge(s.paymentStatus)}</td>
                                    <td>{s.isAllocated ? <span className="badge badge-success">Allocated</span> : <span className="badge badge-warning">Pending</span>}</td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1.5">
                                            <button className="btn btn-ghost btn-xs" onClick={() => setViewingStudent(s)}><HiOutlineEye /></button>
                                            <button
                                                className="btn btn-xs bg-[#FAB95B] text-[#1A3263] border-none hover:bg-[#e5a84d] font-bold px-3"
                                                disabled={s.paymentStatus !== 'success' || s.isAllocated}
                                                onClick={() => handleAllocate(s)}
                                            >
                                                <HiOutlineArrowRight /> Allocate
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {viewingStudent && (
                <div className="modal-overlay" onClick={() => setViewingStudent(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Student Details</h3>
                                <p className="text-xs text-slate-400 font-medium">Review application information</p>
                            </div>
                            <button className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-400 dark:text-slate-500" onClick={() => setViewingStudent(null)}>
                                <HiXMark className="text-xl" />
                            </button>
                        </div>

                        <div className="modal-body py-6 space-y-8 max-h-[70vh] overflow-y-auto">
                            {/* Avatar/Profile Section */}
                            <div className="profile-centered py-0">
                                <div className="name dark:text-white">{viewingStudent.name}</div>
                                <div className="email dark:text-slate-400">{viewingStudent.email}</div>
                            </div>

                            <div className="student-detail-grid">
                                {[
                                    ['Roll Number', viewingStudent.rollNumber],
                                    ['Degree', viewingStudent.degree],
                                    ['Year', `Year ${viewingStudent.year}`],
                                    ['Wing', viewingStudent.wing === 'male' ? 'Male' : 'Female'],
                                    ['Phone', viewingStudent.phone],
                                    ['Applied', viewingStudent.applicationDate ? new Date(viewingStudent.applicationDate).toLocaleDateString() : '—'],
                                    ['Guardian', viewingStudent.guardianName],
                                    ['Guardian Phone', viewingStudent.guardianPhone],
                                ].map(([label, val]) => (
                                    <div key={label} className="detail-item dark:bg-slate-800/50 dark:border-slate-700">
                                        <div className="detail-label dark:text-slate-400">{label}</div>
                                        <div className="detail-value dark:text-slate-200">{val || '—'}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center px-6 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Refundable Payment Status</div>
                                {payBadge(viewingStudent.paymentStatus)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
