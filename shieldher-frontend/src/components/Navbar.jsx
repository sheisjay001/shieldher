import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import Profile from './Profile';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.link}>🛡️ ShieldHer</Link>
      </div>
      <div style={styles.links}>
        <button onClick={toggleTheme} style={styles.themeBtn} title="Toggle Theme">
            {isDarkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <Link to="/" style={styles.link}>Chat</Link>
            <Link to="/community" style={styles.link}>Community</Link>
            {!user.isVerified && <Link to="/verification" style={styles.verifyLink}>Verify Now</Link>}
            
            <div onClick={() => setShowProfile(true)} style={styles.profileContainer}>
                {user.profilePicture ? (
                    <img src={`http://localhost:5001/${user.profilePicture}`} style={styles.avatarSmall} alt="Profile" />
                ) : (
                    <span style={styles.welcome}>Hello, {user.username}</span>
                )}
            </div>
            
            <button onClick={handleLogout} style={styles.button}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
    {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--surface-color)',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontWeight: '500',
  },
  verifyLink: {
    color: 'var(--online-color)',
    textDecoration: 'none',
    fontWeight: 'bold',
    border: '1px solid var(--online-color)',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  welcome: {
    marginRight: '1rem',
    cursor: 'pointer',
  },
  profileContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  avatarSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--primary-color)',
    marginRight: '10px'
  },
  themeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 8px',
  }
};

export default Navbar;
