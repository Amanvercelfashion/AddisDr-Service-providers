import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, X, Upload, Building2,
  CheckCircle, XCircle, Eye, EyeOff, KeyRound,
  Settings, ExternalLink, ToggleLeft, ToggleRight,
  Check, Scissors, Phone
} from 'lucide-react';
import {
  saGetBusinesses, saCreateBusiness, saUpdateBusiness,
  saToggleStatus, saDeleteBusiness
} from '../../api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import axios from 'axios';

// ── Helpers ───────────────────────────────────────────────────────────────────

function nameToSubdomain(name) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Set Admin Password Modal ──────────────────────────────────────────────────

function SetPasswordModal({ business, token, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) return setError('Password must be at least 4 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await axios.patch(
        `/api/superadmin/businesses/${business.id}/admin-password`,
        { password },
        { headers: { 'x-super-admin': token } }
      );
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">Set Admin Password</h2>
            <p className="text-xs text-gray-500 mt-0.5">{business.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Password set!</p>
            <p className="text-sm text-gray-500 mb-4">
              Admin panel URL:{' '}
              <span className="font-mono text-gray-700">/adminmanager?business={business.id}</span>
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
              <p>Admin panel URL:</p>
              <p className="font-mono mt-0.5 break-all">
                {window.location.origin}/adminmanager?business={business.id}
              </p>
            </div>
            <div>
              <label className="label">New Password *</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Min. 4 characters"
                  required autoFocus
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input-field"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <KeyRound size={14} />
                {loading ? 'Saving...' : 'Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Business Form Modal ───────────────────────────────────────────────────────

function BusinessForm({ business, onSave, onCancel }) {
  const { token } = useSuperAdmin();
  const [subdomainEdited, setSubdomainEdited] = useState(!!business?.subdomain);
  const [form, setForm] = useState({
    name: business?.name || '',
    subdomain: business?.subdomain || '',
    tagline: business?.tagline || '',
    about: business?.about || '',
    phone: business?.phone || '',
    address: business?.address || '',
    map_url: business?.map_url || '',
    status: business?.status || 'active',
    color_primary: business?.color_primary || '#2563eb',
    color_secondary: business?.color_secondary || '#7c3aed',
    color_tertiary: business?.color_tertiary || '#0891b2',
    staff_display: business?.staff_display ?? 1,
    gallery_display: business?.gallery_display ?? 1,
    logo: null,
    hero: null,
  });
  const [logoPreview, setLogoPreview] = useState(business?.logo_url || '');
  const [heroPreview, setHeroPreview] = useState(business?.hero_image_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const logoRef = useRef();
  const heroRef = useRef();

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNameChange = (val) => {
    setForm(prev => ({
      ...prev,
      name: val,
      subdomain: subdomainEdited ? prev.subdomain : nameToSubdomain(val),
    }));
  };

  const handleSubdomainChange = (val) => {
    setSubdomainEdited(true);
    setForm(prev => ({ ...prev, subdomain: val.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'logo' && k !== 'hero' && v !== null) fd.append(k, String(v));
      });
      if (form.logo) fd.append('logo', form.logo);
      if (form.hero) fd.append('hero', form.hero);

      if (business?.id) await saUpdateBusiness(token, business.id, fd);
      else await saCreateBusiness(token, fd);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900 text-lg">{business ? 'Edit Business' : 'New Business'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Logo */}
          <div>
            <label className="label">Business Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-xl border flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview
                  ? <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                  : <Building2 size={24} className="text-gray-300" />}
              </div>
              <button type="button" onClick={() => logoRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
                <Upload size={14} /> Upload Logo
              </button>
              <input ref={logoRef} type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) { f('logo', file); setLogoPreview(URL.createObjectURL(file)); }
              }} className="hidden" />
            </div>
          </div>

          {/* Hero image */}
          <div>
            <label className="label">Hero Background Image</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-32 bg-gray-100 rounded-xl border flex items-center justify-center overflow-hidden flex-shrink-0">
                {heroPreview
                  ? <img src={heroPreview} alt="" className="h-full w-full object-cover" />
                  : <span className="text-xs text-gray-400">No hero</span>}
              </div>
              <button type="button" onClick={() => heroRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
                <Upload size={14} /> Upload Hero
              </button>
              <input ref={heroRef} type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) { f('hero', file); setHeroPreview(URL.createObjectURL(file)); }
              }} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Business Name *</label>
              <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">
                Subdomain *
                {!subdomainEdited && form.name && <span className="ml-1 text-xs font-normal text-blue-500">auto-generated</span>}
              </label>
              <div className="flex items-center gap-1">
                <input type="text" value={form.subdomain} onChange={e => handleSubdomainChange(e.target.value)} className="input-field" required />
                <span className="text-sm text-gray-400 whitespace-nowrap">.yoursite.com</span>
              </div>
            </div>
            <div>
              <label className="label">Tagline</label>
              <input type="text" value={form.tagline} onChange={e => f('tagline', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} className="input-field" placeholder="+251912345678" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input type="text" value={form.address} onChange={e => f('address', e.target.value)} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Google Maps URL</label>
              <input type="url" value={form.map_url} onChange={e => f('map_url', e.target.value)} className="input-field" placeholder="https://maps.google.com/..." />
            </div>
            <div className="sm:col-span-2">
              <label className="label">About Us</label>
              <textarea value={form.about} onChange={e => f('about', e.target.value)} className="input-field resize-none" rows={2} />
            </div>
          </div>

          {/* Theme colors */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">🎨 Theme Colors</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'color_primary', label: 'Primary' },
                { key: 'color_secondary', label: 'Secondary' },
                { key: 'color_tertiary', label: 'Tertiary' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <input type="color" value={form[key]} onChange={e => f(key, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="w-full h-full rounded-lg" style={{ backgroundColor: form[key] }} />
                    </div>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) f(key, e.target.value); }}
                      className="input-field font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-7 rounded-lg text-white text-xs flex items-center justify-center font-medium" style={{ backgroundColor: form.color_primary }}>Primary</div>
              <div className="flex-1 h-7 rounded-lg text-white text-xs flex items-center justify-center font-medium" style={{ backgroundColor: form.color_secondary }}>Secondary</div>
              <div className="flex-1 h-7 rounded-lg text-white text-xs flex items-center justify-center font-medium" style={{ backgroundColor: form.color_tertiary }}>Tertiary</div>
            </div>
          </div>

          {/* Display toggles */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => f('staff_display', form.staff_display ? 0 : 1)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.staff_display ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.staff_display ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-700">Show Staff</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => f('gallery_display', form.gallery_display ? 0 : 1)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.gallery_display ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.gallery_display ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-700">Show Gallery</span>
            </label>
          </div>

          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={e => f('status', e.target.value)} className="input-field">
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Admin Password display cell ───────────────────────────────────────────────

function AdminPasswordCell({ password }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-gray-800">{visible ? password : '••••••••'}</span>
      <button onClick={() => setVisible(v => !v)} className="text-gray-400 hover:text-gray-600">
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

// ── Row hamburger menu ────────────────────────────────────────────────────────

function HamburgerMenu({ biz, token, onEdit, onToggle, onDelete, onPasswordSet }) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {showPassword && (
        <SetPasswordModal
          business={biz}
          token={token}
          onClose={() => { setShowPassword(false); onPasswordSet?.(); }}
        />
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="flex flex-col items-center justify-center gap-[4px] w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        aria-label="More actions"
      >
        <span className="block w-4 h-[2px] bg-current rounded-full" />
        <span className="block w-4 h-[2px] bg-current rounded-full" />
        <span className="block w-4 h-[2px] bg-current rounded-full" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5">
          <a
            href={`/adminmanager?business=${biz.id}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
            onClick={() => setOpen(false)}
          >
            <Settings size={14} /> Open Admin Panel
          </a>
          <a
            href={`/store?business=${biz.id}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={14} className="text-gray-400" /> View Store
          </a>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { setShowPassword(true); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          >
            <KeyRound size={14} className="text-blue-400" /> Set Admin Password
          </button>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit2 size={14} className="text-gray-400" /> Edit Business
          </button>
          <button
            onClick={() => { onToggle(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {biz.status === 'active'
              ? <ToggleLeft size={14} className="text-gray-400" />
              : <ToggleRight size={14} className="text-green-500" />}
            {biz.status === 'active' ? 'Disable Business' : 'Enable Business'}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete Business
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const { token } = useSuperAdmin();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBiz, setEditBiz] = useState(null);

  const load = () => {
    saGetBusinesses(token)
      .then(setBusinesses)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleToggle = async (biz) => {
    const newStatus = biz.status === 'active' ? 'disabled' : 'active';
    try {
      await saToggleStatus(token, biz.id, newStatus);
      setBusinesses(bs => bs.map(b => b.id === biz.id ? { ...b, status: newStatus } : b));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (biz) => {
    if (!confirm(`Permanently delete "${biz.name}" and all its data?`)) return;
    try {
      await saDeleteBusiness(token, biz.id);
      setBusinesses(bs => bs.filter(b => b.id !== biz.id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <BusinessForm
          business={editBiz}
          onSave={() => { setShowForm(false); setEditBiz(null); load(); }}
          onCancel={() => { setShowForm(false); setEditBiz(null); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {businesses.length} tenant{businesses.length !== 1 ? 's' : ''} on this platform
          </p>
        </div>
        <button onClick={() => { setEditBiz(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Business
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : businesses.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No businesses yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Create first business</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Subdomain</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Services</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Clicks</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Admin Password</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map(biz => (
                  <tr key={biz.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt="" className="h-9 w-9 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 size={14} className="text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{biz.name}</p>
                          {biz.phone && <p className="text-xs text-gray-400">{biz.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{biz.subdomain}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="flex items-center justify-center gap-1 text-gray-700">
                        <Scissors size={12} className="text-gray-400" />{biz.service_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="flex items-center justify-center gap-1 text-gray-700">
                        <Phone size={12} className="text-gray-400" />{biz.reservation_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {biz.admin_password
                        ? <AdminPasswordCell password={biz.admin_password} />
                        : <span className="text-xs text-gray-400 italic">not set</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        biz.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {biz.status === 'active' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <HamburgerMenu
                          biz={biz}
                          token={token}
                          onEdit={() => { setEditBiz(biz); setShowForm(true); }}
                          onToggle={() => handleToggle(biz)}
                          onDelete={() => handleDelete(biz)}
                          onPasswordSet={load}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
