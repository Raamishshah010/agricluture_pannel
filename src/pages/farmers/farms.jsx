import { ArrowLeft } from "lucide-react";
import useTranslation from '../../hooks/useTranslation';

export default function Farmers({ list, farmerName = '', handleBack, handleDetail }) {
    const t = useTranslation();
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (
        <div className="min-h-screen bg-gray-50 p-0 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <button
                        onClick={handleBack}
                        className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-colors duration-200 border border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">{t('farmers.farms.back')}</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{farmerName} {t('farmers.farms.farms')}</h1>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('farmers.farms.name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('farmers.farms.size')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('farmers.farms.createdAt')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('farmers.farms.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.map((farm) => (
                                    <tr key={farm.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{farm.farmName}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{farm.size}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(farm.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDetail(farm)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('farmers.farms.viewDetails')}
                                                >
                                                    {t('farmers.farms.viewDetails')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    {t('farmers.farms.totalFarms')}: {list.length}
                </div>
            </div>
        </div>
    );
}