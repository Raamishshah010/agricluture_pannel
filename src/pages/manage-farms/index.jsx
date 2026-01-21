import { useCallback, useEffect, useMemo, useState } from 'react';
import service from '../../services/farmService';
import { toast } from 'react-toastify';
import Farms from './farms';
import FarmDetails from './farmDetails';
import { FarmUpdateForm } from './form';
import Pagination from '../../components/pagination';
import { NewFarmForm } from './newForm';
import useStore from '../../store/store';
import Dropdown from '../../components/dropdownWithSearch';
import useTranslation from '../../hooks/useTranslation';

export default function Index(props) {
    const t = useTranslation();
    const { language } = useStore((state) => state); // Get current language from store
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab') || 'farms');
    const [selectedFarm, setSelectedFarm] = useState(() => {
        const storedFarm = sessionStorage.getItem('selectedFarm');
        return storedFarm ? JSON.parse(storedFarm) : null;
    });
    const [page, setPage] = useState(1);
    const [randomNumber, setRandomNumber] = useState(() => sessionStorage.getItem('randomNumber') || 1);
    const { farms, setFarms, emirates, centers, locations } = useStore((state) => state);
    const [emirate, setEmirate] = useState(null);
    const [center, setCenter] = useState(null);
    const [location, setLocation] = useState(null);

  // State section mein add karein
const [sizeFilter, setSizeFilter] = useState(''); 



    useEffect(() => {
        sessionStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (selectedFarm) {
            sessionStorage.setItem('selectedFarm', JSON.stringify(selectedFarm));
        } else {
            sessionStorage.removeItem('selectedFarm');
        }
    }, [selectedFarm]);

    useEffect(() => {
        sessionStorage.setItem('randomNumber', randomNumber);
    }, [randomNumber]);

    useEffect(() => {
        if (props.number !== randomNumber) {
            setRandomNumber(props.number);
            setActiveTab('farms');
            sessionStorage.removeItem('selectedFarm');
            sessionStorage.removeItem('activeTab');
            sessionStorage.removeItem('randomNumber');
            setSelectedFarm(null);
            setPage(1);
        }
    }, [props.number, randomNumber]);


    const loadMore = async (currentPage) => {
        setPage(currentPage);
    };

    const handleDetail = async (item) => {
        service.getfarmById(item.id).then(res => {
            setSelectedFarm(res.data);
            setActiveTab('farm-details');
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    };

    const handleEdit = async (item) => {
        service.getFarmByIdWithoutPopulatingFields(item.id).then(res => {
            setSelectedFarm(res.data);
            setActiveTab('farm-edit');
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    };

    const submitFarmHandler = useCallback(async (item, id) => {
        service.updateFarm(item, id).then((res) => {
            const farmIndex = farms.findIndex(f => f.id === id);
            farms[farmIndex] = res.data;
            setFarms(farms);
            setActiveTab('farms');
            setSelectedFarm(null);
            sessionStorage.removeItem('selectedFarm');
            sessionStorage.removeItem('activeTab');
            toast.success(t('manageFarms.updatedSuccessfully'));
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    }, [farms, setFarms, t]);

    const submitNewFarmHandler = useCallback(async (item) => {
        service.addFarm(item).then((res) => {
            setFarms([...farms, res.data]);
            setSelectedFarm(null);
            sessionStorage.removeItem('activeTab');
            setActiveTab('farms');
            toast.success(t('manageFarms.addSuccessfully'));
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    }, [farms, setFarms, t]);

const filteredFarms = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return farms.filter(farm => {
        const matchesSearch =
            !lowerQuery ||
            farm.farmName.toLowerCase().includes(lowerQuery) ||
            (farm.agricultureId &&
                farm.agricultureId.toString().toLowerCase().includes(lowerQuery));

        const matchesFilters =
            (emirate ? farm.emirate === emirate.id : true) &&
            (center ? farm.serviceCenter === center.id : true) &&
            (location ? farm.location === location.id : true);

        // --- SIZE FILTER LOGIC ---
        // Agar sizeFilter khali hai to true, warna farm.size match karein
        const matchesSize = !sizeFilter || farm.size?.toString() === sizeFilter;

        return matchesSearch && matchesFilters && matchesSize;
    });
}, [center, emirate, farms, location, query, sizeFilter]); // sizeFilter dependency add ki

    const itemsPerPage = 50;
    const totalPages = Math.ceil(filteredFarms.length / 50);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredFarms.slice(startIndex, endIndex);

    return activeTab.includes('farms') ? (
        <div className="max-w-[1400px] mx-auto p-3">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('manageFarms.title')}</h1>
                </div>
                <button
                    onClick={() => setActiveTab("farm-new")}
                    className="h-10 mt-4 px-2 bg-green-600 text-white cursor-pointer rounded-lg transition-colors"
                    title="Details"
                >
                    {t('manageFarms.addFarm')}
                </button>
            </div>

            <div className='flex justify-between items-center mb-4 flex-col sm:flex-row gap-4'>
                <input
                    type="text"
                    placeholder={t('manageFarms.searchByFarmName')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
            type="number"
            placeholder="Size" 
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
                <div className="flex  gap-2 sm:p-4 border-gray-200">
                    <Dropdown
                        options={emirates}
                        value={emirate}
                        onChange={setEmirate}
                        placeholder={t('manageFarms.selectEmirate')}
                        language={language}
                    />
                    <Dropdown
                        options={centers}
                        value={center}
                        onChange={setCenter}
                        placeholder={t('manageFarms.selectCenter')}
                        language={language}
                    />
                    <Dropdown
                        options={locations}
                        value={location}
                        onChange={setLocation}
                        placeholder={t('manageFarms.selectLocation')}
                        language={language}
                    />
                    <button
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md"
                        onClick={() => {
                            setEmirate(null);
                            setCenter(null);
                            setLocation(null);
                            setQuery('');
                            setSizeFilter('');
                        }}
                    >
                        {t('manageFarms.clear')}
                    </button>
                </div>
            </div>

            <Farms
                list={currentRequests}
                handleDetail={handleDetail}
                handleEdit={handleEdit}
                setList={(id) => setFarms((pre) => pre.filter(it => it.id !== id))}
            />
            <Pagination initialPage={page} totalPages={totalPages} onPageChange={loadMore} />
        </div>
    ) : activeTab.includes('farm-details') ? (
        <FarmDetails
            farm={selectedFarm}
            handleEdit={handleEdit}
            handleBack={() => {
                setActiveTab('farms');
                setSelectedFarm(null);
            }} />
    ) : activeTab.includes('farm-edit') ? (
        <FarmUpdateForm farm={selectedFarm} onSave={submitFarmHandler} onCancel={() => {
            setActiveTab('farms');
            setSelectedFarm(null);
        }} />
    ) : (
        <NewFarmForm
            onSave={submitNewFarmHandler}
            onCancel={() => {
                setActiveTab('farms');
                setSelectedFarm(null);
            }} />
    );
}