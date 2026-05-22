import React, { useEffect, useState, useCallback, useRef } from 'react';
import { attendanceAPI, departmentAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Filter, Search, X, Calendar, ArrowRight, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import DepartmentSearchSelect from '../components/DepartmentSearchSelect';
import '../components/DepartmentSearchSelect.css';
import './PageCommon.css';
import './Attendance.css';

const PAGE_SIZE = 10;

const Attendance = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isDeptHead  = currentUser.userType === 'DEPARTMENT_HEAD';

  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading]       = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [error, setError]           = useState('');

  const [departments, setDepartments] = useState([]);

  const [deptId, setDeptId]         = useState('');
  const [nameInput, setNameInput]   = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [activeFrom, setActiveFrom] = useState('');
  const [activeTo, setActiveTo]     = useState('');

  const debounceRef = useRef(null);

  useEffect(() => {
    departmentAPI.getAll()
      .then(res => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: PAGE_SIZE };
      if (deptId)                 params.departmentId = Number(deptId);
      if (nameFilter)             params.name         = nameFilter;
      if (dateFilter)             params.date         = dateFilter;
      if (activeFrom && activeTo) {
        params.fromDate = `${activeFrom}T00:00:00`;
        params.toDate   = `${activeTo}T23:59:59`;
      }
      const res = await attendanceAPI.getTimeline(params);
      const p   = res.data;
      setRows(p.content || []);
      setPagination({
        page:          p.number        ?? 0,
        totalPages:    p.totalPages    ?? 0,
        totalElements: p.totalElements ?? 0,
      });
    } catch {
      setError("Ma'lumot yuklashda xato yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [deptId, nameFilter, dateFilter, activeFrom, activeTo]);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  const handleNameInput = (val) => {
    setNameInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setNameFilter(val), 200);
  };

  const applyDateRange = () => {
    if (!fromDate || !toDate) return;
    setActiveFrom(fromDate);
    setActiveTo(toDate);
  };

  const clearDateRange = () => {
    setFromDate(''); setToDate('');
    setActiveFrom(''); setActiveTo('');
  };

  const setQuickRange = (days) => {
    const to   = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    const fmt = (d) => d.toISOString().split('T')[0];
    const f = fmt(from), t = fmt(to);
    setFromDate(f); setToDate(t);
    setActiveFrom(f); setActiveTo(t);
  };

  const hasAnyFilter = !!(deptId || nameFilter || dateFilter || (activeFrom && activeTo));

  const clearAll = () => {
    if (!isDeptHead) setDeptId('');
    setNameInput(''); setNameFilter('');
    setDateFilter('');
    setFromDate(''); setToDate('');
    setActiveFrom(''); setActiveTo('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (deptId)                 params.departmentId = Number(deptId);
      if (nameFilter)             params.name         = nameFilter;
      if (dateFilter)             params.date         = dateFilter;
      if (activeFrom && activeTo) {
        params.fromDate = `${activeFrom}T00:00:00`;
        params.toDate   = `${activeTo}T23:59:59`;
      }
      const res  = await attendanceAPI.exportTimeline(params);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'davomat.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Export xatosi yuz berdi.');
    } finally {
      setExporting(false);
    }
  };

  const isDateRangeActive = !!(activeFrom && activeTo);
  const deptName = departments.find(d => String(d.id) === String(deptId))?.name || '';
  const grouped  = buildGrouped(rows);

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-icon"><ClipboardList size={20} /></div>
          <div>
            <h1 className="page-title">Barcha Davomat</h1>
            <p className="page-desc">Hodimlar kunlik ish vaqti diagrammasi</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="tl-total-badge">
            Jami: <strong>{pagination.totalElements}</strong> qayd
          </div>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={loading || exporting}
          >
            <Download size={14} />
            {exporting ? 'Yuklanmoqda...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="att-filter-bar">
        {!isDeptHead && (
          <div className="filter-item">
            <Filter size={14} />
            <span>Bo'lim:</span>
            <DepartmentSearchSelect
              value={deptId}
              onChange={setDeptId}
            />
          </div>
        )}

        <div className="filter-item att-name-filter">
          <Search size={14} />
          <span>Ism:</span>
          <div className="att-name-input-wrap">
            <input
              type="text"
              className="att-name-input"
              placeholder="Hodim ismi..."
              value={nameInput}
              onChange={e => handleNameInput(e.target.value)}
            />
            {nameInput && (
              <button className="att-name-clear" onClick={() => { setNameInput(''); setNameFilter(''); }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-item">
          <Calendar size={14} />
          <span>Sana:</span>
          <input
            type="date"
            className="att-date-input"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
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
          {hasAnyFilter && (
            <button
              className="att-daterange-clear"
              style={{ marginLeft: 8 }}
              onClick={clearAll}
              title="Barcha filterlarni tozalash"
            >
              <X size={13} />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Aktif filter chiplari ── */}
      {hasAnyFilter && (
        <div className="att-active-filters">
          {deptId && !isDeptHead && (
            <span className="att-filter-chip">
              Bo'lim: <strong>{deptName}</strong>
              <button onClick={() => setDeptId('')}><X size={11} /></button>
            </span>
          )}
          {nameFilter && (
            <span className="att-filter-chip">
              Ism: <strong>{nameFilter}</strong>
              <button onClick={() => { setNameInput(''); setNameFilter(''); }}><X size={11} /></button>
            </span>
          )}
          {dateFilter && (
            <span className="att-filter-chip">
              Sana: <strong>{formatDate(dateFilter)}</strong>
              <button onClick={() => setDateFilter('')}><X size={11} /></button>
            </span>
          )}
          {isDateRangeActive && (
            <span className="att-filter-chip">
              Oraliq: <strong>{activeFrom} → {activeTo}</strong>
              <button onClick={clearDateRange}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Sana oralig'i filtri ── */}
      <div className={`att-daterange-bar${isDateRangeActive ? ' att-daterange-bar--active' : ''}`}>
        <div className="att-daterange-label">
          <Calendar size={13} />
          <span>Sana oralig'i:</span>
        </div>
        <div className="att-quick-ranges">
          <span className="att-quick-label">Tezkor:</span>
          {[
            { label: 'Bugun', days: 0  },
            { label: '7 kun', days: 7  },
            { label: '30 kun', days: 30 },
          ].map(q => (
            <button key={q.days} className="quick-btn" onClick={() => setQuickRange(q.days)}>
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
      </div>

      {error && <div className="page-error">⚠ {error}</div>}

      {/* ── Timeline ── */}
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
              {grouped.map((employee, idx) => (
                <EmployeeBlock key={`${employee.name}-${employee.dates[0]?.date}-${idx}`} employee={employee} />
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

function buildGrouped(rows) {
  return rows.map(row => ({
    name: row.name || "Noma'lum",
    department: row.department,
    dates: [{ date: row.date || 'N/A', intervals: row.intervals || [] }],
  }));
}

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
  const navigate = useNavigate();

  const totalWork = employee.dates
    .flatMap(d => d.intervals)
    .filter(s => s.type === 'work')
    .reduce((a, s) => a + diff(s.start, s.end), 0);

  const handleClick = () => {
    navigate(
      `/employee/${encodeURIComponent(employee.name)}/${encodeURIComponent(employee.department || '')}`
    );
  };

  return (
    <div className="tl-employee-block">
      <div
        className="tl-employee-header tl-employee-header--clickable"
        onClick={handleClick}
        title="Batafsil ko'rish"
      >
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
        <span className="tl-chevron-hint">›</span>
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
