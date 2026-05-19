import React from 'react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { ClipboardX } from 'lucide-react';
import './AttendanceTable.css';

const AttendanceTable = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="table-loading">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton sk-name" />
            <div className="skeleton sk-dept" />
            <div className="skeleton sk-time" />
            <div className="skeleton sk-card" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <ClipboardX size={48} />
        <p>Ma'lumot topilmadi</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="att-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Ism Familiya</th>
            <th>Bo'lim</th>
            <th>Vaqt</th>
            <th>Karta o'quvchi</th>
            <th>Holat</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const date = row.time ? new Date(row.time) : null;
            const hour = date ? date.getHours() : null;
            const isLate = hour !== null && hour >= 9;
            return (
              <tr key={i} className="att-row">
                <td className="td-num">{i + 1}</td>
                <td className="td-name">{row.name || '—'}</td>
                <td>
                  <span className="badge badge-dept">{row.department || '—'}</span>
                </td>
                <td className="td-time">
                  {date
                    ? format(date, 'dd MMM yyyy, HH:mm', { locale: uz })
                    : '—'}
                </td>
                <td className="td-card">{row.cardReader || '—'}</td>
                <td>
                  <span className={`badge ${isLate ? 'badge-late' : 'badge-on-time'}`}>
                    {isLate ? 'Kechikdi' : 'O\'z vaqtida'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="table-footer">
        Jami: <strong>{data.length}</strong> yozuv
      </div>
    </div>
  );
};

export default AttendanceTable;
