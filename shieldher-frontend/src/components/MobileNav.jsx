import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './MobileNav.css';

const MobileNav = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="mobile-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <span className="icon">💬</span>
        <span className="label">Chat</span>
      </Link>
      <Link to="/community" className={`nav-item ${location.pathname === '/community' ? 'active' : ''}`}>
        <span className="icon">👥</span>
        <span className="label">Community</span>
      </Link>
      {!user.isVerified && (
        <Link to="/verification" className={`nav-item ${location.pathname === '/verification' ? 'active' : ''}`}>
            <span className="icon">🆔</span>
            <span className="label">Verify</span>
        </Link>
      )}
    </div>
  );
};

export default MobileNav;
