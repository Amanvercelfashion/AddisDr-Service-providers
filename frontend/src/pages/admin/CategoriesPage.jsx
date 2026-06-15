import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FolderOpen, GripVertical, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getServiceCategories, createServiceCategory,
  updateServiceCategory, deleteServiceCategory
} from '../../api';
import { useBusiness } from '../../context/BusinessContext';

function CategoryForm({ category, onSave, onCancel, businessId }) {
  const [name, setName] = useState(category?.name || '');
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { name: name.trim(), sort_order: Number(sortOrder) };
      if (category?.id) {
        await updateServiceCategory(businessId, category.id, data);
      } else {
        await createServiceCategory(businessId, data);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-900">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Haircuts, Massages, Starters"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="input-field"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { businessId } = useBusiness();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);

  const load = () => {
    if (!businessId) return;
    getServiceCategories(businessId)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [businessId]);

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteServiceCategory(businessId, cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <CategoryForm
          category={editCat}
          businessId={businessId}
          onSave={() => { setShowForm(false); setEditCat(null); load(); }}
          onCancel={() => { setShowForm(false); setEditCat(null); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organize your services by category</p>
        </div>
        <button
          onClick={() => { setEditCat(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No categories yet. Create your first one!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add Category</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400">Order: {cat.sort_order}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditCat(cat); setShowForm(true); }}
                    className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
