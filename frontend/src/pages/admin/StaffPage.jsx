import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, X, Upload, Eye, EyeOff,
  Users, AlertCircle
} from 'lucide-react';
import {
  getStaffAdmin, createStaffMember, updateStaffMember, deleteStaffMember
} from '../../api';
import { useBusiness } from '../../context/BusinessContext';

function StaffForm({ member, onSave, onCancel, businessId }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    role: member?.role || '',
    bio: member?.bio || '',
    sort_order: member?.sort_order ?? 0,
    visible: member?.visible !== 0,
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(member?.photo_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) { setForm(prev => ({ ...prev, photo: file })); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('role', form.role);
      fd.append('bio', form.bio);
      fd.append('sort_order', form.sort_order);
      fd.append('visible', form.visible ? '1' : '0');
      if (form.photo) fd.append('photo', form.photo);

      if (member?.id) {
        await updateStaffMember(businessId, member.id, fd);
      } else {
        await createStaffMember(businessId, fd);
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900 text-lg">{member ? 'Edit Staff Member' : 'New Staff Member'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo */}
          <div>
            <label className="label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                {photoPreview
                  ? <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  : <Users size={24} className="text-gray-300" />}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
                <Upload size={14} /> Upload Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>
          </div>

          <div>
            <label className="label">Full Name *</label>
            <input type="text" value={form.name} onChange={e => f('name', e.target.value)} className="input-field" placeholder="Jane Smith" required autoFocus />
          </div>
          <div>
            <label className="label">Role / Title</label>
            <input type="text" value={form.role} onChange={e => f('role', e.target.value)} className="input-field" placeholder="Senior Stylist, Head Chef..." />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={form.bio} onChange={e => f('bio', e.target.value)} className="input-field resize-none" rows={3} placeholder="Short bio or description..." />
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" value={form.sort_order} onChange={e => f('sort_order', e.target.value)} className="input-field" min="0" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => f('visible', !form.visible)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.visible ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.visible ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Visible on store</span>
          </label>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : member ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { businessId } = useBusiness();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const load = () => {
    if (!businessId) return;
    getStaffAdmin(businessId)
      .then(setStaff)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [businessId]);

  const handleDelete = async (member) => {
    if (!confirm(`Remove "${member.name}" from staff?`)) return;
    try {
      await deleteStaffMember(businessId, member.id);
      setStaff(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <StaffForm
          member={editMember}
          businessId={businessId}
          onSave={() => { setShowForm(false); setEditMember(null); load(); }}
          onCancel={() => { setShowForm(false); setEditMember(null); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff / Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditMember(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-36 animate-pulse bg-gray-100" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No staff members yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add First Member</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {staff.map(member => (
            <div key={member.id} className={`card p-4 flex flex-col gap-3 ${!member.visible ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name} className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                  {member.role && <p className="text-sm text-gray-500 truncate">{member.role}</p>}
                  {!member.visible && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                      <EyeOff size={10} /> Hidden
                    </span>
                  )}
                </div>
              </div>
              {member.bio && (
                <p className="text-xs text-gray-400 line-clamp-2">{member.bio}</p>
              )}
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                <button
                  onClick={() => { setEditMember(member); setShowForm(true); }}
                  className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1.5 py-1.5"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
