import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { HiOutlineHome, HiOutlineBuildingOffice2, HiOutlineUserGroup, HiOutlineClipboardDocumentList, HiOutlineDocumentChartBar, HiOutlineMoon, HiOutlineSun, HiOutlineChatBubbleLeftRight, HiOutlineMegaphone, HiOutlineUser, HiOutlineArrowRightOnRectangle, HiOutlineArrowsRightLeft, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2'
import logo from '../assets/idHsN22NWk_logos.png'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/room-management', icon: HiOutlineBuildingOffice2, label: 'Floor & Room' },
    { to: '/student-applications', icon: HiOutlineUserGroup, label: 'Allocations' },
    { to: '/records', icon: HiOutlineDocumentChartBar, label: 'Records' },
    { to: '/warden/scan-records', icon: HiOutlineArrowsRightLeft, label: 'In/Out Logs' },
    { to: '/profiles', icon: HiOutlineUser, label: 'Profiles' },
    { to: '/complaints', icon: HiOutlineChatBubbleLeftRight, label: 'Complaints' },
    { to: '/notices', icon: HiOutlineMegaphone, label: 'Notices' }
]

export default function NavigationBar() {
    const location = useLocation()
    const { logout } = useAuth()
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const [unreadCount, setUnreadCount] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                // No token needed for warden routes in this system
                const res = await fetch('/api/complaints/unread-counts')
                const data = await res.json()
                if (data.success) {
                    setUnreadCount(data.data.wardenUnread || 0)
                }
            } catch (err) {
                console.error('Error fetching unread count:', err)
            }
        }

        fetchUnread()
        const interval = setInterval(fetchUnread, 2000) // Poll every 2s

        const handleRefresh = () => fetchUnread()
        window.addEventListener('nmh_unread_refresh', handleRefresh)

        return () => {
            clearInterval(interval)
            window.removeEventListener('nmh_unread_refresh', handleRefresh)
        }
    }, [])

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

    const updatedNavItems = [
        { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
        { to: '/room-management', icon: HiOutlineBuildingOffice2, label: 'Floor & Room' },
        { to: '/student-applications', icon: HiOutlineUserGroup, label: 'Allocations' },
        { to: '/records', icon: HiOutlineDocumentChartBar, label: 'Records' },
        { to: '/warden/scan-records', icon: HiOutlineArrowsRightLeft, label: 'In/Out Logs' },
        { to: '/profiles', icon: HiOutlineUser, label: 'Profiles' },
        { to: '/complaints', icon: HiOutlineChatBubbleLeftRight, label: 'Complaints', badge: unreadCount },
        { to: '/notices', icon: HiOutlineMegaphone, label: 'Notices' }
    ]

    return (
        <header className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <div className="nav-logo-section">
                    <img src={logo} alt="SLIIT Logo" className="nav-logo-img" />
                    <div className="hidden sm:block">
                        <div className="nav-title">SLIIT Kandy <span className="text-[#FAB95B]">UNI</span></div>
                        <div className="nav-subtitle text-white/40">Hostel Management System</div>
                    </div>
                </div>

                <nav className="nav-links hidden md:flex">
                    {updatedNavItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-link relative ${isActive || (item.to !== '/' && location.pathname.startsWith(item.to)) ? 'active' : ''}`
                            }
                            end={item.to === '/'}
                        >
                            <span className="icon">
                                <item.icon />
                            </span>
                            <span className="label text-[13px]">{item.label}</span>
                            {item.badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1.5 bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 z-10 border-2 border-primary dark:border-slate-900 leading-none">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="nav-actions">
                    <button onClick={toggleTheme} className="theme-toggle" title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
                        {theme === 'light' ? <HiOutlineMoon /> : <HiOutlineSun />}
                    </button>
                    <button 
                        onClick={logout} 
                        className="p-2 text-white/60 hover:text-rose-400 transition-colors hidden sm:block" 
                        title="Logout"
                    >
                        <HiOutlineArrowRightOnRectangle className="text-xl" />
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 md:hidden hover:bg-indigo-500/30 transition-all active:scale-95"
                    >
                        {isMenuOpen ? <HiOutlineXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`fixed inset-0 z-[60] md:hidden transition-all duration-500 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Drawer Content */}
                <div className={`absolute top-0 right-0 w-[280px] h-full bg-[#1A3263] dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Menu</div>
                            <div className="text-lg font-black text-white tracking-tight">Warden Portal</div>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                            <HiOutlineXMark className="text-2xl" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {updatedNavItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) => `flex items-center gap-4 px-6 py-4 transition-all ${isActive || (item.to !== '/' && location.pathname.startsWith(item.to)) ? 'bg-[#FAB95B] text-[#1A3263]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                end={item.to === '/'}
                            >
                                <item.icon className="text-xl" />
                                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="ml-auto min-w-[20px] h-[20px] px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    <div className="p-6 border-t border-white/10">
                        <button 
                            onClick={() => { setIsMenuOpen(false); logout(); }}
                            className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 transition-all text-rose-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <HiOutlineArrowRightOnRectangle className="text-lg" />
                            Logout Staff Portal
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
