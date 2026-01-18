import React, { useState } from 'react';
import { Search, Download, ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const filterOptions = {
  emirate: ['All', 'Ras Al Khaimah', 'Dubai', 'Abu Dhabi', 'Sharjah'],
  season: ['All', 'Winter', 'Summer', 'Spring', 'Autumn'],
  crop: ['All', 'Fruit trees and palm trees', 'Vegetables', 'Grains'],
  reportType: ['All', 'Monthly', 'Quarterly', 'Annual'],
};

  const data = [
    {
      id: 1,
      owner: "Sultan bin Humaid bin Mohammed Al Qasimi",
      emirate: "Ras Al Khaimah",
      cropType: "Fruit trees and palm trees",
      cropArea: 375,
      location: "Azn",
      irrigation: "H"
    },
    {
      id: 2,
      owner: "On Hassan Mohammed Ibrahim Al Zaabi",
      emirate: "Ras Al Khaimah",
      cropType: "Fruit trees and palm trees",
      cropArea: 375,
      location: "Azn",
      irrigation: "H"
    },
    {
      id: 3,
      owner: "Rashid Saif Rashid Saif Al Mazrouei",
      emirate: "Ras Al Khaimah",
      cropType: "Fruit trees and palm trees",
      cropArea: 375,
      location: "Azn",
      irrigation: "H"
    },
    {
      id: 4,
      owner: "Rashid Jassim Obaid Al Abdoli",
      emirate: "Ras Al Khaimah",
      cropType: "Fruit trees and palm trees",
      cropArea: 375,
      location: "Azn",
      irrigation: "H"
    },
    {
      id: 5,
      owner: "Abdulrahman Jassim Obaid Salem Al-Abdouli",
      emirate: "Ras Al Khaimah",
      cropType: "Fruit trees and palm trees",
      cropArea: 375,
      location: "Azn",
      irrigation: "H"
    },
    {
      id: 6,
      owner: "Salem Saif Salem bin Issa Al Mazrouei",
      emirate: "Ras Al Khaimah",
      cropType: "Fruit trees and palm trees",
      cropArea: 375,
      location: "Azn",
      irrigation: "H"
    }
  ];

const CustomDropdown = ({ label, value, options, onChange, open, onOpen, onClose }) => (
  <div className="relative min-w-[120px]">
    <button
      className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-md text-sm w-full justify-between"
      onClick={() => (open ? onClose() : onOpen())}
      type="button"
    >
      <span className="text-gray-700">{label}: <span className="font-medium text-gray-900">{value}</span></span>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </button>
    {open && (
      <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded shadow w-full">
        {options.map((opt) => (
          <div
            key={opt}
            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${opt === value ? 'bg-gray-50 font-semibold' : ''}`}
            onClick={() => {
              onChange(opt);
              onClose();
            }}
          >
            {opt}
          </div>
        ))}
      </div>
    )}
  </div>
);

const ReportsTable = () => {
  const t = useTranslation();
  const [filters, setFilters] = useState({
    emirate: 'All',
    season: 'All',
    crop: 'All',
    reportType: 'All'
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <div className="bg-white py-6 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row px-6  border-b-[1px] pb-2 justify-between items-start md:items-center mb-2 gap-4">
        <h1 className="text-lg font-medium text-gray-900">
          {t('reports.totalResults')} <span className="font-semibold">50</span>
        </h1>
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('reports.searchReports')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full md:w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">{t('reports.downloadAllReports')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-10 px-6  p-4  rounded-lg">
        <CustomDropdown
          label={t('reports.emirate')}
          value={filters.emirate}
          options={filterOptions.emirate}
          onChange={(value) => setFilters({ ...filters, emirate: value })}
          open={openDropdown === 'emirate'}
          onOpen={() => setOpenDropdown('emirate')}
          onClose={() => setOpenDropdown(null)}
        />
        <CustomDropdown
          label={t('reports.season')}
          value={filters.season}
          options={filterOptions.season}
          onChange={(value) => setFilters({ ...filters, season: value })}
          open={openDropdown === 'season'}
          onOpen={() => setOpenDropdown('season')}
          onClose={() => setOpenDropdown(null)}
        />
        <CustomDropdown
          label={t('reports.crop')}
          value={filters.crop}
          options={filterOptions.crop}
          onChange={(value) => setFilters({ ...filters, crop: value })}
          open={openDropdown === 'crop'}
          onOpen={() => setOpenDropdown('crop')}
          onClose={() => setOpenDropdown(null)}
        />
        <CustomDropdown
          label={t('reports.reportType')}
          value={filters.reportType}
          options={filterOptions.reportType}
          onChange={(value) => setFilters({ ...filters, reportType: value })}
          open={openDropdown === 'reportType'}
          onOpen={() => setOpenDropdown('reportType')}
          onClose={() => setOpenDropdown(null)}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{t('reports.from')}</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="MM/DD/YYYY"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{t('reports.to')}</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="MM/DD/YYYY"
          />
        </div>
        <button className="bg-teal-600 text-white px-6 py-2 rounded-md text-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
          {t('reports.generate')}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border  border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-6 py-3 text-left">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {t('reports.owner')}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {t('reports.emirateHeader')}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {t('reports.cropTypeHeader')}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {t('reports.cropArea')}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {t('reports.location')}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {t('reports.irrigation')}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 ">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-teal-600 hover:text-teal-800 cursor-pointer">
                    {row.owner}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {row.emirate}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {row.cropType}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {row.cropArea}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {row.location}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {row.irrigation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsTable;