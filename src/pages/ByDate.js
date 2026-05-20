import React, { useState, useCallback } from 'react';
import { attendanceAPI } from '../api/api';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './PageCommon.css';
import './Attendance.css';

const PAGE_SIZE = 10;

const ByDate = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [rows, setRows]         = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState('');

  const fetchPage = useCallback(async (page = 0, from = fromDate, to = toDate) => {
    if (!from || !to) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await attendanceAPI.getTimelineByDateRange({
        fromDate: `${from}T00:00:00`,
        toDate:   `${to}T23:59:59`,
        page,
        size: PAGE_SIZE,
      });
      const p = res.data;
      setRows(p.content || []);
      setPagination({
        page: p.number ?? 0,
        totalPages: p.totalPages ?? 0,
        totalElements: p.totalElements ?? 0,
      });
    } catch {
      setError("Sana bo'yicha qidiruvda xato yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const handleSearch = () => fetchPage(0);

  const setQuickRange = (days) => {
    const to   = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().split('T')[0];
    setFromDate(fmt(from));
    setToDate(fmt(to));
  };

  const grouped = buildGrouped(rows);

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-icon"><Calendar size={20} /></div>
          <div>
            <h1 className="page-title">Sana bo'yicha filtrlash</h1>
            <p className="page-desc">Berilgan sana oralig'idagi davomatni ko'ring</p>
          </div>
        </div>
        {searched && !loading && (
          <div className="tl-total-badge">
            Jami: <strong>{pagination.totalElements}</strong> qayd
          </div>
        )}
      </div>

      {/* ── Date picker ── */}
      <div className="date-filter-card">
        <div className="quick-ranges">
          <span className="quick-label">Tezkor:</span>
          {[
            { label: 'Bugun',  days: 0  },
            { label: '7 kun',  days: 7  },
            { label: '30 kun', days: 30 },
          ].map((q) => (
            <button key={q.days} className="quick-btn" onClick={() => setQuickRange(q.days)}>
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
            {loading ? <span className="spinner-sm" /> : "Ko'rish"}
          </button>
        </div>
      </div>

      {error && <div className="page-error">⚠ {error}</div>}

      {/* ── Results ── */}
      {!searched ? (
        <div className="search-hint">
          <Calendar size={48} />
          <p>Sana oralig'ini tanlang va "Ko'rish" tugmasini bosing</p>
        </div>
      ) : loading ? (
        <TimelineSkeleton />
      ) : grouped.length === 0 ? (
        <div className="table-empty">
          <Calendar size={48} />
          <p>Bu sana oralig'ida ma'lumot topilmadi</p>
        </div>
      ) : (
        <>
          <div className="search-meta" style={{ marginBottom: 12 }}>
            <strong>{fromDate}</strong> dan <strong>{toDate}</strong> gacha &nbsp;·&nbsp;
            {pagination.totalElements} ta qayd
          </div>
          <div className="page-content">
            <div className="timeline-container">
              <TimelineHeader />
              {grouped.map(employee => (
                <EmployeeBlock key={`${employee.name}-${employee.dates[0]?.date}`} employee={employee} />
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchPage(p)}
            />
          </div>
        </>
      )}
    </div>
  );
};

// ─── Shared components (same as Attendance.js) ────────────────────────────────

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

const TimelineSkeleton = () => (
  <div className="timeline-container">
    <TimelineHeader />
    {[...Array(4)].map((_, i) => (
      <div key={i} className="tl-employee-block">
        <div className="tl-employee-header">
          <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ width: 120 + i * 15, height: 13, borderRadius: 4 }} />
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

export default ByDate;