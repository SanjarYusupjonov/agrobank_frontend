import React, { useEffect, useState } from 'react';
import { attendanceAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Clock, CheckCircle, AlertCircle,
  TrendingUp, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import AttendanceTable from '../components/AttendanceTable';
import './Dashboard.css';

const COLORS = ['#1eb864', '#fbbf24', '#60a5fa', '#f87171'];

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAll(0, 100);
      // /attendance/timeline returns Page<T>: { content: [...], totalElements, ... }
      const payload = res.data;
      setData(Array.isArray(payload) ? payload : (payload?.content ?? []));
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Stats
  const total = data.length;
  const departments = [...new Set(data.map((d) => d.department).filter(Boolean))];
  const onTime = data.filter((d) => {
    const h = d.time ? new Date(d.time).getHours() : null;
    return h !== null && h < 9;
  }).length;
  const late = total - onTime;

  // Bar chart: by department
  const deptMap = {};
  data.forEach((d) => {
    if (d.department) deptMap[d.department] = (deptMap[d.department] || 0) + 1;
  });
  const barData = Object.entries(deptMap).map(([name, count]) => ({ name: name.replace(' Bo\'limi', ''), count }));

  // Pie chart: on time vs late
  const pieData = [
    { name: 'O\'z vaqtida', value: onTime },
    { name: 'Kechikdi', value: late },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">
            Xush kelibsiz, <strong>{user?.fullName || user?.username}</strong>! Bugungi davomat holati.
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Yangilash
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Users size={22} />}
          label="Jami qaydlar"
          value={loading ? '—' : total}
          sub="Bugun"
          color="#1eb864"
        />
        <StatCard
          icon={<CheckCircle size={22} />}
          label="O'z vaqtida"
          value={loading ? '—' : onTime}
          sub={`${total ? Math.round((onTime / total) * 100) : 0}%`}
          color="#4ade80"
        />
        <StatCard
          icon={<AlertCircle size={22} />}
          label="Kechikkan"
          value={loading ? '—' : late}
          sub={`${total ? Math.round((late / total) * 100) : 0}%`}
          color="#fbbf24"
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Bo'limlar"
          value={loading ? '—' : departments.length}
          sub="Faol"
          color="#60a5fa"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <TrendingUp size={16} />
            <span>Bo'lim bo'yicha</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d1f17', border: '1px solid rgba(30,184,100,0.2)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                cursor={{ fill: 'rgba(30,184,100,0.05)' }}
              />
              <Bar dataKey="count" name="Soni" fill="#1eb864" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <CheckCircle size={16} />
            <span>Davomat holati</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0d1f17', border: '1px solid rgba(30,184,100,0.2)', borderRadius: 10, color: '#fff', fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>So'nggi yozuvlar</h2>
          {lastUpdated && (
            <span className="last-updated">
              Yangilandi: {lastUpdated.toLocaleTimeString('uz-UZ')}
            </span>
          )}
        </div>
        <AttendanceTable data={data.slice(0, 10)} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;