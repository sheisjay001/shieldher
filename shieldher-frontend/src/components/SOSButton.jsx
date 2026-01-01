import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const SOSButton = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    if (isActive) {
      setIsActive(false);
      toast.success('SOS Alert Cancelled');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    
    const sendAlert = (position) => {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');

        if (!token) {
            toast.error("Please login to use SOS");
            setLoading(false);
            return;
        }

        axios.post('/api/sos', 
            { latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
            setIsActive(true);
            toast.success(<b>SOS Alert Sent! Help is on the way.</b>, { duration: 5000 });
        })
        .catch(err => {
            console.error(err);
            toast.error("Failed to send alert. Check connection.");
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const handleError = () => {
        toast.error("Unable to retrieve location. Sending alert without location...");
        // Fallback: Send without coords
        const token = localStorage.getItem('token');
        axios.post('/api/sos', {}, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                setIsActive(true);
                toast.success('SOS Alert Sent (No Location)');
            })
            .catch(() => toast.error('Failed to send alert'))
            .finally(() => setLoading(false));
    };

    navigator.geolocation.getCurrentPosition(sendAlert, handleError);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px', // Above mobile nav
      right: '20px',
      zIndex: 1000
    }}>
      <motion.button
        className="btn-sos"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          backgroundColor: isActive ? '#ef4444' : '#ef4444',
          boxShadow: isActive 
            ? '0 0 0 0 rgba(239, 68, 68, 0.7)' 
            : '0 4px 14px rgba(239, 68, 68, 0.4)',
        }}
        onClick={handleSOS}
        disabled={loading}
      >
        {loading ? '...' : (isActive ? 'CANCEL SOS' : 'SOS')}
      </motion.button>
      
      {isActive && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50px',
            backgroundColor: '#ef4444',
            zIndex: -1
          }}
        />
      )}
    </div>
  );
};

export default SOSButton;