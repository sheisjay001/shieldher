import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SOSButton = () => {
  const [isActive, setIsActive] = useState(false);

  const handleSOS = () => {
    if (isActive) {
      setIsActive(false);
      toast.success('SOS Alert Cancelled');
      return;
    }

    // In a real implementation, this would trigger an API call
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Activating SOS...',
        success: <b>SOS Alert Sent! Location shared with contacts.</b>,
        error: <b>Failed to send alert.</b>,
      }
    );
    setIsActive(true);
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
      >
        {isActive ? 'CANCEL SOS' : 'SOS'}
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