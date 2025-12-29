import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import Profile from './Profile';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const API_BASE = import.meta.env.VITE_API_URL || '';

  return (
    <>
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">🛡️ ShieldHer</Link>
      </div>
      <div className="navbar-links">
        <button onClick={toggleTheme} className="navbar-theme-btn" title="Toggle Theme">
            {isDarkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <Link to="/chat" className="navbar-link">Chat</Link>
            <Link to="/community" className="navbar-link">Community</Link>
            <Link to="/friends" className="navbar-link">Network</Link>
            {!user.isVerified && <Link to="/verification" className="navbar-verify-link">Verify Now</Link>}
            
            <div onClick={() => setShowProfile(true)} className="navbar-profile-container">
                {user.profilePicture ? (
                    <img src={`${API_BASE}/${user.profilePicture}`} className="navbar-avatar-small" alt="Profile" />
                ) : (
                    <span className="navbar-welcome">Hello, {user.username}</span>
                )}
            </div>
            
            <button onClick={handleLogout} className="navbar-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="navbar-link">Register</Link>
          </>
        )}
      </div>
    </nav>
    {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Navbar;
