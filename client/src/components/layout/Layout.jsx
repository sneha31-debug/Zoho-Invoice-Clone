import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import NotificationBell from '../NotificationBell/NotificationBell';
import './Layout.css';

const Layout = () => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <div className="loading-spinner" style={{ marginTop: '40vh' }} />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="top-bar">
                    <div />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <NotificationBell />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.firstName} {user?.lastName}</span>
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
