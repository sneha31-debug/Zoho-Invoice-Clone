import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, organizationAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [org, setOrg] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', taxId: '', currency: 'USD', website: '', logo: '' });
    const [saving, setSaving] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

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
                    taxId: user.organization.taxId || '',
                    currency: user.organization.currency || 'USD',
                    primaryColor: user.organization.primaryColor || '#4f46e5',
                    invoiceTemplate: user.organization.invoiceTemplate || 'CLASSIC',
                    defaultLanguage: user.organization.defaultLanguage || 'en',
                    website: user.organization.website || '',
                    logo: user.organization.logo || '',
                });
            }
        }
    }, [user]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authAPI.updateProfile(profile);
            updateUser(res.data.data);
            toast.success('Profile updated');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
        setSaving(false);
    };

    const handleOrgSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authAPI.updateOrg(org);
            updateUser({ organization: res.data.data });
            toast.success('Organization updated');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
        setSaving(false);
    };

    const tabs = [
        { key: 'profile', label: 'Profile' },
        { key: 'organization', label: 'Organization' },
        { key: 'preferences', label: 'Preferences' },
    ];

    const getLogoUrl = (logo) => {
        if (!logo) return null;
        if (logo.startsWith('http')) return logo;
        return `${import.meta.env.VITE_API_BASE || ''}${logo}`;
    };

    const logoUrl = getLogoUrl(org.logo);

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
                                <div className="logo-preview-container">
                                    <div className="logo-preview clickable" onClick={() => setShowPreviewModal(true)} title="Click to preview">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" />
                                        ) : (
                                            <div className="logo-premium-z">Z</div>
                                        )}
                                    </div>
                                    <p className="text-muted" style={{ fontSize: 10, textAlign: 'center', marginTop: 4 }}>Click to enlarge</p>
                                </div>
                                <div className="logo-actions">
                                    <div className="logo-button-group">
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
                                                    updateUser({ organization: res.data.data });
                                                    toast.success('Logo updated');
                                                } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
                                            }} />
                                        </label>
                                        {org.logo && (
                                            <button type="button" className="btn btn-secondary btn-sm btn-danger-text" onClick={async () => {
                                                if (!window.confirm('Are you sure you want to remove the logo?')) return;
                                                try {
                                                    const res = await organizationAPI.deleteLogo();
                                                    setOrg({ ...org, logo: null });
                                                    updateUser({ organization: res.data.data });
                                                    toast.success('Logo removed');
                                                } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove logo'); }
                                            }}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
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

                                <div className="settings-divider" style={{ margin: '24px 0', borderTop: '1px solid var(--border)' }}></div>
                                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Branding & Personalization</h3>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Primary Brand Color</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <input type="color" value={org.primaryColor} onChange={(e) => setOrg({ ...org, primaryColor: e.target.value })} style={{ width: 50, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                                            <input type="text" value={org.primaryColor} onChange={(e) => setOrg({ ...org, primaryColor: e.target.value })} style={{ fontFamily: 'monospace' }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Invoice Template</label>
                                        <select value={org.invoiceTemplate} onChange={(e) => setOrg({ ...org, invoiceTemplate: e.target.value })}>
                                            <option value="CLASSIC">Classic Professional</option>
                                            <option value="MODERN">Modern Minimal</option>
                                            <option value="BOLD">Bold & Vibrant</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Default Communication Language</label>
                                    <select value={org.defaultLanguage} onChange={(e) => setOrg({ ...org, defaultLanguage: e.target.value })}>
                                        <option value="en">English (US)</option>
                                        <option value="es">Spanish (Español)</option>
                                        <option value="fr">French (Français)</option>
                                        <option value="de">German (Deutsch)</option>
                                        <option value="hi">Hindi (हिन्दी)</option>
                                    </select>
                                    <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>Used for customer emails and public portal.</p>
                                </div>

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
            {showPreviewModal && (
                <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="modal logo-preview-modal" onClick={e => e.stopPropagation()}>
                        <h2>Logo Preview</h2>
                        <div className="preview-large">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Large Logo" />
                            ) : (
                                <div className="logo-premium-z lg">Z</div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowPreviewModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
