import { useState, useEffect } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { HiOutlineDocumentArrowDown, HiOutlineFunnel, HiPencil, HiTrash, HiXMark } from 'react-icons/hi2'
import ConfirmModal from '../components/ConfirmModal'


export default function Records() {
    const [allocations, setAllocations] = useState([])
    const [degrees, setDegrees] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ wing: '', floorNumber: '', roomType: '', degree: '', fromDate: '', toDate: '' })

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [activeModalTab, setActiveModalTab] = useState('details') // 'details' or 'reassign'
    const [editingAllocation, setEditingAllocation] = useState(null)
    const [editFloors, setEditFloors] = useState([])
    const [editRooms, setEditRooms] = useState([])
    const [selectedFloorId, setSelectedFloorId] = useState('')
    const [selectedRoomId, setSelectedRoomId] = useState('')
    const [selectedBedId, setSelectedBedId] = useState('')
    const [updating, setUpdating] = useState(false)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null, title: '', message: '', onConfirm: () => { } })
    useEffect(() => {
        loadAllocations()
        loadDegrees()
    }, [])

    const loadDegrees = async () => {
        try {
            const data = await api.getDegrees()
            setDegrees(data)
        } catch (err) {
            console.error('Failed to load degrees:', err)
        }
    }

    const loadAllocations = async (f = filters) => {
        try {
            setLoading(true)
            const params = {}
            Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v })
            const data = await api.getAllocations(params)
            setAllocations(data)
        } catch { toast.error('Failed to load records') }
        finally { setLoading(false) }
    }

    const applyFilters = () => loadAllocations(filters)
    const clearFilters = () => { const c = { wing: '', floorNumber: '', roomType: '', degree: '', fromDate: '', toDate: '' }; setFilters(c); loadAllocations(c) }

    const handleDelete = (id, studentName) => {
        setConfirmModal({
            isOpen: true,
            data: { id, studentName },
            title: 'Delete Allocation',
            message: `Are you sure you want to delete allocation for ${studentName}? This will free up the bed.`,
            onConfirm: () => executeDelete(id)
        })
    }

    const executeDelete = async (id) => {
        try {
            await api.deleteAllocation(id)
            toast.success('Allocation deleted successfully')
            loadAllocations()
            setConfirmModal({ isOpen: false, data: null, title: '', message: '', onConfirm: () => { } }) // Close modal after action
        } catch (err) { toast.error(err.message) }
    }

    const openEditModal = async (allocation) => {
        setEditingAllocation(allocation)
        setIsEditModalOpen(true)
        setActiveModalTab('details')
        setSelectedBedId(allocation.bedId)

        try {
            const floors = await api.getFloors(allocation.wing)
            const activeFloors = floors.filter(f => f.isactive)
            setEditFloors(activeFloors)

            // Find current floor ID
            const currentFloor = activeFloors.find(f => f.floorNumber === allocation.floorNumber)
            if (currentFloor) {
                setSelectedFloorId(currentFloor._id)
                await loadEditRooms(currentFloor._id, allocation)
            }
        } catch (err) { toast.error('Failed to load floor data') }
    }

    const loadEditRooms = async (floorId, currentAlloc = editingAllocation) => {
        try {
            const rooms = await api.getRooms({ floor: floorId })
            setEditRooms(rooms)
            const currentRoom = rooms.find(r => r.roomnumber === (currentAlloc?.roomnumber || editingAllocation?.roomnumber))
            if (currentRoom) setSelectedRoomId(currentRoom._id)
            else setSelectedRoomId('')
        } catch (err) { toast.error('Failed to load rooms') }
    }

    const handleFloorChange = async (floorId) => {
        setSelectedFloorId(floorId)
        setSelectedRoomId('')
        setSelectedBedId('')
        await loadEditRooms(floorId)
    }

    const handleUpdate = async () => {
        if (!selectedRoomId || !selectedBedId) return toast.error('Please select both room and bed')
        try {
            setUpdating(true)
            await api.updateAllocation(editingAllocation._id, {
                roomId: selectedRoomId,
                bedId: selectedBedId
            })
            toast.success('Allocation updated successfully')
            setIsEditModalOpen(false)
            loadAllocations()
        } catch (err) { toast.error(err.message) }
        finally { setUpdating(false) }
    }

    const handleExport = (fmt) => {
        const params = {}
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
        window.open(api.getExportUrl(fmt, params), '_blank')
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h2 className="dark:text-white">Records & Reports</h2>
                <p className="dark:text-slate-400">View allocation records with advanced filtering and export</p>
            </div>

            <div className="filter-bar">
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">Wing</label>
                    <select className="form-select dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" value={filters.wing} onChange={e => setFilters({ ...filters, wing: e.target.value })}>
                        <option value="">All Wings</option>
                        <option value="male">♂ Male</option>
                        <option value="female">♀ Female</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">Floor</label>
                    <select className="form-select dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" value={filters.floorNumber} onChange={e => setFilters({ ...filters, floorNumber: e.target.value })}>
                        <option value="">All</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Floor {n}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">Type</label>
                    <select className="form-select dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" value={filters.roomType} onChange={e => setFilters({ ...filters, roomType: e.target.value })}>
                        <option value="">All</option>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">Degree</label>
                    <select className="form-select dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" value={filters.degree} onChange={e => setFilters({ ...filters, degree: e.target.value })}>
                        <option value="">All</option>
                        {degrees.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">From</label>
                    <input type="date" className="form-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label dark:text-slate-300">To</label>
                    <input type="date" className="form-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
                </div>
                <div className="form-group flex gap-2 items-end">
                    <button className="btn btn-primary btn-sm" onClick={applyFilters}><HiOutlineFunnel /> Apply</button>
                    <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
                </div>
            </div>

            <div className="export-bar py-4">
                <button className="btn btn-secondary btn-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700" onClick={() => handleExport('csv')}><HiOutlineDocumentArrowDown /> CSV</button>
                <button className="btn btn-secondary btn-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700" onClick={() => handleExport('pdf')}><HiOutlineDocumentArrowDown /> PDF</button>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold ml-2">
                    {allocations.length} record{allocations.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="card dark:bg-slate-900 dark:border-slate-800" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th className="dark:text-slate-300">Student</th>
                                <th className="dark:text-slate-300">Degree</th>
                                <th className="dark:text-slate-300">Wing</th>
                                <th className="dark:text-slate-300">Floor</th>
                                <th className="dark:text-slate-300">Room</th>
                                <th className="dark:text-slate-300">Type</th>
                                <th className="dark:text-slate-300">Bed</th>
                                <th className="dark:text-slate-300">Refundable Payment</th>
                                <th className="dark:text-slate-300">Date</th>
                                <th className="text-right dark:text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" className="text-center py-16 text-slate-400">Loading...</td></tr>
                            ) : allocations.length === 0 ? (
                                <tr><td colSpan="9" className="text-center py-16 text-slate-400">No records found</td></tr>
                            ) : allocations.map(a => (
                                <tr key={a._id}>
                                    <td>
                                        <div>
                                            <div className="font-bold text-[13px] text-slate-800 dark:text-slate-200">{a.studentName}</div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-400">{a.studentRollNumber}</div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{a.studentDegree}</span></td>
                                    <td><span className={`badge ${a.wing === 'male' ? 'badge-info' : 'badge-neutral'}`}>{a.wing === 'male' ? 'Male' : 'Female'}</span></td>
                                    <td className="font-semibold dark:text-slate-200">Floor {a.floorNumber}</td>
                                    <td className="font-bold text-slate-800 dark:text-slate-200">Room {a.roomnumber}</td>
                                    <td className="dark:text-slate-300">{a.roomType}</td>
                                    <td className="dark:text-slate-300"><span className="badge badge-info">Bed {a.id || a.bedId}</span></td>
                                    <td className="dark:text-slate-300">
                                        <span className={`badge ${a.paymentStatus === 'success' ? 'badge-success' :
                                            a.paymentStatus === 'rejected' ? 'badge-rejected' : 'badge-warning'
                                            }`}>
                                            {a.paymentStatus === 'success' ? 'Paid' : a.paymentStatus === 'rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="text-slate-400 dark:text-slate-400">{new Date(a.allocatedAt).toLocaleDateString()}</td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="btn btn-ghost btn-xs text-[#FAB95B]" onClick={() => openEditModal(a)}><HiPencil /></button>
                                            <button className="btn btn-ghost btn-xs text-rose-500" onClick={() => handleDelete(a._id, a.studentName)}><HiTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Allocation Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal dark:bg-slate-900 border dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className="modal-header border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Update Allocation</h3>
                                <p className="text-xs text-slate-400 font-medium">Manage student record and room assignment</p>
                            </div>
                            <button className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-400 dark:text-slate-500" onClick={() => setIsEditModalOpen(false)}><HiXMark className="text-xl" /></button>
                        </div>

                        <div className="modal-body py-6 space-y-8 max-h-[70vh] overflow-y-auto">
                            {/* Centered Profile Section */}
                            <div className="profile-centered">
                                <div className="name dark:text-white">{editingAllocation?.studentName}</div>
                                <div className="email dark:text-slate-400">{editingAllocation?.studentEmail}</div>
                            </div>

                            {/* Info Cards Grid */}
                            <div className="student-detail-grid">
                                {[
                                    ['Roll Number', editingAllocation?.studentRollNumber],
                                    ['Degree', editingAllocation?.studentDegree],
                                    ['Year', `Year ${editingAllocation?.studentYear}`],
                                    ['Wing', editingAllocation?.wing === 'male' ? '♂ Male Wing' : '♀ Female Wing'],
                                    ['Phone', '—'],
                                    ['Applied', editingAllocation?.allocatedAt ? new Date(editingAllocation.allocatedAt).toLocaleDateString() : '—'],
                                    ['Current Room', `Room ${editingAllocation?.roomnumber}`],
                                    ['Current Bed', `Bed ${editingAllocation?.bedId}`],
                                    ['Guardian', '—'],
                                    ['Guardian Phone', '—'],
                                ].map(([label, val]) => (
                                    <div key={label} className="detail-item dark:bg-slate-800/50 dark:border-slate-700">
                                        <div className="detail-label dark:text-slate-400">{label}</div>
                                        <div className="detail-value dark:text-slate-200">{val}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Reassignment Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col items-center mb-2">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-1">Target Room Assignment</div>
                                    <div className="text-xs text-slate-400">Select new location for this student</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Target Floor</label>
                                        <select className="form-select h-12 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-primary/20" value={selectedFloorId} onChange={e => handleFloorChange(e.target.value)}>
                                            <option value="">Select Floor</option>
                                            {editFloors.map(f => (
                                                <option key={f._id} value={f._id}>Floor {f.floorNumber} ({f.floorID})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Target Room</label>
                                        <select className="form-select h-12 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-primary/20" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} disabled={!selectedFloorId}>
                                            <option value="">Select Room</option>
                                            {editRooms.map(r => (
                                                <option key={r._id} value={r._id}>Room {r.roomnumber} ({r.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {selectedRoomId && (
                                    <div className="space-y-3">
                                        <label className="form-label text-xs font-bold uppercase tracking-wider text-slate-500">Select Available Bed</label>
                                        <div className="flex gap-4">
                                            {['A', 'B'].map((bid) => {
                                                const roomData = editRooms.find(r => r._id === selectedRoomId)
                                                const bedData = roomData?.beds.find(b => b.bedId === bid)

                                                if (bid === 'B' && roomData?.type === 'single') return null

                                                // Robust occupancy check using stringified IDs
                                                const isCurrentlyOccupied = bedData?.isOccupied && String(bedData?.student) !== String(editingAllocation?.student)
                                                const isStudentOwnBed = String(bedData?.student) === String(editingAllocation?.student)
                                                const isSelected = selectedBedId === bid

                                                return (
                                                    <div
                                                        key={bid}
                                                        onClick={() => !isCurrentlyOccupied && setSelectedBedId(bid)}
                                                        className={`relative flex-1 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${isSelected
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-4 ring-indigo-500/10'
                                                            : isCurrentlyOccupied
                                                                ? 'border-slate-100 dark:border-slate-800 opacity-40 grayscale cursor-not-allowed bg-slate-50 dark:bg-slate-900/30'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                                {bid}
                                                            </div>
                                                            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                                                                {isCurrentlyOccupied ? 'Occupied' : isStudentOwnBed ? `Bed ${bid} (Current)` : `Bed ${bid}`}
                                                            </span>
                                                            <div className={`w-2 h-2 rounded-full mt-1 ${isSelected ? 'bg-indigo-500 animate-pulse' : isCurrentlyOccupied ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
                                                        </div>
                                                        {isStudentOwnBed && !isSelected && <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[8px] font-bold rounded-full border border-indigo-500/20">CURRENT</div>}
                                                        {isSelected && <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</div>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Centered Payment Section */}
                            <div className="text-center pt-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Verified Refundable Payment Status</div>
                                <div className={`badge ${editingAllocation?.paymentStatus === 'success' ? 'badge-success' :
                                    editingAllocation?.paymentStatus === 'rejected' ? 'badge-rejected' : 'badge-warning'
                                    } py-2 px-6 text-[12px] shadow-sm`}>
                                    {editingAllocation?.paymentStatus === 'success' ? 'Paid' :
                                        editingAllocation?.paymentStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer border-t border-slate-100 dark:border-slate-800 pt-4">
                            <button className="btn btn-ghost h-12 px-6 rounded-xl font-bold" onClick={() => setIsEditModalOpen(false)}>Close</button>
                            <button
                                className="btn btn-primary h-12 px-8 rounded-xl font-bold shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transform transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
                                onClick={handleUpdate}
                                disabled={updating || !selectedRoomId || !selectedBedId}
                            >
                                {updating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving Changes...</span>
                                    </div>
                                ) : 'Save New Allocation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    )
}
