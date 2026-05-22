import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X, Search, Loader } from 'lucide-react';
import { departmentAPI } from '../api/api';

const DepartmentSearchSelect = ({
  value       = '',
  onChange,
  placeholder = "Barcha bo'limlar",
  disabled    = false,
}) => {
  const [open,     setOpen]     = useState(false);
  const [query,    setQuery]    = useState('');
  const [allDepts, setAllDepts] = useState([]);   // cache — bir marta yuklanadi
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);

  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  // ── bir marta fetch, keyin frontend filter ────────────────────────
  useEffect(() => {
    setLoading(true);
    departmentAPI.getAll('')
      .then(res => setAllDepts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllDepts([]))
      .finally(() => setLoading(false));
  }, []);

  // filtered list — instant, no network
  const options = query.trim()
    ? allDepts.filter(d =>
        d.name?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : allDepts;

  // sync selected label
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    const found = allDepts.find(d => String(d.id) === String(value));
    if (found) setSelected(found);
  }, [value, allDepts]);

  // focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (dept) => {
    setSelected(dept);
    onChange(dept ? String(dept.id) : '');
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onChange('');
  };

  return (
    <div
      ref={wrapRef}
      className={`dss-wrap${open ? ' dss-wrap--open' : ''}${disabled ? ' dss-wrap--disabled' : ''}`}
    >
      {/* Trigger */}
      <button
        type="button"
        className="dss-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`dss-trigger-label${!selected ? ' dss-trigger-label--placeholder' : ''}`}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="dss-trigger-icons">
          {selected && (
            <span className="dss-clear-btn" onClick={clear} title="Tozalash">
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={`dss-chevron${open ? ' dss-chevron--up' : ''}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dss-dropdown" role="listbox">
          <div className="dss-search-wrap">
            <Search size={13} className="dss-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="dss-search-input"
              placeholder="Qidirish..."
              value={query}
              onChange={e => setQuery(e.target.value)}  // instant — no debounce needed
            />
            {loading && <Loader size={13} className="dss-spinner" />}
          </div>

          <div
            className={`dss-option${!value ? ' dss-option--selected' : ''}`}
            onClick={() => select(null)}
            role="option"
            aria-selected={!value}
          >
            <span className="dss-option-all">Barcha bo'limlar</span>
          </div>

          <div className="dss-divider" />

          <div className="dss-list">
            {options.length === 0 && !loading && (
              <div className="dss-empty">Topilmadi</div>
            )}
            {options.map(dept => (
              <div
                key={dept.id}
                className={`dss-option${String(dept.id) === String(value) ? ' dss-option--selected' : ''}`}
                onClick={() => select(dept)}
                role="option"
                aria-selected={String(dept.id) === String(value)}
              >
                <span className="dss-option-name">{dept.name}</span>
                {String(dept.id) === String(value) && (
                  <span className="dss-option-check">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentSearchSelect;
