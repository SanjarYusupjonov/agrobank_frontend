import React, { useEffect, useState, useCallback } from 'react';
import { attendanceAPI, departmentAPI } from '../api/api';
import { ClipboardList, Filter, Search, X, Calendar } from 'lucide-react';
import './PageCommon.css';
import './Attendance.css';

const Attendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptId, setDeptId] = useState('');
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll();
      setDepartments(res.data || []);
    } catch (e) {
      console.log('Department load error', e);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (nameFilter.trim()) {
        res = await attendanceAPI.searchByName(nameFilter.trim());
      } else if (deptId) {
        res = await attendanceAPI.getAllTimelinesByDepartment(deptId);
      } else {
        res = await attendanceAPI.getAll();
      }
      setData(res.data || []);
    } catch (e) {
      setError("Ma'lumot yuklashda xato yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [deptId, nameFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNameSearch = () => setNameFilter(nameInput);
  const handleNameClear = () => { setNameInput(''); setNameFilter(''); };

  const filteredData = dateFilter
    ? data.filter(row => row.date === dateFilter)
    : data;

  const grouped = filteredData.reduce((acc, row) => {
    const key = row.name || "Noma'lum";
    if (!acc[key]) acc[key] = { name: key, entries: [] };
    acc[key].entries.push(row);
    return acc;
  }, {});

  const groupedList = Object.values(grouped);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-icon"><ClipboardList size={20} /></div>
          <div>
            <h1 className="page-title">Barcha Davomat</h1>
            <p className="page-desc">Hodimlar kunlik ish vaqti diagrammasi</p>
          </div>
        </div>
      </div>

      <div className="att-filter-bar">
        <div className="filter-item">
          <Filter size={14} />
          <span>Bo'lim:</span>
          <select
            value={deptId}
            onChange={(e) => { setDeptId(e.target.value); setNameFilter(''); setNameInput(''); }}
            className="filter-select"
          >
            <option value="">Barcha bo'limlar</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item att-name-filter">
          <Search size={14} />
          <span>Ism:</span>
          <div className="att-name-input-wrap">
            <input
              type="text"
              className="att-name-input"
              placeholder="Hodim ismi..."
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setNameFilter(e.target.value);
              }}              
              onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
            />
            {nameInput && (
              <button className="att-name-clear" onClick={handleNameClear}><X size={12} /></button>
            )}
          </div>
          {/* <button className="att-search-btn" onClick={handleNameSearch}>Izlash</button> */}
        </div>

        <div className="filter-item">
          <Calendar size={14} />
          <span>Sana:</span>
          <input
            type="date"
            className="att-date-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button className="att-name-clear" onClick={() => setDateFilter('')}><X size={12} /></button>
          )}
        </div>

        <div className="result-count">
          {!loading && <span>{groupedList.length} hodim</span>}
        </div>
      </div>

      {error && <div className="page-error">⚠ {error}</div>}

      <div className="page-content">
        {loading ? (
          <TimelineSkeleton />
        ) : groupedList.length === 0 ? (
          <div className="table-empty">
            <ClipboardList size={48} />
            <p>Ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="timeline-container">
            <TimelineHeader />
            {groupedList.map((employee) => (
              <EmployeeTimeline key={employee.name} employee={employee} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineHeader = () => (
  <div className="tl-header-row">
    <div className="tl-name-col" />
    <div className="tl-bar-col">
      <div className="tl-hour-labels">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="tl-hour-label" style={{ left: `${(i / 24) * 100}%` }}>
            {i % 6 === 0 ? `${String(i).padStart(2, '0')}:00` : i % 3 === 0 ? `${String(i).padStart(2, '0')}` : ''}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EmployeeTimeline = ({ employee }) => {
  const [tooltip, setTooltip] = useState(null);

  const segments = [];
  employee.entries.forEach((entry) => {
    (entry.intervals || []).forEach((interval) => {
      const startMin = timeToMinutes(interval.start);
      const endMin = timeToMinutes(interval.end);
      segments.push({
        left: (startMin / 1440) * 100,
        width: ((endMin - startMin) / 1440) * 100,
        type: interval.type,
        start: interval.start,
        end: interval.end,
        date: entry.date,
        duration: endMin - startMin,
      });
    });
  });

  const workMin = segments.filter(s => s.type === 'work').reduce((a, s) => a + s.duration, 0);
  const breakMin = segments.filter(s => s.type === 'break').reduce((a, s) => a + s.duration, 0);

  return (
    <div className="tl-employee-row">
      <div className="tl-name-col">
        <div className="tl-avatar">{employee.name.charAt(0).toUpperCase()}</div>
        <div className="tl-name-info">
          <span className="tl-name">{employee.name}</span>
          <span className="tl-summary">
            <span className="tl-dot tl-dot--work" />{formatDuration(workMin)}
            {breakMin > 0 && <><span className="tl-dot tl-dot--break" />{formatDuration(breakMin)}</>}
          </span>
        </div>
      </div>
      <div className="tl-bar-col">
        <div className="tl-track">
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="tl-gridline" style={{ left: `${(i / 24) * 100}%` }} />
          ))}
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className={`tl-segment tl-segment--${seg.type}`}
              style={{ left: `${seg.left}%`, width: `${Math.max(seg.width, 0.3)}%` }}
              onMouseEnter={(e) => setTooltip({ seg, x: e.clientX, y: e.clientY })}
              onMouseMove={(e) => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </div>
        {tooltip && (
          <div className="tl-tooltip" style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 52, pointerEvents: 'none', zIndex: 9999 }}>
            <span className={`tl-dot tl-dot--${tooltip.seg.type}`} />
            <strong>{tooltip.seg.type === 'work' ? 'Ish vaqti' : 'Tanaffus'}</strong>
            <span>{tooltip.seg.start} – {tooltip.seg.end}</span>
            <span className="tl-tooltip-dur">{formatDuration(tooltip.seg.duration)}</span>
            {tooltip.seg.date && <span className="tl-tooltip-date">{tooltip.seg.date}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineSkeleton = () => (
  <div className="timeline-container">
    <TimelineHeader />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="tl-employee-row">
        <div className="tl-name-col">
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ width: 110 + i * 10, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 70, height: 10, borderRadius: 4 }} />
          </div>
        </div>
        <div className="tl-bar-col">
          <div className="tl-track">
            <div className="skeleton" style={{ position: 'absolute', left: `${8 + i * 4}%`, width: `${28 + i * 5}%`, height: '100%', borderRadius: 6 }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}s` : `${h}s ${m}m`;
}

export default Attendance;