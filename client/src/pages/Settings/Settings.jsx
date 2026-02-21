import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, organizationAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [org, setOrg] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', taxId: '', currency: 'USD', website: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '' });
            if (user.organization) {
                setOrg({
                    name: user.organization.name || '',
                    email: user.organization.email || '',
                    phone: user.organization.phone || '',
                    address: user.organization.address || '',
                    city: user.organization.city || '',
                    state: user.organization.state || '',
                    zipCode: user.organization.zipCode || '',
                    country: user.organization.country || '',
                    taxId: user.organization.taxId || '',
                    currency: user.organization.currency || 'USD',
                    website: user.organization.website || '',
                });
            }
        }
    }, [user]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await authAPI.updateProfile(profile);
            toast.success('Profile updated');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
        setSaving(false);
    };

    const handleOrgSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await authAPI.updateOrg(org);
            toast.success('Organization updated');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
        setSaving(false);
    };

    const tabs = [
        { key: 'profile', label: 'Profile' },
        { key: 'organization', label: 'Organization' },
        { key: 'preferences', label: 'Preferences' },
    ];

    return (
        <div className="fade-in">
            <div className="page-header"><h1>Settings</h1></div>

            <div className="settings-layout">
                <div className="settings-sidebar">
                    {tabs.map((t) => (
                        <button key={t.key} className={`settings-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="card settings-card">
                            <h2>Profile Settings</h2>
                            <p className="settings-desc">Manage your personal information</p>
                            <form onSubmit={handleProfileSave}>
                                <div className="form-row">
                                    <div className="form-group"><label>First Name</label><input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></div>
                                    <div className="form-group"><label>Last Name</label><input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Email</label><input type="email" value={profile.email} disabled className="input-disabled" /></div>
                                    <div className="form-group"><label>Phone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label>Role</label><input value={user?.role || ''} disabled className="input-disabled" /></div>
                                <div className="settings-actions"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button></div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <div className="card settings-card">
                            <h2>Organization Settings</h2>
                            <p className="settings-desc">Manage your company information</p>

                            <div className="logo-upload-section">
                                <div className="logo-preview">
                                    {org.logo ? (
                                        <img src={org.logo.startsWith('http') ? org.logo : `${import.meta.env.VITE_API_BASE || ''}${org.logo}`} alt="Logo" />
                                    ) : (
                                        <div className="logo-placeholder">Z</div>
                                    )}
                                </div>
                                <div className="logo-actions">
                                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                        Change Logo
                                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('logo', file);
                                            try {
                                                const res = await organizationAPI.uploadLogo(formData);
                                                setOrg({ ...org, logo: res.data.data.logo });
                                                toast.success('Logo updated');
                                                // Note: we might need to update AuthContext if logo is there too
                                            } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
                                        }} />
                                    </label>
                                    <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>Recommended: Square image, max 2MB</p>
                                </div>
                            </div>

                            <form onSubmit={handleOrgSave}>
                                <div className="form-row">
                                    <div className="form-group"><label>Organization Name *</label><input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} required /></div>
                                    <div className="form-group"><label>Website</label><input value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} placeholder="https://..." /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Email</label><input type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} /></div>
                                    <div className="form-group"><label>Phone</label><input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label>Address</label><input value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>City</label><input value={org.city} onChange={(e) => setOrg({ ...org, city: e.target.value })} /></div>
                                    <div className="form-group"><label>State</label><input value={org.state} onChange={(e) => setOrg({ ...org, state: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>ZIP Code</label><input value={org.zipCode} onChange={(e) => setOrg({ ...org, zipCode: e.target.value })} /></div>
                                    <div className="form-group"><label>Country</label><input value={org.country} onChange={(e) => setOrg({ ...org, country: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label>Tax ID / GST Number</label><input value={org.taxId} onChange={(e) => setOrg({ ...org, taxId: e.target.value })} placeholder="e.g. GST1234567890" /></div>
                                <div className="settings-actions"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Organization'}</button></div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="card settings-card">
                            <h2>Preferences</h2>
                            <p className="settings-desc">Configure application behavior</p>
                            <div className="form-group">
                                <label>Default Currency</label>
                                <select value={org.currency} onChange={(e) => setOrg({ ...org, currency: e.target.value })}>
                                    <option value="USD">USD — US Dollar</option>
                                    <option value="EUR">EUR — Euro</option>
                                    <option value="GBP">GBP — British Pound</option>
                                    <option value="INR">INR — Indian Rupee</option>
                                    <option value="CAD">CAD — Canadian Dollar</option>
                                    <option value="AUD">AUD — Australian Dollar</option>
                                    <option value="JPY">JPY — Japanese Yen</option>
                                </select>
                            </div>
                            <div className="pref-item">
                                <div><strong>Dark Mode</strong><p className="settings-desc">Currently active (system default)</p></div>
                                <span className="badge badge-success">Active</span>
                            </div>
                            <div className="pref-item">
                                <div><strong>Email Notifications</strong><p className="settings-desc">Receive email alerts for payments</p></div>
                                <span className="badge badge-info">Coming Soon</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
