import React, { useState, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const AdminManagementFlow = () => {
  const t = useTranslation();
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    emirates: '',
    type: ''
  });
  const [admins, setAdmins] = useState([]);

  // Auto-dismiss success popup after 2 seconds
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.email && 
           formData.mobile && formData.password && formData.emirates && formData.type;
  };

  const handleAddAdmin = () => {
    if (isFormValid()) {
      // Add admin to list
      const newAdmin = {
        id: Date.now(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        emirate: formData.emirates,
        type: formData.type,
        mobile: formData.mobile
      };
      
      setAdmins(prev => [...prev, newAdmin]);
      setCurrentScreen(3);
      setShowSuccessPopup(true);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      password: '',
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
      password: '',
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
      password: 'Mossad_987',
      emirates: 'Abu Dhabi',
      type: 'Admin'
    });
    setCurrentScreen(2);
  };

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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.password')}</label>
            <input
              type="password"
              placeholder={t('admin.writeNewPassword')}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full max-w-sm px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">{t('admin.selectType')}</option>
            <option value="Admin">Admin</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Moderator">Moderator</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.password')}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
              <option value="">Select which emirates for the new admin</option>
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
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full max-w-sm px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">Select the type for the admin</option>
            <option value="Admin">Admin</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Moderator">Moderator</option>
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
            <button
              onClick={startNewAdmin}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.addAdminBtn')}
            </button>
          </div>
        </div>

        <div className="">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700 uppercase tracking-wider">
              <div>{t('admin.adminName')}</div>
              <div>{t('admin.email')}</div>
              <div>{t('admin.emirate')}</div>
              <div>{t('admin.adminType')}</div>
              <div>{t('admin.mobileNumberHeader')}</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <div key={admin.id} className="px-6 py-4">
                <div className="grid grid-cols-5 gap-4 text-sm text-gray-900">
                  <div className="font-medium">{admin.name}</div>
                  <div className="truncate">{admin.email}</div>
                  <div>{admin.emirate}</div>
                  <div>{admin.type}</div>
                  <div>{admin.mobile}</div>
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
  }

  return null;
};

export default AdminManagementFlow;