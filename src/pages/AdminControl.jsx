import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Edit2, Trash2 } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import Loader from '../components/Loader';
import adminService from '../services/adminService';
import useStore from '../store/store';
import { getLocalizedPersonName } from '../utils/localizedName';

const AdminManagementFlow = () => {
  const t = useTranslation();
  const { language } = useStore((state) => state);
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    emirates: '',
    type: ''
  });
  const [admins, setAdmins] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const getEmirateLabel = (value) => {
    const labels = {
      'Abu Dhabi': t('admin.emirateNames.abuDhabi'),
      Dubai: t('admin.emirateNames.dubai'),
      Sharjah: t('admin.emirateNames.sharjah'),
      Ajman: t('admin.emirateNames.ajman'),
      'Umm Al Quwain': t('admin.emirateNames.ummAlQuwain'),
      'Ras Al Khaimah': t('admin.emirateNames.rasAlKhaimah'),
      Fujairah: t('admin.emirateNames.fujairah')
    };

    return labels[value] || value;
  };

  const getTypeLabel = (value) => {
    const labels = {
      Admin: t('admin.roleNames.admin'),
      'Super Admin': t('admin.roleNames.superAdmin'),
      Moderator: t('admin.roleNames.moderator')
    };

    return labels[value] || value;
  };
  const getAdminName = (admin) => getLocalizedPersonName(admin, language) || t('common.nA');

  // Auto-dismiss success popup after 2 seconds
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  // load persisted admins
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAdmins();
        if (mounted && Array.isArray(data)) {
          setAdmins(data);
          try { localStorage.setItem('admins', JSON.stringify(data)); } catch (e) {}
        }
      } catch (e) {
        // fallback to localStorage when API unavailable
        try {
          const raw = localStorage.getItem('admins');
          if (raw && mounted) setAdmins(JSON.parse(raw));
        } catch (err) {}
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleEdit = (admin) => {
    const [firstName, ...last] = admin.name.split(' ');
    setFormData({
      firstName,
      lastName: last.join(' '),
      email: admin.email,
      mobile: admin.mobile,
      emirates: admin.emirate,
      type: admin.type
    });
    setEditingId(admin.id);
    setCurrentScreen(2);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('admin.deleteConfirm'))) {
      (async () => {
        setLoading(true);
        try {
          await adminService.deleteAdmin(id);
        } catch (e) {
          // ignore API error and proceed with local deletion
        }
        const updated = admins.filter(a => a.id !== id);
        setAdmins(updated);
        try { localStorage.setItem('admins', JSON.stringify(updated)); } catch (er) {}
        setSelectedIds(prev => prev.filter(pid => pid !== id));
        setLoading(false);
      })();
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === admins.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(admins.map(a => a.id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(t('admin.deleteSelectedConfirm'))) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => adminService.deleteAdmin(id).catch(() => null)));
    } catch (e) {
      // ignore
    }
    const updated = admins.filter(a => !selectedIds.includes(a.id));
    setAdmins(updated);
    try { localStorage.setItem('admins', JSON.stringify(updated)); } catch (er) {}
    setSelectedIds([]);
    setLoading(false);
  };

  const exportSelectedCSV = () => {
    const rows = (selectedIds.length ? admins.filter(a => selectedIds.includes(a.id)) : admins).map(a => [getAdminName(a), a.email, a.emirate, a.type, a.mobile]);
    const header = [t('admin.adminName'), t('admin.email'), t('admin.emirate'), t('admin.adminType'), t('admin.mobileNumberHeader')];
    const csv = [header, ...rows].map(r => r.map(cell => `"${(cell||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.email &&
           formData.mobile && formData.emirates && formData.type;
  };

  const handleAddAdmin = () => {
    if (isFormValid()) {
      const newAdmin = {
        id: editingId || Date.now(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        emirate: formData.emirates,
        type: formData.type,
        mobile: formData.mobile,
      };
      };

      (async () => {
        setLoading(true);
        try {
          let saved;
          if (editingId) {
            saved = await adminService.updateAdmin(editingId, newAdmin);
            setAdmins(prev => prev.map(a => a.id === editingId ? (saved || newAdmin) : a));
          } else {
            saved = await adminService.createAdmin(newAdmin);
            setAdmins(prev => [...prev, (saved || newAdmin)]);
          }
          try { localStorage.setItem('admins', JSON.stringify(editingId ? admins.map(a => a.id === editingId ? (saved || newAdmin) : a) : [...admins, (saved || newAdmin)])); } catch (e) {}
          setEditingId(null);
          setCurrentScreen(3);
          setShowSuccessPopup(true);
        } catch (e) {
          // fallback to local storage update
          const updated = editingId ? admins.map(a => a.id === editingId ? newAdmin : a) : [...admins, newAdmin];
          setAdmins(updated);
          try { localStorage.setItem('admins', JSON.stringify(updated)); } catch (er) {}
          setEditingId(null);
          setCurrentScreen(3);
          setShowSuccessPopup(true);
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      emirates: '',
      type: ''
    });
    setCurrentScreen(1);
  };

  const startNewAdmin = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      emirates: '',
      type: ''
    });
    setCurrentScreen(1);
  };

  // Simulate form being filled (for demonstration)
  const fillSampleData = () => {
    setFormData({
      firstName: 'Ahmed',
      lastName: 'Mossad',
      email: 'Ahmed_Mossad20@Mazraty.com',
      mobile: '+201112649782',
      emirates: 'Abu Dhabi',
      type: 'Admin'
    });
    setCurrentScreen(2);
  };

  if (loading) {
    return <Loader />;
  }

  if (currentScreen === 1) {
    return (
      <div className="p-6 ">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('admin.addNewAdmin')}</h1>
          <p className="text-gray-600">{t('admin.enterDetails')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.firstName')}</label>
            <input
              type="text"
              placeholder={t('admin.enterAdminFirstName')}
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.lastName')}</label>
            <input
              type="text"
              placeholder={t('admin.enterAdminLastName')}
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailAddress')}</label>
            <input
              type="email"
              placeholder={t('admin.enterAdminEmail')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.mobileNumber')}</label>
            <input
              type="tel"
              placeholder={t('admin.enterApplicantMobile')}
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emirates')}</label>
            <select
              value={formData.emirates}
              onChange={(e) => handleInputChange('emirates', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
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
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full max-w-sm px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">{t('admin.selectType')}</option>
            <option value="Admin">{t('admin.roleNames.admin')}</option>
            <option value="Super Admin">{t('admin.roleNames.superAdmin')}</option>
            <option value="Moderator">{t('admin.roleNames.moderator')}</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-300">
          <div className="flex items-center text-gray-500">
            <span className="text-sm">{t('admin.notSaved')}</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full ml-2"></div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('admin.cancel')}
            </button>
            <button
              onClick={fillSampleData}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('admin.addAdminBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 2) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('admin.addNewAdmin')}</h1>
          <p className="text-gray-600">{t('admin.enterDetails')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.firstName')}</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.lastName')}</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emailAddress')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.mobileNumber')}</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.emirates')}</label>
            <select
              value={formData.emirates}
              onChange={(e) => handleInputChange('emirates', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
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
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full max-w-sm px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">{t('admin.selectType')}</option>
            <option value="Admin">{t('admin.roleNames.admin')}</option>
            <option value="Super Admin">{t('admin.roleNames.superAdmin')}</option>
            <option value="Moderator">{t('admin.roleNames.moderator')}</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-300">
          <div className="flex items-center text-gray-500">
            <span className="text-sm">{t('admin.notSaved')}</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full ml-2"></div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('admin.cancel')}
            </button>
            <button
              onClick={handleAddAdmin}
              disabled={!isFormValid()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('admin.addAdminBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 3) {
    return (
      <div className="p-6 relative">
        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{t('admin.adminAdded')}</p>
                  <p className="text-sm text-green-700">{t('admin.adminAddedDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="flex-shrink-0 ml-4 text-green-400 hover:text-green-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">{t('admin.adminManagement')}</h1>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <div className="text-sm text-gray-600">{selectedIds.length} {t('common.selected')}</div>
              )}
              <button onClick={exportSelectedCSV} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.export')}</button>
              <button onClick={deleteSelected} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">{t('admin.deleteSelected')}</button>
              <button
                onClick={startNewAdmin}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addAdminBtn')}
              </button>
            </div>
          </div>
        </div>

        <div className="">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 uppercase tracking-wider items-center">
              <div className="w-4">
                <input type="checkbox" checked={selectedIds.length === admins.length && admins.length>0} onChange={toggleSelectAll} />
              </div>
              <div className="col-span-1">{t('admin.adminName')}</div>
              <div className="col-span-1">{t('admin.email')}</div>
              <div className="col-span-1">{t('admin.emirate')}</div>
              <div className="col-span-1">{t('admin.adminType')}</div>
              <div className="col-span-1">{t('admin.mobileNumberHeader')}</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <div key={admin.id} className="px-6 py-4 flex items-center justify-between">
                <div className="w-full">
                  <div className="grid grid-cols-6 gap-4 text-sm text-gray-900 items-center">
                    <div>
                      <input type="checkbox" checked={selectedIds.includes(admin.id)} onChange={() => toggleSelect(admin.id)} />
                    </div>
                    <div className="font-medium">{getAdminName(admin)}</div>
                    <div className="truncate">{admin.email}</div>
                    <div>{getEmirateLabel(admin.emirate)}</div>
                    <div>{getTypeLabel(admin.type)}</div>
                    <div>{admin.mobile}</div>
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <button onClick={() => handleEdit(admin)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(admin.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-500">
                <p>{t('admin.noAdmins')}</p>
                <p className="text-sm mt-1">{t('admin.clickAddAdmin')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  

  return null;
};

export default AdminManagementFlow;
