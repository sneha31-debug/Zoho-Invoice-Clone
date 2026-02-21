import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

const Layout = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div className="loading-spinner" style={{ marginTop: '40vh' }} />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
