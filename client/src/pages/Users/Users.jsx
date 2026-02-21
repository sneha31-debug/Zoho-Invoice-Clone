import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineUserGroup } from 'react-icons/hi';
import toast from 'react-hot-toast';

const roles = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER'];

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'STAFF' });

    const fetchUsers = async () => {
        try {
            const res = await authAPI.getUsers();
            setUsers(res.data.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await authAPI.inviteUser(form);
            toast.success('User invited');
            setShowModal(false);
            setForm({ email: '', password: '', firstName: '', lastName: '', role: 'STAFF' });
            fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to invite user'); }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await authAPI.updateUser(userId, { role: newRole });
            toast.success('Role updated');
            fetchUsers();
        } catch (err) { toast.error('Failed to update role'); }
    };

    const toggleActive = async (user) => {
        try {
            await authAPI.updateUser(user.id, { isActive: !user.isActive });
            toast.success(user.isActive ? 'User deactivated' : 'User activated');
            fetchUsers();
        } catch (err) { toast.error('Failed to update'); }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1><HiOutlineUserGroup style={{ marginRight: 8 }} /> Users & Roles</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> Invite User</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                                    <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td>
                                        <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', color: 'var(--text-primary)', fontSize: 13 }}>
                                            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleActive(u)}>
                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Invite New User</h2>
                        <form onSubmit={handleInvite}>
                            <div className="form-row">
                                <div className="form-group"><label>First Name *</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
                                <div className="form-group"><label>Last Name *</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
                            </div>
                            <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                            <div className="form-group"><label>Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
                            <div className="form-group">
                                <label>Role</label>
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
