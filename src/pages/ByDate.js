import React, { useState } from 'react';
import { attendanceAPI } from '../api/api';
import AttendanceTable from '../components/AttendanceTable';
import { Calendar, ArrowRight } from 'lucide-react';
import './PageCommon.css';

const ByDate = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      // Backend expects LocalDateTime format: 2024-01-01T00:00:00
      const from = fromDate + 'T00:00:00';
      const to = toDate + 'T23:59:59';
      const res = await attendanceAPI.getByDateRange(from, to);
      setData(res.data || []);
    } catch (e) {
      setError('Sana bo\'yicha qidiruvda xato yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFromDate(from.toISOString().split('T')[0]);
    setToDate(to.toISOString().split('T')[0]);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-icon"><Calendar size={20} /></div>
          <div>
            <h1 className="page-title">Sana bo'yicha filtrlash</h1>
            <p className="page-desc">Berilgan sana oralig'idagi davomatni ko'ring</p>
          </div>
        </div>
      </div>

      <div className="date-filter-card">
        <div className="quick-ranges">
          <span className="quick-label">Tezkor:</span>
          {[
            { label: 'Bugun', days: 0 },
            { label: '7 kun', days: 7 },
            { label: '30 kun', days: 30 },
          ].map((q) => (
            <button
              key={q.days}
              className="quick-btn"
              onClick={() => setQuickRange(q.days)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="date-inputs">
          <div className="date-group">
            <label>Boshlanish sanasi</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </div>
          <ArrowRight size={18} className="date-arrow" />
          <div className="date-group">
            <label>Tugash sanasi</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={!fromDate || !toDate || loading}
          >
            {loading ? <span className="spinner-sm" /> : 'Ko\'rish'}
          </button>
        </div>
      </div>

      {error && <div className="page-error">⚠ {error}</div>}

      {searched && !loading && (
        <div className="search-meta">
          <strong>{fromDate}</strong> dan <strong>{toDate}</strong> gacha: {data.length} ta yozuv
        </div>
      )}

      {searched ? (
        <div className="page-content">
          <AttendanceTable data={data} loading={loading} />
        </div>
      ) : (
        <div className="search-hint">
          <Calendar size={48} />
          <p>Sana oralig'ini tanlang va "Ko'rish" tugmasini bosing</p>
        </div>
      )}
    </div>
  );
};

export default ByDate;
