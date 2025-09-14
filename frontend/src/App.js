import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Toaster } from './components/ui/sonner';
import  AuthContext  from './context/AuthContext';
import PrivateRoute from './components/ui/PrivateRoute';
import Login from './pages/Login'; 
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; 
import Navigation from './pages/Navigation';
import LoanCalculator from './pages/LoanCalculator';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Goals from './pages/Goals';
import Investments from './pages/Investments';
import Budgets from './pages/Budgets';
import AIChat from './pages/AIChat';

// Main App Component
function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="min-h-screen bg-gray-50">
          {/* Only show navbar if user is logged in */}
          {user && <Navigation />}

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/loans" element={<LoanCalculator />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/income" element={<Income />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/ai-chat" element={<AIChat />} />
            </Route>

          </Routes>
        <Toaster />
    </div>
  );
}

export default App;