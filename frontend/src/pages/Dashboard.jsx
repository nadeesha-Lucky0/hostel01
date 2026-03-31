import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { HiOutlineBuildingOffice2, HiOutlineUsers, HiOutlineClipboardDocumentCheck, HiOutlineChartBar, HiOutlineClock, HiOutlineHome, HiOutlineMegaphone, HiOutlinePlus } from 'react-icons/hi2'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const STATS = [
    { key: 'totalRooms', label: 'Total Rooms', subKey: 'activeRooms', subLabel: 'Active', icon: HiOutlineBuildingOffice2, bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/30' },
    { key: 'occupancyRate', label: 'Occupancy', suffix: '%', subKey: 'occupiedBeds', subKey2: 'totalBeds', icon: HiOutlineChartBar, bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
    { key: 'pendingApplications', label: 'Pending', subLabel: 'Awaiting Review', icon: HiOutlineClock, bg: 'bg-[#FAB95B]', shadow: 'shadow-[#FAB95B]/30' },
    { key: 'readyToAllocate', label: 'Ready', subLabel: 'Approved & Paid', icon: HiOutlineUsers, bg: 'bg-cyan-500', shadow: 'shadow-cyan-500/30' },
    { key: 'totalAllocations', label: 'Allocated', subLabel: 'This Year', icon: HiOutlineClipboardDocumentCheck, bg: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
    { key: 'availableBeds', label: 'Available Beds', subLabel: 'Ready', icon: HiOutlineHome, bg: 'bg-violet-500', shadow: 'shadow-violet-500/30' },
]

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [notices, setNotices] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')

    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        loadStats()
        const params = new URLSearchParams(location.search)
        if (params.get('tab')) setActiveTab(params.get('tab'))
    }, [location.search])

    const loadStats = async () => {
        try {
            const [statsData, noticesData] = await Promise.all([
                api.getStats(),
                api.getNotices()
            ])
            setStats(statsData)
            if (noticesData.success) setNotices(noticesData.data.slice(0, 3))
        } catch (err) {
            console.error('Failed to load stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="animate-fade-in space-y-6">
                <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Data Available</h3>
                <p>Start by adding floors and rooms in Room Management</p>
            </div>
        )
    }

    const getWingData = () => {
        if (activeTab === 'male') return stats.maleStats
        if (activeTab === 'female') return stats.femaleStats
        return stats
    }

    const getFloorStats = () => {
        if (!stats.floorStats) return []
        if (activeTab === 'male') return stats.floorStats.filter(f => f.wing === 'male')
        if (activeTab === 'female') return stats.floorStats.filter(f => f.wing === 'female')
        return stats.floorStats
    }

    const wingData = getWingData()
    const floorData = getFloorStats()

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 mb-8 text-white" style={{ background: '#1A3263', boxShadow: '0 20px 60px rgba(26, 50, 99, 0.3)' }}>
                {/* Decorative */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/[0.06]" />
                <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/[0.04]" />
                <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/[0.03]" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[11px] font-bold mb-4 backdrop-blur-sm border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                            SYSTEM ONLINE
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">SLIIT Kandy UNI</h2>
                        <div className="text-xl font-bold text-[#FAB95B] mb-2">Hostel Management System</div>
                        <p className="text-white/70 text-[15px] max-w-md leading-relaxed">
                            Monitor hostel occupancy, manage applications, and track allocations.{' '}
                            {wingData.pendingApplications > 0 && (
                                <strong className="text-white underline decoration-pink-400 decoration-2 underline-offset-2">
                                    {wingData.pendingApplications} pending applications
                                </strong>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Wing Tabs */}
                        <div className="flex gap-1 p-1 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                            {[
                                { key: 'all', label: 'All Wings' },
                                { key: 'male', label: 'Male' },
                                { key: 'female', label: 'Female' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer border-none ${activeTab === tab.key
                                        ? 'shadow-lg'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                        }`}
                                    style={activeTab === tab.key ? { background: '#FAB95B', color: '#1A3263' } : {}}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}

                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                        {STATS.map((cfg, i) => {
                            let value = wingData[cfg.key] ?? 0
                            if (cfg.suffix) value = `${value}${cfg.suffix}`
                            let sub = cfg.subLabel || ''
                            if (cfg.subKey && cfg.subKey2) {
                                sub = `${wingData[cfg.subKey] ?? 0}/${wingData[cfg.subKey2] ?? 0} Beds`
                            } else if (cfg.subKey) {
                                sub = `${wingData[cfg.subKey] ?? 0} ${cfg.subLabel}`
                            }

                            return (
                                <div key={i} className="stat-card group">
                                    <div className="flex justify-between items-start">
                                        <div className={`stat-icon ${cfg.bg} ${cfg.shadow}`}>
                                            <cfg.icon />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="stat-value">{value}</div>
                                    <div className="stat-label">{sub}</div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Floor Occupancy + Wing Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Floor Occupancy */}
                        <div className="card lg:col-span-2" style={{ marginBottom: 0 }}>
                            <div className="card-header">
                                <h3>Floor Occupancy</h3>
                                <span className="badge badge-neutral">
                                    {activeTab === 'male' ? 'Male Wing' : activeTab === 'female' ? 'Female Wing' : 'All Wings'}
                                </span>
                            </div>
                            <div className="card-body space-y-5">
                                {floorData.length > 0 ? floorData.map((fs, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-2 text-[13px]">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${fs.wing === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                                                Floor {fs.floorNumber}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                <strong className="text-slate-700 dark:text-slate-200">{fs.occupancyRate}%</strong>
                                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                                {fs.occupiedBeds}/{fs.totalBeds} beds
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${fs.occupancyRate >= 90 ? 'bg-red-400' :
                                                    fs.occupancyRate >= 70 ? 'bg-emerald-400' : 'bg-indigo-400'
                                                    }`}
                                                style={{ width: `${fs.occupancyRate}%` }}
                                            />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-slate-400 italic text-sm">No floor data available</div>
                                )}
                            </div>
                        </div>

                        {/* Wing Comparison */}
                        {activeTab === 'all' && (
                            <div className="card" style={{ marginBottom: 0 }}>
                                <div className="card-header"><h3>Wing Comparison</h3></div>
                                <div className="p-0">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Metric</th>
                                                <th className="text-center">♂</th>
                                                <th className="text-center">♀</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                ['Rooms', stats.maleStats?.totalRooms, stats.femaleStats?.totalRooms],
                                                ['Beds', stats.maleStats?.totalBeds, stats.femaleStats?.totalBeds],
                                                ['Occupied', stats.maleStats?.occupiedBeds, stats.femaleStats?.occupiedBeds],
                                            ].map(([label, m, f]) => (
                                                <tr key={label}>
                                                    <td className="font-semibold">{label}</td>
                                                    <td className="text-center">{m ?? 0}</td>
                                                    <td className="text-center">{f ?? 0}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td className="font-semibold">Occupancy</td>
                                                <td className="text-center"><span className="badge badge-info">{stats.maleStats?.occupancyRate ?? 0}%</span></td>
                                                <td className="text-center"><span className="badge badge-danger">{stats.femaleStats?.occupancyRate ?? 0}%</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <div className="card-header border-b border-slate-50 pb-4 mb-4">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FAB95B]/10 text-[#FAB95B] flex items-center justify-center text-xl shadow-sm">
                                            <HiOutlineMegaphone />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800">Latest Notices</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {notices.length > 0 ? notices.map((notice, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{notice.title}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize">{new Date(notice.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{notice.content}</p>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center">
                                        <HiOutlineMegaphone className="text-4xl text-slate-100 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active notices</p>
                                    </div>
                                )}

                                <Link
                                    to="/notices"
                                    className="block text-center py-3 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border-t border-slate-100 dark:border-slate-800 mt-2 transition-colors"
                                >
                                    View All Notices
                                </Link>
                            </div>
                        </div>
                    </div>
                </>

        </div>
    );
}
