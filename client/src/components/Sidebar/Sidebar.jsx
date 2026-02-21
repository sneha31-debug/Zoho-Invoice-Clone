import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineHome, HiOutlineDocumentText, HiOutlineUsers,
    HiOutlineCube, HiOutlineClipboardList, HiOutlineCreditCard,
    HiOutlineCash, HiOutlineClock, HiOutlineLogout,
    HiOutlineChartBar, HiOutlineCog, HiOutlineReceiptRefund, HiOutlineRefresh,
    HiOutlineUserGroup,
} from 'react-icons/hi';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
    { path: '/invoices', icon: HiOutlineDocumentText, label: 'Invoices' },
    { path: '/customers', icon: HiOutlineUsers, label: 'Customers' },
    { path: '/items', icon: HiOutlineCube, label: 'Items' },
    { path: '/quotes', icon: HiOutlineClipboardList, label: 'Quotes' },
    { path: '/payments', icon: HiOutlineCreditCard, label: 'Payments' },
    { path: '/expenses', icon: HiOutlineCash, label: 'Expenses' },
    { path: '/time-tracking', icon: HiOutlineClock, label: 'Time Tracking' },
    { path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
    { path: '/credit-notes', icon: HiOutlineReceiptRefund, label: 'Credit Notes' },
    { path: '/recurring-invoices', icon: HiOutlineRefresh, label: 'Recurring' },
    { path: '/users', icon: HiOutlineUserGroup, label: 'Users' },
    { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredNavItems = navItems.filter(({ path }) => {
        if (['/users'].includes(path)) return ['ADMIN', 'MANAGER'].includes(user?.role);
        // Settings can stay but maybe restricted inside? Let's leave for now as it contains profile too.
        return true;
    });

    const getLogoUrl = (logo) => {
        if (!logo) return null;
        if (logo.startsWith('http')) return logo;
        return `${import.meta.env.VITE_API_BASE || ''}${logo}`;
    };

    const logoUrl = getLogoUrl(user?.organization?.logo);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-logo-img" style={{ background: logoUrl ? 'white' : 'transparent' }}>
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <div className="logo-premium-z sm">Z</div>
                    )}
                </div>
                <div className="brand-text">
                    <span className="brand-name">Zoho Invoice</span>
                    <span className="brand-org">{user?.organization?.name || 'My Organization'}</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {filteredNavItems.map(({ path, icon: Icon, label }) => (
                    <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}</div>
                    <div className="user-details">
                        <span className="user-name">{user?.firstName} {user?.lastName}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Logout">
                    <HiOutlineLogout size={20} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
