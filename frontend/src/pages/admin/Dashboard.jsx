import { useEffect, useState } from 'react';
import {
  Scissors, Phone, MessageSquare, TrendingUp, TrendingDown,
  Minus, Calendar, Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAnalyticsOverview, getReservationChart } from '../../api';
import { useBusiness } from '../../context/BusinessContext';

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <div className="card p-5">
      <div className={`p-2 rounded-lg inline-flex ${colors[color]} mb-3`}><Icon size={20} /></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { businessId } = useBusiness();
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([
      getAnalyticsOverview(businessId),
      getReservationChart(businessId),
    ])
      .then(([ov, chart]) => {
        setOverview(ov);
        setChartData(chart.map(d => ({ name: d.day?.slice(5) || d.day, clicks: d.count })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  const growth = overview?.reservations?.growth_percent ?? 0;
  const GrowthIcon = growth > 0 ? TrendingUp : growth < 0 ? TrendingDown : Minus;
  const growthColor = growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Business performance overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Phone}
          label="Reserve Now Clicks"
          value={overview?.reservations?.total ?? 0}
          sub={`${overview?.reservations?.today ?? 0} today`}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="This Week"
          value={overview?.reservations?.this_week ?? 0}
          sub={`vs ${overview?.reservations?.last_week ?? 0} last week`}
          color="orange"
        />
        <StatCard
          icon={Scissors}
          label="Services"
          value={overview?.services?.total ?? 0}
          sub={`${overview?.services?.visible ?? 0} visible`}
          color="purple"
        />
        <div className="card p-5">
          <div className="p-2 rounded-lg inline-flex bg-green-50 mb-3">
            <GrowthIcon size={20} className={growthColor} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {growth > 0 ? '+' : ''}{growth}%
          </p>
          <p className="text-sm font-medium text-gray-600 mt-0.5">Weekly Growth</p>
          <p className="text-xs text-gray-400 mt-1">Reserve Now clicks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Reserve Now Clicks (Last 30 Days)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(val) => [val, 'Clicks']}
                />
                <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data yet. Clicks will appear once customers use "Reserve Now".
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Staff
            </h2>
            <p className="text-3xl font-bold text-gray-900">{overview?.staff?.total ?? 0}</p>
            <p className="text-sm text-gray-400 mt-1">Team members</p>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-500" /> Feedback
            </h2>
            <p className="text-3xl font-bold text-gray-900">{overview?.feedback?.total ?? 0}</p>
            {overview?.feedback?.pending > 0 && (
              <p className="text-sm text-amber-600 mt-1 font-medium">
                {overview.feedback.pending} pending approval
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
