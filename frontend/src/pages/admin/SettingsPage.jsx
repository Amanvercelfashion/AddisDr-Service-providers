import { useState, useEffect, useRef } from 'react';
import {
  Save, Upload, Building2, Eye, EyeOff,
  CheckCircle, AlertCircle, Users, Image as ImageIcon, Phone
} from 'lucide-react';
import { getBusiness, saGetBusiness, saUpdateBusiness } from '../../api';
import { useBusiness } from '../../context/BusinessContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import axios from 'axios';

export default function SettingsPage() {
  const { businessId, setBusiness } = useBusiness();
  const { token: saToken } = useSuperAdmin();

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    about: '',
    phone: '',
    address: '',
    map_url: '',
    color_primary: '#2563eb',
    color_secondary: '#7c3aed',
    color_tertiary: '#0891b2',
    staff_display: 1,
    gallery_display: 1,
    logo: null,
    hero: null,
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [heroPreview, setHeroPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const logoRef = useRef();
  const heroRef = useRef();

  useEffect(() => {
    if (!businessId) return;
    getBusiness(businessId)
      .then(data => {
        setForm(f => ({
          ...f,
          name: data.name || '',
          tagline: data.tagline || '',
          about: data.about || '',
          phone: data.phone || '',
          address: data.address || '',
          map_url: data.map_url || '',
          color_primary: data.color_primary || '#2563eb',
          color_secondary: data.color_secondary || '#7c3aed',
          color_tertiary: data.color_tertiary || '#0891b2',
          staff_display: data.staff_display ?? 1,
          gallery_display: data.gallery_display ?? 1,
        }));
        setLogoPreview(data.logo_url || '');
        setHeroPreview(data.hero_image_url || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (file) { setForm(f => ({ ...f, logo: file })); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleHero = (e) => {
    const file = e.target.files?.[0];
    if (file) { setForm(f => ({ ...f, hero: file })); setHeroPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      if (!saToken) {
        setError('Settings can only be edited by the Super Admin.');
        return;
      }
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('tagline', form.tagline);
      fd.append('about', form.about);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('map_url', form.map_url);
      fd.append('color_primary', form.color_primary);
      fd.append('color_secondary', form.color_secondary);
      fd.append('color_tertiary', form.color_tertiary);
      fd.append('staff_display', form.staff_display ? '1' : '0');
      fd.append('gallery_display', form.gallery_display ? '1' : '0');
      if (form.logo) fd.append('logo', form.logo);
      if (form.hero) fd.append('hero', form.hero);

      await saUpdateBusiness(saToken, businessId, fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setBusiness(prev => ({
        ...prev,
        name: form.name,
        tagline: form.tagline,
        about: form.about,
        phone: form.phone,
        logo_url: logoPreview,
        hero_image_url: heroPreview,
        staff_display: form.staff_display ? 1 : 0,
        gallery_display: form.gallery_display ? 1 : 0,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl animate-pulse">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-40" />)}
      </div>
    );
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {saToken ? 'Edit business profile and storefront settings' : 'Contact your platform administrator to edit settings'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Profile */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Business Profile</h2>
          </div>

          {/* Logo */}
          <div className="mb-4">
            <label className="label">Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-xl border overflow-hidden flex items-center justify-center flex-shrink-0">
                {logoPreview
                  ? <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                  : <Building2 size={24} className="text-gray-300" />}
              </div>
              {saToken && (
                <>
                  <button type="button" onClick={() => logoRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
                    <Upload size={14} /> Upload Logo
                  </button>
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                </>
              )}
            </div>
          </div>

          {/* Hero background image */}
          <div className="mb-4">
            <label className="label flex items-center gap-1.5"><ImageIcon size={13} /> Hero Background Image</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-40 bg-gray-100 rounded-xl border overflow-hidden flex items-center justify-center flex-shrink-0">
                {heroPreview
                  ? <img src={heroPreview} alt="" className="h-full w-full object-cover" />
                  : <ImageIcon size={24} className="text-gray-300" />}
              </div>
              {saToken && (
                <>
                  <div>
                    <button type="button" onClick={() => heroRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
                      <Upload size={14} /> Upload Hero Image
                    </button>
                    <p className="text-xs text-gray-400 mt-1">Shown behind the store name on the main page</p>
                  </div>
                  <input ref={heroRef} type="file" accept="image/*" onChange={handleHero} className="hidden" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {[
              ['name', 'Business Name', 'My Salon', 'text'],
              ['tagline', 'Tagline', 'Where style meets comfort', 'text'],
              ['phone', 'Phone Number', '+251912345678', 'tel'],
              ['address', 'Address', 'Bole, Addis Ababa', 'text'],
              ['map_url', 'Google Maps Link', 'https://maps.google.com/...', 'url'],
            ].map(([key, label, placeholder, type]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => f(key, e.target.value)}
                  className="input-field"
                  placeholder={placeholder}
                  disabled={!saToken}
                />
              </div>
            ))}
            <div>
              <label className="label">About Us</label>
              <textarea
                value={form.about}
                onChange={e => f('about', e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Tell customers about your business..."
                disabled={!saToken}
              />
            </div>
          </div>
        </div>

        {/* Theme Colors */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎨</span>
            <h2 className="font-semibold text-gray-900">Theme Colors</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'color_primary', label: 'Primary', hint: 'Buttons, nav' },
              { key: 'color_secondary', label: 'Secondary', hint: 'Accents, badges' },
              { key: 'color_tertiary', label: 'Tertiary', hint: 'Highlights' },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={form[key]}
                      onChange={e => f(key, e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={!saToken}
                    />
                    <div className="w-full h-full rounded-lg" style={{ backgroundColor: form[key] }} />
                  </div>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) f(key, e.target.value); }}
                    className="input-field font-mono text-xs uppercase"
                    maxLength={7}
                    disabled={!saToken}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>
          {/* Preview strip */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: form.color_primary }}>Primary</div>
            <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: form.color_secondary }}>Secondary</div>
            <div className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: form.color_tertiary }}>Tertiary</div>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">👁️</span>
            <h2 className="font-semibold text-gray-900">Display Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2"><Users size={15} className="text-gray-500" /> Show Staff / Team Section</p>
                <p className="text-xs text-gray-400 mt-0.5">Display your team on the public store page</p>
              </div>
              <div
                onClick={() => saToken && f('staff_display', form.staff_display ? 0 : 1)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${saToken ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${form.staff_display ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.staff_display ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2"><ImageIcon size={15} className="text-gray-500" /> Show Service Gallery</p>
                <p className="text-xs text-gray-400 mt-0.5">Allow gallery images to be shown on service cards</p>
              </div>
              <div
                onClick={() => saToken && f('gallery_display', form.gallery_display ? 0 : 1)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${saToken ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${form.gallery_display ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.gallery_display ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        </div>

        {!saToken && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} />
            Settings can only be edited by the Super Admin. Log in as Super Admin to make changes.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={14} />{error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <CheckCircle size={14} />Settings saved successfully!
          </div>
        )}

        {saToken && (
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-3 px-6">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </form>
    </div>
  );
}
