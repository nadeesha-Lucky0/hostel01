import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    HiOutlineHome,
    HiOutlineClipboardDocumentList,
    HiOutlineCurrencyDollar,
    HiOutlineChatBubbleLeftRight,
    HiOutlineArrowRightOnRectangle,
    HiOutlineUser,
    HiOutlineMegaphone,
    HiOutlineMoon,
    HiOutlineSun,
    HiOutlineMapPin,
    HiOutlineBars3,
    HiOutlineXMark
} from 'react-icons/hi2';
import logo from '../assets/idHsN22NWk_logos.png';
import { useAuth } from '../context/AuthContext';

const StudentNavigationBar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchUnread = async () => {
            if (!user?.token) return;
            try {
                const res = await fetch('/api/complaints/unread-counts', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setUnreadCount(data.data.studentUnread || 0);
                }
            } catch (err) {
                console.error('Error fetching unread count:', err);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 2000); // Poll every 2s // Poll every 30 seconds
        
        const handleRefresh = () => fetchUnread();
        window.addEventListener('nmh_unread_refresh', handleRefresh);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('nmh_unread_refresh', handleRefresh);
        };
    }, [user?.token]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

    const navItems = [
        { to: '/student', icon: HiOutlineHome, label: 'Dashboard' },
        { to: '/student/in-out', icon: HiOutlineMapPin, label: 'In & Out' },
        { to: '/student/applications', icon: HiOutlineClipboardDocumentList, label: 'Applications' },
        { to: '/student/payments', icon: HiOutlineCurrencyDollar, label: 'Payments' },
        { to: '/student/chats', icon: HiOutlineChatBubbleLeftRight, label: 'Complaints', badge: unreadCount }
    ];

    return (
        <header className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <div className="nav-logo-section">
                    <img src={logo} alt="SLIIT" className="nav-logo-img" />
                    <div className="hidden sm:block">
                        <div className="nav-title">SLIIT Kandy <span className="text-[#FAB95B]">UNI</span></div>
                        <div className="nav-subtitle text-white/40">Student Portal</div>
                    </div>
                </div>

                <nav className="nav-links hidden md:flex">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-link relative ${isActive ? 'active' : ''}`}
                            end
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
                    <div className="user-profile hidden lg:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-right">
                            <div className="text-[11px] font-black text-white leading-none capitalize">{user?.name || 'Student'}</div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[#FAB95B] flex items-center justify-center text-[#1A3263] font-black text-xs overflow-hidden">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (user?.name?.charAt(0) || 'S').toUpperCase()
                            )}
                        </div>
                    </div>

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
                            <div className="text-lg font-black text-white tracking-tight">Student Portal</div>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                            <HiOutlineXMark className="text-2xl" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {navItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) => `flex items-center gap-4 px-6 py-4 transition-all ${isActive ? 'bg-[#FAB95B] text-[#1A3263]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                end
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

                    <div className="p-6 border-t border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FAB95B] flex items-center justify-center text-[#1A3263] font-black overflow-hidden">
                                {user?.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-black text-white truncate">{user?.name}</div>
                                <div className="text-[10px] font-bold text-indigo-300/50 truncate uppercase tracking-wider">Student</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setIsMenuOpen(false); logout(); }}
                            className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 transition-all text-rose-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <HiOutlineArrowRightOnRectangle className="text-lg" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default StudentNavigationBar;
