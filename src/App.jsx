import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./pages/auth/LoginPage";
import DashboardLayout from "./pages/layout/DashboardLayout.jsx";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { Conform } from "./pages/auth/ConformEmail";
import { ResetPassword } from "./pages/auth/ResetPassword";
import useStore from './store/store.js'
import service from './services/adminService.js'
import farmService from './services/farmService.js'
import farmerService from './services/farmerService.js'
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";


function App() {
  const { setCrops, setFarms, setFarmers, setLoading, loading } = useStore((state) => state);
  useEffect(() => {

    Promise.all([service.getMasterData(), farmService.getAllfarms(), farmerService.getAllFarmers()]).then(res => {
      setCrops(res[0]);
      setFarms(res[1].data);
      setFarmers(res[2].data);
      setLoading(false);
    })
      .catch(err => {
        toast.error(err.message);
      });
  }, [setCrops, setFarms, setFarmers, setLoading]);
  return !loading ? (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/conform" element={<Conform />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/dashboard" element={<DashboardLayout />} />

        <Route path="*" element={<h2>Page not found</h2>} />
      </Routes>
    </Router>
  ) : <div className="relative h-screen">
    <Loader2 className="absolute left-1/2 top-1/2 transform -translate-y-1/2 w-10 h-10 text-green-500 animate-spin" />
  </div>;
}

export default App;
