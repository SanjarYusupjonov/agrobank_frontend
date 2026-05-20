import React, { useEffect, useState, useCallback, useRef } from 'react';
import { attendanceAPI, departmentAPI } from '../api/api';
import { ClipboardList, Filter, Search, X, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './PageCommon.css';
import './Attendance.css';

// ─── Spring Page<T> response shape ───────────────────────────────────────────
// {
//   content: [ { name, date, department, intervals: [{start,end,type}] }, … ],
//   totalElements, totalPages, number, size, first, last
// }

const PAGE_SIZE = 10;

const Attendance = () => {
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const [departments, setDepartments] = useState([]);
  const [deptId, setDeptId]         = useState('');

  const [nameInput, setNameInput]   = useState('');
  const [nameFilter, setNameFilter] = useState('');

  const [dateFilter, setDateFilter] = useState('');

  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [activeDateRange, setActiveDateRange] = useState({ from: '', to: '' });

  const debounceRef = useRef(null);

  // ── departments ──────────────────────────────────────────────────────────
  useEffect(() => {
    departmentAPI.getAll()
      .then(res => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  // ── fetch ────────────────────────────────────────────────────────────────
  // Backend /attendance/timeline priority:
  //   1. departmentId  → getTimelinesByDepartmentId
  //   2. name          → getTimelinesByName
  //   3. date          → getTimelinesByDate
  //   4. fromDate+toDate → getTimelinesByDateRange
  //   5. (none)        → getAllTimelines
  //
  // Frontend ensures only ONE filter is active at a time.
  const fetchPage = useCallback(async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      // Build params: only active filter is sent
      const params = { page, size: PAGE_SIZE };

      if (activeDateRange.from && activeDateRange.to) {
        // Date range mode — fromDate/toDate only, no other filters
        params.fromDate = `${activeDateRange.from}T00:00:00`;
        params.toDate   = `${activeDateRange.to}T23:59:59`;
      } else if (dateFilter) {
        params.date = dateFilter;
      } else if (deptId) {
        params.departmentId = deptId;
      } else if (nameFilter) {
        params.name = nameFilter;
      }
      // else → no extra params → getAllTimelines

      const res = await attendanceAPI.getTimeline(params);
      const p = res.data;
      setRows(p.content || []);
      setPagination({
        page:          p.number      ?? 0,
        totalPages:    p.totalPages  ?? 0,
        totalElements: p.totalElements ?? 0,
      });
    } catch {
      setError("Ma'lumot yuklashda xato yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [deptId, nameFilter, dateFilter, activeDateRange]);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleNameInput = (val) => {
    setNameInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setNameFilter(val), 450);
  };

  const clearName = () => { setNameInput(''); setNameFilter(''); };

  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
    setActiveDateRange({ from: '', to: '' });
  };

  const setQuickRange = (days) => {
    const to   = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().split('T')[0];
    const f = fmt(from);
    const t = fmt(to);
    setFromDate(f);
    setToDate(t);
    // Clear other filters and apply immediately
    setDeptId('');
    setNameInput('');
    setNameFilter('');
    setDateFilter('');
    setActiveDateRange({ from: f, to: t });
  };

  // "Ko'rish" tugmasi — apply date range, clear other filters
  const applyDateRange = () => {
    if (!fromDate || !toDate) return;
    setDeptId('');
    setNameInput('');
    setNameFilter('');
    setDateFilter('');
    setActiveDateRange({ from: fromDate, to: toDate });
  };

  const isDateRangeActive = !!(activeDateRange.from && activeDateRange.to);

  const grouped = buildGrouped(rows);

  return (
    <div className="page">
      {/* ── header ── */}
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-icon"><ClipboardList size={20} /></div>
          <div>
            <h1 className="page-title">Barcha Davomat</h1>
            <p className="page-desc">Hodimlar kunlik ish vaqti diagrammasi</p>
          </div>
        </div>
        <div className="tl-total-badge">
          Jami: <strong>{pagination.totalElements}</strong> qayd
        </div>
      </div>

      {/* ── filter bar (1-qator) ── */}
      <div className="att-filter-bar">

        {/* Bo'lim */}
        <div className="filter-item">
          <Filter size={14} />
          <span>Bo'lim:</span>
          <select
            value={deptId}
            onChange={e => {
              setDeptId(e.target.value);
              clearName();
              clearDateRange();
              setDateFilter('');
            }}
            className="filter-select"
          >
            <option value="">Barcha bo'limlar</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Ism */}
        <div className="filter-item att-name-filter">
          <Search size={14} />
          <span>Ism:</span>
          <div className="att-name-input-wrap">
            <input
              type="text"
              className="att-name-input"
              placeholder="Hodim ismi..."
              value={nameInput}
              onChange={e => {
                handleNameInput(e.target.value);
                setDeptId('');
                clearDateRange();
                setDateFilter('');
              }}
            />
            {nameInput && (
              <button className="att-name-clear" onClick={clearName}><X size={12} /></button>
            )}
          </div>
        </div>

        {/* Bitta sana */}
        <div className="filter-item">
          <Calendar size={14} />
          <span>Sana:</span>
          <input
            type="date"
            className="att-date-input"
            value={dateFilter}
            onChange={e => {
              setDateFilter(e.target.value);
              setDeptId('');
              clearName();
              clearDateRange();
            }}
          />
          {dateFilter && (
            <button
              className="att-name-clear"
              style={{ position: 'static', marginLeft: -4 }}
              onClick={() => setDateFilter('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="result-count">
          {!loading && (
            <span>{pagination.totalElements} ta qayd &nbsp;·&nbsp; {pagination.totalPages} sahifa</span>
          )}
        </div>
      </div>

      {/* ── date range filter (2-qator) ── */}
      <div className={`att-daterange-bar${isDateRangeActive ? ' att-daterange-bar--active' : ''}`}>
        <div className="att-daterange-label">
          <Calendar size={13} />
          <span>Sana oralig'i:</span>
        </div>

        {/* Tezkor tugmalar */}
        <div className="att-quick-ranges">
          <span className="att-quick-label">Tezkor:</span>
          {[
            { label: 'Bugun', days: 0  },
            { label: '7 kun', days: 7  },
            { label: '30 kun', days: 30 },
          ].map(q => (
            <button
              key={q.days}
              className="quick-btn"
              onClick={() => setQuickRange(q.days)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="att-daterange-inputs">
          <input
            type="date"
            className="att-date-input"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <ArrowRight size={14} className="att-daterange-arrow" />
          <input
            type="date"
            className="att-date-input"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
          <button
            className="att-search-btn"
            onClick={applyDateRange}
            disabled={!fromDate || !toDate || loading}
          >
            Ko'rish
          </button>
          {isDateRangeActive && (
            <button className="att-daterange-clear" onClick={clearDateRange}>
              <X size={13} />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {isDateRangeActive && (
          <span className="att-daterange-active-label">
            ✓ &nbsp;{activeDateRange.from} → {activeDateRange.to}
          </span>
        )}
      </div>

      {error && <div className="page-error">⚠ {error}</div>}

      {/* ── timeline ── */}
      <div className="page-content">
        {loading ? (
          <TimelineSkeleton />
        ) : grouped.length === 0 ? (
          <div className="table-empty">
            <ClipboardList size={48} />
            <p>Ma'lumot topilmadi</p>
          </div>
        ) : (
          <>
            <div className="timeline-container">
              <TimelineHeader />
              {grouped.map(employee => (
                <EmployeeBlock key={employee.name} employee={employee} />
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={p => fetchPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};

// ─── Group rows by name → date ────────────────────────────────────────────────
function buildGrouped(rows) {
  const byName = {};
  rows.forEach(row => {
    const key = row.name || "Noma'lum";
    if (!byName[key]) byName[key] = { name: key, department: row.department, dateMap: {} };
    const d = row.date || 'N/A';
    if (!byName[key].dateMap[d]) byName[key].dateMap[d] = [];
    byName[key].dateMap[d].push(...(row.intervals || []));
  });
  return Object.values(byName).map(emp => ({
    name: emp.name,
    department: emp.department,
    dates: Object.entries(emp.dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, intervals]) => ({ date, intervals })),
  }));
}

// ─── 24-hour header ───────────────────────────────────────────────────────────
const TimelineHeader = () => (
  <div className="tl-header-row">
    <div className="tl-name-col" />
    <div className="tl-bar-col">
      <div className="tl-hour-labels">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="tl-hour-label" style={{ left: `${(i / 24) * 100}%` }}>
            {i % 6 === 0 ? `${String(i).padStart(2, '0')}:00`
              : i % 3 === 0 ? `${String(i).padStart(2, '0')}` : ''}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Employee block ───────────────────────────────────────────────────────────
const EmployeeBlock = ({ employee }) => {
  const totalWork = employee.dates
    .flatMap(d => d.intervals)
    .filter(s => s.type === 'work')
    .reduce((a, s) => a + diff(s.start, s.end), 0);

  return (
    <div className="tl-employee-block">
      <div className="tl-employee-header">
        <div className="tl-avatar">{employee.name.charAt(0).toUpperCase()}</div>
        <div className="tl-name-info">
          <span className="tl-name">{employee.name}</span>
          <span className="tl-summary">
            {employee.department && (
              <span className="tl-dept-badge">{employee.department}</span>
            )}
            <span className="tl-dot tl-dot--work" />
            {formatDuration(totalWork)} ish
            &nbsp;·&nbsp;
            {employee.dates.length} kun
          </span>
        </div>
      </div>
      {employee.dates.map(({ date, intervals }) => (
        <DateRow key={date} date={date} intervals={intervals} />
      ))}
    </div>
  );
};

// ─── Single date row ──────────────────────────────────────────────────────────
const DateRow = ({ date, intervals }) => {
  const [tooltip, setTooltip] = useState(null);

  const segments = intervals.filter(iv => iv.type !== 'lunch').map(iv => {
    const startMin = toMin(iv.start);
    const endMin   = toMin(iv.end);
    return {
      left:     (startMin / 1440) * 100,
      width:    Math.max(((endMin - startMin) / 1440) * 100, 0.3),
      type:     iv.type,
      start:    iv.start,
      end:      iv.end,
      duration: endMin - startMin,
    };
  });

  const workMin  = segments.filter(s => s.type === 'work').reduce((a, s) => a + s.duration, 0);
  const breakMin = segments.filter(s => s.type === 'break').reduce((a, s) => a + s.duration, 0);

  return (
    <div className="tl-date-row">
      <div className="tl-date-label-col">
        <div className="tl-date-chip">
          <span className="tl-date-text">{formatDate(date)}</span>
          <span className="tl-date-durations">
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
              style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
              onMouseEnter={e => setTooltip({ seg, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </div>
        {tooltip && (
          <div
            className="tl-tooltip"
            style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 58, pointerEvents: 'none', zIndex: 9999 }}
          >
            <div className="tl-tooltip-row">
              <span className={`tl-dot tl-dot--${tooltip.seg.type}`} />
              <strong>{tooltip.seg.type === 'work' ? 'Ish vaqti' : 'Tanaffus'}</strong>
            </div>
            <span className="tl-tooltip-time">{fmtTime(tooltip.seg.start)} – {fmtTime(tooltip.seg.end)}</span>
            <span className="tl-tooltip-dur">{formatDuration(tooltip.seg.duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = buildPageNumbers(page, totalPages);
  return (
    <div className="tl-pagination">
      <button className="tl-page-btn tl-page-nav" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="tl-page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`tl-page-btn ${p === page ? 'tl-page-btn--active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        )
      )}
      <button className="tl-page-btn tl-page-nav" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = [];
  const add = (p) => { if (!pages.includes(p)) pages.push(p); };
  [0, 1].forEach(add);
  [current - 1, current, current + 1].forEach(p => { if (p >= 0 && p < total) add(p); });
  [total - 2, total - 1].forEach(add);
  pages.sort((a, b) => a - b);
  const result = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const TimelineSkeleton = () => (
  <div className="timeline-container">
    <TimelineHeader />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="tl-employee-block">
        <div className="tl-employee-header">
          <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ width: 120 + i * 12, height: 13, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 80, height: 10, borderRadius: 4 }} />
          </div>
        </div>
        {[...Array(2)].map((_, j) => (
          <div key={j} className="tl-date-row">
            <div className="tl-date-label-col">
              <div className="skeleton" style={{ width: 90, height: 28, borderRadius: 8 }} />
            </div>
            <div className="tl-bar-col">
              <div className="tl-track">
                <div className="skeleton" style={{ position: 'absolute', left: `${10 + j * 8}%`, width: `${30 + j * 10}%`, height: '100%', borderRadius: 6 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMin(t) {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}
function diff(start, end) { return Math.max(toMin(end) - toMin(start), 0); }
function fmtTime(t) { return t ? t.slice(0, 5) : ''; }
function formatDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}s` : `${h}s ${m}m`;
}
function formatDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return dateStr;
  try {
    const [y, mo, d] = dateStr.split('-');
    const months = ['Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return `${d} ${months[parseInt(mo, 10) - 1]} ${y}`;
  } catch { return dateStr; }
}

export default Attendance;