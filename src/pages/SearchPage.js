import React, { useState, useCallback } from 'react';
import { attendanceAPI } from '../api/api';
import AttendanceTable from '../components/AttendanceTable';
import { Search as SearchIcon, X } from 'lucide-react';
import './PageCommon.css';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await attendanceAPI.searchByName(q.trim());
      setData(res.data || []);
    } catch (e) {
      setError('Qidiruvda xato yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setData([]);
    setSearched(false);
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-icon"><SearchIcon size={20} /></div>
          <div>
            <h1 className="page-title">Ism bo'yicha qidiruv</h1>
            <p className="page-desc">Xodim ismi yoki familiyasi bo'yicha qidiring</p>
          </div>
        </div>
      </div>

      <div className="search-bar-wrap">
        <div className="search-input-wrap">
          <SearchIcon size={16} className="search-icon-left" />
          <input
            type="text"
            className="search-input"
            placeholder="Ism yoki familiyani kiriting..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={clearSearch}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className="search-btn"
          onClick={() => doSearch(query)}
          disabled={!query.trim() || loading}
        >
          {loading ? <span className="spinner-sm" /> : 'Qidirish'}
        </button>
      </div>

      {error && <div className="page-error">⚠ {error}</div>}

      {searched && !loading && (
        <div className="search-meta">
          <strong>"{query}"</strong> bo'yicha {data.length} ta natija
        </div>
      )}

      {searched && (
        <div className="page-content">
          <AttendanceTable data={data} loading={loading} />
        </div>
      )}

      {!searched && (
        <div className="search-hint">
          <SearchIcon size={48} />
          <p>Qidirish uchun ism kiriting va Enter bosing</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
