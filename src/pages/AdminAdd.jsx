import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import Loader from '../components/Loader';
import adminService from '../services/adminService';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminAdd() {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const editAdmin = location.state && location.state.editAdmin ? location.state.editAdmin : null;

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', mobile: '', password: '', emirates: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (editAdmin) {
      const [firstName, ...last] = (editAdmin.name || '').split(' ');
      setFormData({
        firstName,
        lastName: last.join(' '),
        email: editAdmin.email || '',
        mobile: editAdmin.mobile || '',
        password: '',
        emirates: editAdmin.emirate || '',
        type: editAdmin.type || ''
      });
    }
  }, [editAdmin]);

  useEffect(() => {
    if (showSuccessPopup) {
      const tmr = setTimeout(() => setShowSuccessPopup(false), 1800);
      return () => clearTimeout(tmr);
    }
  }, [showSuccessPopup]);

  const handleInputChange = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.email && formData.mobile && (editAdmin ? true : formData.password) && formData.emirates && formData.type;
  };

  const save = async () => {
    if (!isFormValid()) return;
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      emirate: formData.emirates,
      type: formData.type,
      mobile: formData.mobile,
      password: formData.password
    };
    setLoading(true);
    let savedItem = null;
    try {
      if (editAdmin && editAdmin.id) {
        const saved = await adminService.updateAdmin(editAdmin.id, payload);
        savedItem = saved || { id: editAdmin.id, ...payload };
        // best-effort local update
        try {
          const raw = localStorage.getItem('admins');
          const arr = raw ? JSON.parse(raw) : [];
          const updated = arr.map(a => a.id === editAdmin.id ? (savedItem) : a);
          localStorage.setItem('admins', JSON.stringify(updated));
        } catch (e) {}
      } else {
        const saved = await adminService.createAdmin(payload);
        savedItem = saved || { id: Date.now(), ...payload };
        try {
          const raw = localStorage.getItem('admins');
          const arr = raw ? JSON.parse(raw) : [];
          arr.push(savedItem);
          localStorage.setItem('admins', JSON.stringify(arr));
        } catch (e) {}
      }
      setShowSuccessPopup(true);
      setTimeout(() => navigate('/dashboard/manageAdmins', { state: { updatedAdmin: savedItem, isEdit: !!editAdmin } }), 800);
    } catch (e) {
      // fallback: persist locally and navigate with created item
      try {
        const raw = localStorage.getItem('admins');
        const arr = raw ? JSON.parse(raw) : [];
        if (editAdmin && editAdmin.id) {
          const updated = arr.map(a => a.id === editAdmin.id ? ({ id: editAdmin.id, ...payload }) : a);
          savedItem = { id: editAdmin.id, ...payload };
          localStorage.setItem('admins', JSON.stringify(updated));
        } else {
          const item = { id: Date.now(), ...payload };
          savedItem = item;
          arr.push(item);
          localStorage.setItem('admins', JSON.stringify(arr));
        }
      } catch (er) {}
      setShowSuccessPopup(true);
      setTimeout(() => navigate('/dashboard/manageAdmins', { state: { updatedAdmin: savedItem, isEdit: !!editAdmin } }), 800);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      {showSuccessPopup && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0"><Check className="h-5 w-5 text-green-600"/></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{t('admin.adminAdded')}</p>
                <p className="text-sm text-green-700">{t('admin.adminAddedDesc')}</p>
              </div>
            </div>
            <button onClick={() => setShowSuccessPopup(false)} className="flex-shrink-0 ml-4 text-green-400 hover:text-green-600"><X className="h-5 w-5"/></button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{editAdmin ? t('admin.editAdmin') : t('admin.addNewAdmin')}</h1>
      <p className="text-gray-600 mb-6">{t('admin.enterDetails')}</p>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.firstName')}</label>
          <input type="text" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.lastName')}</label>
          <input type="text" value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailAddress')}</label>
          <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.mobileNumber')}</label>
          <input type="tel" value={formData.mobile} onChange={e => handleInputChange('mobile', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.password')}</label>
          <input type="password" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emirates')}</label>
          <select value={formData.emirates} onChange={e => handleInputChange('emirates', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg appearance-none bg-white">
            <option value="">{t('admin.selectEmirates')}</option>
            <option value="Abu Dhabi">Abu Dhabi</option>
            <option value="Dubai">Dubai</option>
            <option value="Sharjah">Sharjah</option>
            <option value="Ajman">Ajman</option>
            <option value="Umm Al Quwain">Umm Al Quwain</option>
            <option value="Ras Al Khaimah">Ras Al Khaimah</option>
            <option value="Fujairah">Fujairah</option>
          </select>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.type')}</label>
        <select value={formData.type} onChange={e => handleInputChange('type', e.target.value)} className="w-full max-w-sm px-3 py-3 border border-gray-300 rounded-lg">
          <option value="">{t('admin.selectType')}</option>
          <option value="Admin">Admin</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Moderator">Moderator</option>
        </select>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-300">
        <div className="flex items-center text-gray-500"><span className="text-sm">{t('admin.notSaved')}</span></div>
        <div className="flex space-x-3">
          <button onClick={() => navigate('/dashboard/manageAdmins')} className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg">{t('admin.cancel')}</button>
          <button onClick={save} disabled={!isFormValid()} className="px-6 py-2 bg-green-600 text-white rounded-lg">{editAdmin ? t('admin.save') : t('admin.addAdminBtn')}</button>
        </div>
      </div>
    </div>
  );
}
