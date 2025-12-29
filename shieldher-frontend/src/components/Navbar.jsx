import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.link}>🛡️ ShieldHer</Link>
      </div>
      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/" style={styles.link}>Chat</Link>
            <Link to="/community" style={styles.link}>Community</Link>
            {!user.isVerified && <Link to="/verification" style={styles.verifyLink}>Verify Now</Link>}
            <span style={styles.welcome}>Hello, {user.username}</span>
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
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#6a1b9a',
    color: 'white',
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
    color: 'white',
    textDecoration: 'none',
    fontWeight: '500',
  },
  verifyLink: {
    color: '#00e676',
    textDecoration: 'none',
    fontWeight: 'bold',
    border: '1px solid #00e676',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ff4081',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  welcome: {
    marginRight: '1rem',
  }
};

export default Navbar;
