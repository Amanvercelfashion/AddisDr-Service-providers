import { useState, useEffect } from 'react';
import {
  MessageSquare, Star, CheckCircle, XCircle,
  Trash2, ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';
import { getFeedbackAdmin, toggleFeedbackApproval, deleteFeedback } from '../../api';
import { useBusiness } from '../../context/BusinessContext';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { businessId } = useBusiness();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | approved

  useEffect(() => {
    if (!businessId) return;
    getFeedbackAdmin(businessId)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleToggle = async (item) => {
    try {
      const res = await toggleFeedbackApproval(businessId, item.id);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, approved: res.approved } : i));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await deleteFeedback(businessId, item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = items.filter(i => {
    if (filter === 'pending') return !i.approved;
    if (filter === 'approved') return !!i.approved;
    return true;
  });

  const pendingCount = items.filter(i => !i.approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} total · {pendingCount > 0 && (
              <span className="text-amber-600 font-medium">{pendingCount} pending approval</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'approved', label: 'Approved' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filter === 'pending' ? 'No pending reviews' : filter === 'approved' ? 'No approved reviews yet' : 'No feedback yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`card p-4 flex gap-4 ${!item.approved ? 'border-amber-200 bg-amber-50/30' : ''}`}
            >
              {/* Approval indicator */}
              <div className="flex-shrink-0 mt-1">
                {item.approved ? (
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                ) : (
                  <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertCircle size={16} className="text-amber-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <Stars rating={item.rating} />
                  </div>
                  <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                {!item.approved && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-2">
                    Pending approval
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(item)}
                  title={item.approved ? 'Unapprove' : 'Approve'}
                  className={`p-2 rounded-lg transition-colors ${
                    item.approved
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  {item.approved ? <ThumbsDown size={15} /> : <ThumbsUp size={15} />}
                </button>
                <button
                  onClick={() => handleDelete(item)}
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
