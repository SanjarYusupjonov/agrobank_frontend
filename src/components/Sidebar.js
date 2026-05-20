import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Search,
  Calendar, LogOut, ChevronRight
} from 'lucide-react';
import logo from '../assets/logo226.jpg';
import './Sidebar.css';

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/attendance', icon: <ClipboardList size={18} />, label: 'Barcha Davomat' },
  // { to: '/search', icon: <Search size={18} />, label: 'Qidiruv' },
  // { to: '/by-date', icon: <Calendar size={18} />, label: "Sana bo'yicha" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-img-wrap">
          <img src={logo} alt="Agrobank Logo" className="sidebar-logo-img" />
        </div>
        <div>
          <div className="sidebar-brand">AGROBANK</div>
          <div className="sidebar-brand-sub">Davomat Tizimi</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Asosiy</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item--active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <ChevronRight size={14} className="nav-arrow" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'Foydalanuvchi'}</div>
            <div className="user-role">Tizim foydalanuvchisi</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;