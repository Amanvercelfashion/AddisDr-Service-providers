import { useState, useEffect } from 'react';
import { Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getWorkHours, updateWorkHours } from '../../api';
import { useBusiness } from '../../context/BusinessContext';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function TimeInput({ value, onChange, disabled }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="input-field text-sm w-32 disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

export default function WorkHoursPage() {
  const { businessId } = useBusiness();
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!businessId) return;
    getWorkHours(businessId)
      .then(setHours)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  const updateDay = (dayOfWeek, field, value) => {
    setHours(prev => prev.map(h =>
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      await updateWorkHours(businessId, hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Presets
  const applyPreset = (preset) => {
    if (preset === 'weekdays') {
      setHours(prev => prev.map(h => ({
        ...h,
        is_open: h.day_of_week >= 1 && h.day_of_week <= 5 ? 1 : 0,
        open_time: '09:00',
        close_time: '18:00',
      })));
    } else if (preset === 'everyday') {
      setHours(prev => prev.map(h => ({ ...h, is_open: 1, open_time: '09:00', close_time: '21:00' })));
    } else if (preset === 'closed') {
      setHours(prev => prev.map(h => ({ ...h, is_open: 0 })));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 max-w-xl">
        {[...Array(7)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Work Hours</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set your opening and closing times for each day</p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center">Quick set:</span>
        <button onClick={() => applyPreset('weekdays')} className="btn-secondary text-xs py-1.5 px-3">Weekdays only</button>
        <button onClick={() => applyPreset('everyday')} className="btn-secondary text-xs py-1.5 px-3">Everyday</button>
        <button onClick={() => applyPreset('closed')} className="btn-secondary text-xs py-1.5 px-3">All closed</button>
      </div>

      <div className="card overflow-hidden">
        {hours.map((h, idx) => (
          <div
            key={h.day_of_week}
            className={`flex items-center gap-4 px-5 py-4 ${idx < hours.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            {/* Day + toggle */}
            <div className="w-28 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-800">{DAY_NAMES[h.day_of_week]}</p>
            </div>

            {/* Open/Close toggle */}
            <div
              onClick={() => updateDay(h.day_of_week, 'is_open', h.is_open ? 0 : 1)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${h.is_open ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${h.is_open ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>

            {/* Status + time range */}
            {h.is_open ? (
              <div className="flex items-center gap-2 flex-wrap">
                <TimeInput
                  value={h.open_time}
                  onChange={val => updateDay(h.day_of_week, 'open_time', val)}
                />
                <span className="text-gray-400 text-sm">–</span>
                <TimeInput
                  value={h.close_time}
                  onChange={val => updateDay(h.day_of_week, 'close_time', val)}
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Closed</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={14} />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle size={14} />Work hours saved!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary flex items-center gap-2 py-3 px-6"
      >
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Work Hours'}
      </button>
    </div>
  );
}
