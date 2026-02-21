import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../services/api';
import { HiOutlineBell } from 'react-icons/hi';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await notificationAPI.getAll();
            setNotifications(res.data.data.notifications);
            setUnreadCount(res.data.data.unreadCount);
        } catch (err) { /* silent */ }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // poll every 60s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMarkAllRead = async () => {
        await notificationAPI.markAllRead();
        fetchNotifications();
    };

    const typeIcon = (type) => {
        switch (type) {
            case 'overdue': return '⚠️';
            case 'payment_received': return '💰';
            case 'reminder': return '🔔';
            default: return '📬';
        }
    };

    return (
        <div className="notification-bell" ref={ref}>
            <button className="bell-btn" onClick={() => setOpen(!open)}>
                <HiOutlineBell size={22} />
                {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="notif-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>}
                    </div>
                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">No notifications</div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className={`notif-item ${n.isRead ? '' : 'unread'}`}>
                                    <span className="notif-icon">{typeIcon(n.type)}</span>
                                    <div className="notif-content">
                                        <p className="notif-title">{n.title}</p>
                                        <p className="notif-message">{n.message}</p>
                                        <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
