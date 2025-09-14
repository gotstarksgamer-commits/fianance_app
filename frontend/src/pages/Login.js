import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL } from '../constants/api';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, formData);
      const { access_token, refresh_token } = res.data;
      if (!access_token || !refresh_token) throw new Error("Missing tokens in response");
      login(access_token, refresh_token);
      navigate("/dashboard");
      toast.success("Logged in successfully!");
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Login failed";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">Finance Tracker</h1>
          <p className="mt-2 text-gray-300">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border-gray-700 bg-gray-800/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border-gray-700 bg-gray-800/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2 text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Login
          </button>
          <p className="text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;