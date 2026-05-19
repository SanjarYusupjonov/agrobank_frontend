import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => (
  <div className="layout">
    <Sidebar />
    <main className="layout-main">{children}</main>
  </div>
);

export default Layout;
