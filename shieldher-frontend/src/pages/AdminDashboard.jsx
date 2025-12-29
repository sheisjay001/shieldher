import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, verifications, reports
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'verifications') fetchVerifications();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stats`, config);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/users`, config);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/verifications`, config);
      setVerifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/reports`, config);
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyUser = async (userId) => {
    if (!window.confirm("Are you sure you want to verify this user?")) return;
    try {
      await axios.put(`${API_BASE}/api/admin/verify/${userId}`, {}, config);
      setMessage('User verified successfully');
      fetchVerifications();
      fetchStats();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error verifying user');
    }
  };

  const rejectUser = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this verification?")) return;
    try {
      await axios.put(`${API_BASE}/api/admin/reject/${userId}`, {}, config);
      setMessage('User verification rejected');
      fetchVerifications();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error rejecting user');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, config);
      setMessage('User deleted successfully');
      fetchUsers();
      fetchStats();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error deleting user');
    }
  };

  const dismissReport = async (reportId) => {
    try {
        await axios.delete(`${API_BASE}/api/admin/reports/${reportId}`, config);
        fetchReports();
        fetchStats();
    } catch (err) {
        console.error(err);
    }
  };

  const deleteContent = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
        await axios.delete(`${API_BASE}/api/admin/content/post/${postId}`, config);
        setMessage('Content deleted');
        fetchReports();
        fetchStats();
        setTimeout(() => setMessage(''), 3000);
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <h1>🛡️ Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'verifications' ? 'active' : ''} onClick={() => setActiveTab('verifications')}>Verifications {stats?.pendingVerifications > 0 && <span className="badge">{stats.pendingVerifications}</span>}</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Reports {stats?.totalReports > 0 && <span className="badge">{stats.totalReports}</span>}</button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-content">
        {activeTab === 'overview' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p>{stats.totalUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Verified Users</h3>
              <p>{stats.verifiedUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Verifications</h3>
              <p>{stats.pendingVerifications}</p>
            </div>
            <div className="stat-card">
              <h3>Total Reports</h3>
              <p>{stats.totalReports}</p>
            </div>
            <div className="stat-card">
                <h3>Total Posts</h3>
                <p>{stats.totalPosts}</p>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="list-container">
            {loading ? <p>Loading...</p> : verifications.length === 0 ? <p>No pending verifications.</p> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>ID Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(u => (
                    <tr key={u.id}>
                      <td data-label="Username">{u.username}</td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="ID Image">
                        {u.verificationImage ? (
                            <a href={`${API_BASE}/${u.verificationImage}`} target="_blank" rel="noopener noreferrer">View ID</a>
                        ) : 'No Image'}
                      </td>
                      <td data-label="Actions">
                        <button onClick={() => verifyUser(u.id)} className="btn-approve">Approve</button>
                        <button onClick={() => rejectUser(u.id)} className="btn-reject">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="list-container">
            {loading ? <p>Loading...</p> : (
               <table className="admin-table">
               <thead>
                 <tr>
                   <th>ID</th>
                   <th>Username</th>
                   <th>Email</th>
                   <th>Role</th>
                   <th>Status</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id}>
                     <td data-label="ID">{u.id}</td>
                     <td data-label="Username">{u.username}</td>
                     <td data-label="Email">{u.email}</td>
                     <td data-label="Role">{u.role}</td>
                     <td data-label="Status">
                        {u.isVerified ? <span className="status-verified">Verified</span> : <span className="status-unverified">Unverified</span>}
                     </td>
                     <td data-label="Actions">
                       {u.role !== 'admin' && (
                           <button onClick={() => deleteUser(u.id)} className="btn-delete">Delete</button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="list-container">
            {loading ? <p>Loading...</p> : reports.length === 0 ? <p>No active reports.</p> : (
                <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reporter</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id}>
                      <td data-label="Reporter">{r.reporter?.username}</td>
                      <td data-label="Type">{r.targetType} (ID: {r.reportedTargetId})</td>
                      <td data-label="Reason">{r.reason}</td>
                      <td data-label="Date">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td data-label="Actions">
                        {r.targetType === 'Post' && (
                             <button onClick={() => deleteContent(r.reportedTargetId)} className="btn-delete-content">Delete Content</button>
                        )}
                        <button onClick={() => dismissReport(r.id)} className="btn-dismiss">Dismiss</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
