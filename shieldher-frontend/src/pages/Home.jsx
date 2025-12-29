import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to ShieldHer</h1>
        <p className="hero-subtitle">
          Your companion for safety, support, and sisterhood.
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <h3>AI Support</h3>
            <p>24/7 AI chatbot ready to listen, advise, and support you through any situation.</p>
          </div>
          <div className="feature-card">
            <h3>Safe Community</h3>
            <p>Connect with verified users in a secure environment designed for women.</p>
          </div>
          <div className="feature-card">
            <h3>Verified Identity</h3>
            <p>Our rigorous verification ensures you're interacting with real, safe community members.</p>
          </div>
        </div>

        <div className="cta-buttons">
          <button 
            className="btn-primary" 
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/login')}
          >
            Connect with Besties
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
