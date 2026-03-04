import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import Loader from '../components/Loader';
import adminService from '../services/adminService';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminManage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  /* =============================
     Load Admins
  ============================== */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAdmins();
        if (mounted && Array.isArray(data)) {
          setAdmins(data);
          localStorage.setItem('admins', JSON.stringify(data));
        }
      } catch (e) {
        const raw = localStorage.getItem('admins');
        if (raw && mounted) {
          setAdmins(JSON.parse(raw));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* =============================
     Apply updated admin from Add/Edit
  ============================== */
  useEffect(() => {
    if (location?.state?.updatedAdmin) {
      const { updatedAdmin, isEdit } = location.state;

      setAdmins(prev => {
        if (!updatedAdmin) return prev;

        if (isEdit) {
          return prev.map(a =>
            a.id === updatedAdmin.id ? updatedAdmin : a
          );
        }

        if (prev.some(a => a.id === updatedAdmin.id)) return prev;

        return [...prev, updatedAdmin];
      });

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  /* =============================
     Selection Logic
  ============================== */
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.length === admins.length
        ? []
        : admins.map(a => a.id)
    );
  };

  /* =============================
     Delete One
  ============================== */
  const deleteOne = async (id) => {
    if (!window.confirm(t('admin.deleteConfirm') || 'Delete this admin?')) return;

    setLoading(true);
    try {
      await adminService.deleteAdmin(id);
    } catch (e) {}

    const updated = admins.filter(a => a.id !== id);
    setAdmins(updated);
    localStorage.setItem('admins', JSON.stringify(updated));
    setSelectedIds(prev => prev.filter(x => x !== id));
    setLoading(false);
  };

  /* =============================
     Delete Selected
  ============================== */
  const deleteSelected = async () => {
    if (!selectedIds.length) return;

    if (!window.confirm(
      t('admin.deleteSelectedConfirm') ||
      `Delete ${selectedIds.length} selected admins?`
    )) return;

    setLoading(true);

    await Promise.all(
      selectedIds.map(id =>
        adminService.deleteAdmin(id).catch(() => null)
      )
    );

    const updated = admins.filter(a => !selectedIds.includes(a.id));
    setAdmins(updated);
    localStorage.setItem('admins', JSON.stringify(updated));
    setSelectedIds([]);
    setLoading(false);
  };

  /* =============================
     Export CSV
  ============================== */
  const exportSelectedCSV = () => {
    const rows = (
      selectedIds.length
        ? admins.filter(a => selectedIds.includes(a.id))
        : admins
    ).map(a => [
      a.name,
      a.email,
      a.emirate,
      a.type,
      a.mobile
    ]);

    const header = [
      t('admin.adminName'),
      t('admin.email'),
      t('admin.emirate'),
      t('admin.adminType'),
      t('admin.mobileNumberHeader')
    ];

    const csv = [header, ...rows]
      .map(r =>
        r.map(cell =>
          `"${(cell || '').toString().replace(/"/g, '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admins_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* =============================
     Render
  ============================== */
  if (loading) return <Loader />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('admin.adminManagement')}
        </h1>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedIds.length} {t('common.selected')}
            </div>
          )}

          <button
            onClick={exportSelectedCSV}
            className="px-3 py-2 bg-gray-100 rounded-lg"
          >
            {t('common.export')}
          </button>

          <button
            onClick={deleteSelected}
            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
          >
            {t('admin.deleteSelected')}
          </button>

          <button
            onClick={() => navigate('/dashboard/addAdmin')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addAdminBtn')}
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 uppercase tracking-wider items-center">
          <div>
            <input
              type="checkbox"
              checked={
                selectedIds.length === admins.length &&
                admins.length > 0
              }
              onChange={toggleSelectAll}
            />
          </div>
          <div>{t('admin.adminName')}</div>
          <div>{t('admin.email')}</div>
          <div>{t('admin.emirate')}</div>
          <div>{t('admin.adminType')}</div>
          <div>{t('admin.mobileNumberHeader')}</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {admins.map(admin => (
          <div
            key={admin.id}
            className="px-6 py-4 flex items-center justify-between"
          >
            <div className="grid grid-cols-6 gap-4 text-sm text-gray-900 items-center w-full">
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(admin.id)}
                  onChange={() => toggleSelect(admin.id)}
                />
              </div>
              <div className="font-medium">{admin.name}</div>
              <div className="truncate">{admin.email}</div>
              <div>{admin.emirate}</div>
              <div>{admin.type}</div>
              <div>{admin.mobile}</div>
            </div>

            <div className="ml-4 flex gap-2">
              <button
                onClick={() =>
                  navigate('/dashboard/addAdmin', {
                    state: { editAdmin: admin }
                  })
                }
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit2 size={16} />
              </button>

              <button
                onClick={() => deleteOne(admin.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {admins.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>{t('admin.noAdmins')}</p>
            <p className="text-sm mt-1">
              {t('admin.clickAddAdmin')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}