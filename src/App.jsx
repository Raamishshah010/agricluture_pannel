import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./pages/auth/LoginPage";
import DashboardLayout from "./pages/layout/DashboardLayout.jsx";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { Conform } from "./pages/auth/ConformEmail";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { UaePassLogin } from "./pages/auth/UaePassLogin";
import useStore from './store/store.js'
import service from './services/adminService.js'
import farmService from './services/farmService.js'
import farmerService from './services/farmerService.js'
import { toast } from "react-toastify";


function App() {
  const { setCrops, setFarms, setFarmers, setDashboardLoading, adminToken, setAdminToken } = useStore((state) => state);
  useEffect(() => {
    if (!adminToken) {
      const token = sessionStorage.getItem('adminToken');
      if (token) {
        setAdminToken(token);
        return;
      }
      setDashboardLoading('masterData', false);
      setDashboardLoading('farms', false);
      setDashboardLoading('farmers', false);
      return;
    }

    const loadMasterData = async () => {
      setDashboardLoading('masterData', true);
      try {
        const res = await service.getMasterData();
        setCrops(res);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setDashboardLoading('masterData', false);
      }
    };

    const loadFarms = async () => {
      setDashboardLoading('farms', true);
      try {
        const res = await farmService.getAllfarms();
        setFarms(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setDashboardLoading('farms', false);
      }
    };

    const loadFarmers = async () => {
      setDashboardLoading('farmers', true);
      try {
        const res = await farmerService.getAllFarmers();
        setFarmers(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setDashboardLoading('farmers', false);
      }
    };

    void Promise.allSettled([loadMasterData(), loadFarms(), loadFarmers()]);
  }, [adminToken, setCrops, setFarms, setFarmers, setDashboardLoading, setAdminToken]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/conform" element={<Conform />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/ue-pass" element={<UaePassLogin />} />

        <Route
          path="/dashboard/*"
          element={adminToken ? <DashboardLayout /> : <Navigate to="/" replace />}
        />

        <Route path="*" element={<h2>Page not found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
