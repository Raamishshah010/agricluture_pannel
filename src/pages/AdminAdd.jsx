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
  const adminUuid = editAdmin?.uuid || editAdmin?.id || editAdmin?._id || '';

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', mobile: '', emirateId: '', emirates: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [origData, setOrigData] = useState(null);
  const [attemptedSave, setAttemptedSave] = useState(false);

  useEffect(() => {
    if (editAdmin) {
      const parts = (editAdmin.name || '').toString().trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      setFormData({
        firstName,
        lastName,
        email: editAdmin.email || '',
        mobile: editAdmin.mobile || '',
        emirateId: editAdmin.emirateId || editAdmin.emiratesId || editAdmin.uuid || '',
        emirates: editAdmin.emirate || '',
        type: editAdmin.type || ''
      });
      setOrigData({
        firstName,
        lastName,
        email: editAdmin.email || '',
        mobile: editAdmin.mobile || '',
        emirateId: editAdmin.emirateId || editAdmin.emiratesId || editAdmin.uuid || '',
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
  // Clear API error whenever user edits the form
  useEffect(() => {
    setApiError(null);
    // any change should reset attemptedSave so validation helper isn't shown prematurely
    setAttemptedSave(false);
  }, [formData.firstName, formData.lastName, formData.email, formData.mobile, formData.emirateId, formData.emirates, formData.type]);

  const isFormValid = () => {
    // When editing: require firstName and at least one changed field (or a new password)
    if (editAdmin) {
      if (!formData.firstName) return false;
      // if we don't have original data, be conservative
      if (!origData) return Boolean(formData.email && formData.mobile && formData.type);

      const nameChanged = (`${formData.firstName} ${formData.lastName}`.trim() !== `${origData.firstName} ${origData.lastName}`.trim());
      const emailChanged = (formData.email !== origData.email);
      const mobileChanged = (formData.mobile !== origData.mobile);
      const emirateIdChanged = (formData.emirateId !== origData.emirateId);
      const emirateChanged = (formData.emirates !== origData.emirates);
      const typeChanged = (formData.type !== origData.type);
      return nameChanged || emailChanged || mobileChanged || emirateIdChanged || emirateChanged || typeChanged;
    }
    // When adding: require full data including password and last name.
    // Required for add: firstName, lastName, email, mobile, type
    return Boolean(formData.firstName && formData.lastName && formData.email && formData.mobile && formData.type);
  };

  const getMissingFields = () => {
    const missing = [];
    if (!formData.firstName) missing.push(t('admin.firstName'));
    if (!editAdmin && !formData.lastName) missing.push(t('admin.lastName'));
    if (!formData.email) missing.push(t('admin.emailAddress'));
    if (!formData.mobile) missing.push(t('admin.mobileNumber'));
    if (!formData.type) missing.push(t('admin.type'));
    return missing;
  };

  const save = async () => {
    setAttemptedSave(true);
    if (!isFormValid()) return;
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      emirateId: formData.emirateId,
      emirate: formData.emirates,
      type: formData.type,
      mobile: formData.mobile,
    };
    setLoading(true);
    let savedItem = null;
    try {
      if (editAdmin && editAdmin.id) {
        const saved = await adminService.updateAdmin(editAdmin.id, payload);
        // normalize response shape (some APIs return { admin: {...} })
        let savedAdmin = saved;
        if (saved && saved.admin) savedAdmin = saved.admin;
        if (savedAdmin && savedAdmin._id && !savedAdmin.id) savedAdmin.id = savedAdmin._id;
        savedItem = savedAdmin || { id: editAdmin.id, ...payload };
        // best-effort local update
        try {
          const raw = localStorage.getItem('admins');
          const arr = raw ? JSON.parse(raw) : [];
          const updated = arr.map(a => a.id === editAdmin.id ? (savedItem) : a);
          localStorage.setItem('admins', JSON.stringify(updated));
        } catch (e) {}
      } else {
        const saved = await adminService.createAdmin(payload);
        let savedAdmin = saved;
        if (saved && saved.admin) savedAdmin = saved.admin;
        if (savedAdmin && savedAdmin._id && !savedAdmin.id) savedAdmin.id = savedAdmin._id;
        savedItem = savedAdmin || { id: Date.now(), ...payload };
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
      // surface API error for the user
      try {
        const msg = (e && e.response && e.response.data && (e.response.data.message || e.response.data.error)) || e.message || 'Save failed';
        setApiError(msg);
      } catch (err) {
        setApiError('Save failed');
      }
      // fallback: persist locally and navigate with created item
      try {
        const raw = localStorage.getItem('admins');
        const arr = raw ? JSON.parse(raw) : [];
        if (editAdmin && editAdmin.id) {
          const updated = arr.map(a => (a.id === editAdmin.id || a._id === editAdmin.id) ? ({ id: editAdmin.id, ...payload }) : a);
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

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-gray-700">{t('admin.uuid')}</span>
          <span className="text-sm text-gray-900 break-all">
            {editAdmin ? adminUuid || t('common.nA') : t('admin.uuidGeneratedAfterSave')}
          </span>
        </div>
      </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emiratesId')}</label>
          <input
            type="text"
            value={formData.emirateId}
            onChange={e => handleInputChange('emirateId', e.target.value)}
            placeholder={t('admin.enterEmiratesId')}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emirates')}</label>
          <select value={formData.emirates} onChange={e => handleInputChange('emirates', e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg appearance-none bg-white">
            <option value="">{t('admin.selectEmirates')}</option>
            <option value="Abu Dhabi">{t('admin.emirateNames.abuDhabi')}</option>
            <option value="Dubai">{t('admin.emirateNames.dubai')}</option>
            <option value="Sharjah">{t('admin.emirateNames.sharjah')}</option>
            <option value="Ajman">{t('admin.emirateNames.ajman')}</option>
            <option value="Umm Al Quwain">{t('admin.emirateNames.ummAlQuwain')}</option>
            <option value="Ras Al Khaimah">{t('admin.emirateNames.rasAlKhaimah')}</option>
            <option value="Fujairah">{t('admin.emirateNames.fujairah')}</option>
          </select>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.type')}</label>
        <select value={formData.type} onChange={e => handleInputChange('type', e.target.value)} className="w-full max-w-sm px-3 py-3 border border-gray-300 rounded-lg">
          <option value="">{t('admin.selectType')}</option>
          <option value="Admin">{t('admin.roleNames.admin')}</option>
          <option value="Super Admin">{t('admin.roleNames.superAdmin')}</option>
          <option value="Moderator">{t('admin.roleNames.moderator')}</option>
        </select>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-300">
        <div className="flex items-center text-gray-500"><span className="text-sm">{t('admin.notSaved')}</span></div>
        <div className="flex space-x-3">
          <button onClick={() => navigate('/dashboard/manageAdmins')} className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg">{t('admin.cancel')}</button>
          <button
            type="button"
            onClick={save}
            disabled={!isFormValid()}
            aria-disabled={!isFormValid()}
            className={`px-6 py-2 rounded-lg text-white ${isFormValid() ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400 opacity-60 cursor-not-allowed'}`}
          >
            {editAdmin ? t('admin.save') : t('admin.addAdminBtn')}
          </button>
        </div>
      </div>

      {/* Validation helper (only after user tried to save) */}
      {attemptedSave && !isFormValid() && (
        <div className="mt-3 text-sm text-red-600">
          {t('admin.fixErrors') || 'Please fill required fields:'} {getMissingFields().join(', ')}
        </div>
      )}
      {apiError && (
        <div className="mt-2 text-sm text-red-700">{apiError}</div>
      )}
    </div>
  );
}
