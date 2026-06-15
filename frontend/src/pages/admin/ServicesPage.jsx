import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, X, Upload, Eye, EyeOff,
  Image as ImageIcon, Tag, Clock, Calendar,
  AlertCircle, ChevronDown, ChevronUp, Scissors, Star
} from 'lucide-react';
import {
  getServicesAdmin, getServiceCategories, createService, updateService,
  toggleServiceVisibility, deleteService, deleteServiceImage
} from '../../api';
import { useBusiness } from '../../context/BusinessContext';

// ── Service Form Modal ────────────────────────────────────────────────────────

function ServiceForm({ service, categories, onSave, onCancel, businessId }) {
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price ?? '',
    duration: service?.duration || '',
    time_windows: service?.time_windows || '',
    category_id: service?.category_id || '',
    visible: service?.visible !== 0,
    show_gallery: service?.show_gallery !== 0,
  });

  // Separate cover image from gallery images
  const existingCover   = service?.images?.[0] || null;
  const existingGallery = service?.images?.slice(1) || [];

  const [newCover, setNewCover]         = useState(null);
  const [coverPreview, setCoverPreview] = useState(existingCover?.image_url || '');
  const [removeCover, setRemoveCover]   = useState(false);

  const [newGallery, setNewGallery]     = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState(existingGallery);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const coverRef   = useRef();
  const galleryRef = useRef();

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewCover(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
    e.target.value = '';
  };

  const handleGalleryFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewGallery(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewGallery = (idx) => {
    setNewGallery(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingGalleryImage = async (img) => {
    if (!confirm('Remove this image?')) return;
    try {
      await deleteServiceImage(businessId, service.id, img.id);
      setExistingGalleryImages(prev => prev.filter(i => i.id !== img.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const removeExistingCover = async () => {
    if (!existingCover) return;
    if (!confirm('Remove the cover image?')) return;
    try {
      await deleteServiceImage(businessId, service.id, existingCover.id);
      setCoverPreview('');
      setRemoveCover(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('duration', form.duration);
      fd.append('time_windows', form.time_windows);
      fd.append('category_id', form.category_id || '');
      fd.append('visible', form.visible ? '1' : '0');
      fd.append('show_gallery', form.show_gallery ? '1' : '0');

      // Cover goes first so it ends up as images[0]
      if (newCover) fd.append('images', newCover);
      // Then additional gallery images
      newGallery.forEach(img => fd.append('images', img));

      if (service?.id) {
        await updateService(businessId, service.id, fd);
      } else {
        await createService(businessId, fd);
      }
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
          <h2 className="font-bold text-gray-900 text-lg">
            {service ? 'Edit Service' : 'New Service'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* ── Cover Image ────────────────────────────────────────────────── */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Star size={13} className="text-amber-500" />
              Cover Image
              <span className="text-xs font-normal text-gray-400 ml-1">shown on the service card</span>
            </label>

            {coverPreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-2">
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    className="bg-white/90 hover:bg-white text-gray-700 text-xs px-2.5 py-1 rounded-lg shadow font-medium flex items-center gap-1"
                  >
                    <Upload size={12} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={existingCover && !newCover ? removeExistingCover : () => { setNewCover(null); setCoverPreview(existingCover?.image_url || ''); }}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg shadow font-medium flex items-center gap-1"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 mb-2"
              >
                <ImageIcon size={32} />
                <span className="text-sm font-medium">Upload cover image</span>
                <span className="text-xs">JPG, PNG, WebP · max 10MB</span>
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
          </div>

          {/* ── Basic info ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Service Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => f('name', e.target.value)}
                className="input-field"
                placeholder="e.g. Haircut & Style"
                required
              />
            </div>
            <div>
              <label className="label">Price (0 = Free)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => f('price', e.target.value)}
                className="input-field"
                placeholder="500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <input
                type="text"
                value={form.duration}
                onChange={e => f('duration', e.target.value)}
                className="input-field"
                placeholder="30 min, 1 hour"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Category</label>
              <select
                value={form.category_id}
                onChange={e => f('category_id', e.target.value)}
                className="input-field"
              >
                <option value="">— No Category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                value={form.description}
                onChange={e => f('description', e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Brief description of the service..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label flex items-center gap-1.5">
                <Calendar size={13} /> Time Windows / Availability Slots
              </label>
              <input
                type="text"
                value={form.time_windows}
                onChange={e => f('time_windows', e.target.value)}
                className="input-field"
                placeholder="Morning, Afternoon, Evening  (comma-separated)"
              />
              <p className="text-xs text-gray-400 mt-1">
                e.g. "Morning, Afternoon" · "9 AM–12 PM, 2–5 PM" · "Weekdays only"
              </p>
            </div>
          </div>

          {/* ── Toggles ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => f('visible', !form.visible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.visible ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.visible ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Visible on store</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => f('show_gallery', !form.show_gallery)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.show_gallery ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.show_gallery ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Show gallery</span>
            </label>
          </div>

          {/* ── Additional Gallery Images ────────────────────────────────────── */}
          <div>
            <label className="label flex items-center gap-1.5">
              <ImageIcon size={13} />
              Additional Gallery Photos
              <span className="text-xs font-normal text-gray-400 ml-1">shown when customer taps "More photos"</span>
            </label>

            {/* Existing gallery images */}
            {existingGalleryImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {existingGalleryImages.map(img => (
                  <div key={img.id} className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(img)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New gallery previews */}
            {galleryPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {galleryPreviews.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 border border-blue-200">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewGallery(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 text-center text-xs bg-blue-600/80 text-white">new</div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Upload size={14} /> Add Gallery Photos
            </button>
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFiles}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-1">Up to 10 images · max 10MB each</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : service ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { businessId } = useBusiness();
  const [services, setServices]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editService, setEditService] = useState(null);
  const [expandedGallery, setExpandedGallery] = useState(null);

  const load = async () => {
    if (!businessId) return;
    try {
      const [svcs, cats] = await Promise.all([
        getServicesAdmin(businessId),
        getServiceCategories(businessId),
      ]);
      setServices(svcs);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [businessId]);

  const handleToggleVisibility = async (svc) => {
    try {
      await toggleServiceVisibility(businessId, svc.id);
      setServices(prev => prev.map(s => s.id === svc.id ? { ...s, visible: s.visible === 1 ? 0 : 1 } : s));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (svc) => {
    if (!confirm(`Delete "${svc.name}"? This cannot be undone.`)) return;
    try {
      await deleteService(businessId, svc.id);
      setServices(prev => prev.filter(s => s.id !== svc.id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <ServiceForm
          service={editService}
          categories={categories}
          businessId={businessId}
          onSave={() => { setShowForm(false); setEditService(null); load(); }}
          onCancel={() => { setShowForm(false); setEditService(null); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditService(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Service
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="card p-12 text-center">
          <Scissors size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No services yet. Add your first one!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add Service</button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => {
            const coverImage = svc.images?.[0]?.image_url || null;
            const extraImages = svc.images?.slice(1) || [];
            return (
              <div key={svc.id} className="card overflow-hidden">
                <div className="flex items-start gap-0">

                  {/* Cover thumbnail */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 overflow-hidden">
                    {coverImage ? (
                      <img src={coverImage} alt={svc.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={22} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${svc.visible ? 'bg-green-500' : 'bg-gray-300'}`} title={svc.visible ? 'Visible' : 'Hidden'} />
                        <div>
                          <p className="font-semibold text-gray-900">{svc.name}</p>
                          {svc.category_name && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1">
                              <Tag size={10} /> {svc.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">{svc.price === 0 ? 'Free' : Number(svc.price).toLocaleString()}</p>
                        {svc.duration && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                            <Clock size={11} /> {svc.duration}
                          </p>
                        )}
                      </div>
                    </div>

                    {svc.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{svc.description}</p>
                    )}
                    {svc.time_windows && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={11} /> {svc.time_windows}
                      </p>
                    )}

                    {/* Gallery count */}
                    {extraImages.length > 0 && (
                      <button
                        onClick={() => setExpandedGallery(expandedGallery === svc.id ? null : svc.id)}
                        className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                      >
                        <ImageIcon size={11} />
                        {extraImages.length} extra photo{extraImages.length !== 1 ? 's' : ''}
                        {expandedGallery === svc.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-2 p-3 flex-shrink-0 border-l border-gray-50">
                    <button
                      onClick={() => handleToggleVisibility(svc)}
                      title={svc.visible ? 'Hide' : 'Show'}
                      className={`p-2 rounded-lg transition-colors ${svc.visible ? 'text-gray-400 hover:bg-gray-100' : 'text-amber-500 bg-amber-50 hover:bg-amber-100'}`}
                    >
                      {svc.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => { setEditService(svc); setShowForm(true); }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(svc)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded extra gallery */}
                {expandedGallery === svc.id && extraImages.length > 0 && (
                  <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-gray-50 pt-3">
                    {extraImages.map(img => (
                      <div key={img.id} className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
                        <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
