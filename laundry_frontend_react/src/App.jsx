import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthView from './views/AuthView';
import CustomerDashboard from './views/CustomerDashboard';
import StaffDashboard from './views/StaffDashboard';
import AdminDashboard from './views/AdminDashboard';
import TopNav from './components/TopNav';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('laundry_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('laundry_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('laundry_user');
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background">
        {user && <TopNav user={user} onLogout={handleLogout} />}
        
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={
              !user ? <AuthView onLogin={handleLogin} /> : 
              user.role === 'admin' ? <Navigate to="/admin" /> :
              user.role === 'staff' ? <Navigate to="/staff" /> :
              <Navigate to="/dashboard" />
            } />
            <Route path="/dashboard" element={user?.role === 'customer' ? <CustomerDashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/staff" element={user?.role === 'staff' ? <StaffDashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
