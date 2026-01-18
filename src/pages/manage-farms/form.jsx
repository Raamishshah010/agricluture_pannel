import React, { useMemo, useState } from 'react';
import { Save, X, Plus, Trash2, MapPin, Sprout, Home, TreePine, ArrowLeft } from 'lucide-react';
import useStore from '../../store/store';
import MultiSelect from '../../components/multiSelect';
import PolygonMapSelector from '../../components/polygonSelector';
import { Modal } from 'react-responsive-modal';
import PolygonDisplayComponent from '../../components/displayPolygon';
import { anyPolygonsOverlap, isPolygonInsidePolygon } from '../../utils';
import useTranslation from '../../hooks/useTranslation';

export const FarmUpdateForm = React.memo(({ farm, onSave, onCancel }) => {
    const t = useTranslation();
    const {
        fruitTypes,
        vegetableTypes,
        fodderTypes,
        crops,
        greenHouseTypes,
        farmingSystems,
        coverTypes,
        waterSources,
        possessions,
        irrigationSystems,
        centers,
        locations,
        livestocks,
        emirates,
        language: lang
    } = useStore(st => st);
    const [open, setOpen] = useState(false);
    const [cropType, setCropType] = useState('');
    const [selectedCropIndex, setSelectedCropIndex] = useState(-1);
    const [formData, setFormData] = useState({
        farmName: farm.farmName || '',
        accountNo: farm.accountNo || '',
        farmSerial: farm.farmSerial || 1,
        farmNo: farm.farmNo || '',
        agricultureId: farm.agricultureId || '',
        phoneNumber: farm.phoneNumber || '',
        emiratesID: farm.emiratesID || '',
        notes: farm.notes || '',
        emirate: farm.emirate || '',
        serviceCenter: farm.serviceCenter || '',
        location: farm.location || '',
        mapData: farm.mapData || [],
        livestocks: farm.livestocks || [],
        coordinates: farm.coordinates || {
            lat: 0,
            lng: 0
        },

        totalArea: farm.totalArea || 0,
        noOfWorkers: farm.noOfWorkers || 0,
        numberOfProductionWells: farm.numberOfProductionWells || 0,
        desalinationUnits: farm.desalinationUnits || 0,
        waterSources: farm.waterSources || [],
        irrigationSystem: farm.irrigationSystem || [],
        farmingSystem: farm.farmingSystem || [],
        possessionStyle: farm.possessionStyle || '',
        numberOfDestinationMachines: farm.numberOfDestinationMachines || 0,


        landUse: {
            arrableLand: {
                vegetablesOpen: farm.landUse?.arrableLand?.vegetablesOpen || 0,
                fruitPalmTreesOpen: farm.landUse?.arrableLand?.fruitPalmTreesOpen || 0,
                fieldCropsFodder: farm.landUse?.arrableLand?.fieldCropsFodder || 0,
                leftForRest: farm.landUse?.arrableLand?.leftForRest || 0,
                ornamentalTrees: farm.landUse?.arrableLand?.ornamentalTrees || 0,
                nurseries: farm.landUse?.arrableLand?.nurseries || 0
            },
            nonArrableLand: {
                buildingsRoads: farm.landUse?.nonArrableLand?.buildingsRoads || 0,
                windbreaks: farm.landUse?.nonArrableLand?.windbreaks || 0,
                barrenLand: farm.landUse?.nonArrableLand?.barrenLand || 0
            }
        },

        crops: {
            fruits: farm.crops?.fruits || [],
            vegetables: farm.crops?.vegetables || [],
            fieldCropsFodder: farm.crops?.fieldCropsFodder || [],
            greenhouses: farm.crops?.greenhouses || []
        }
    });
    const isLTR = lang.includes('en');

    const handleChange = (e) => {
        e.preventDefault();
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : value
        }));
    };
    const handleLandUseChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            landUse: {
                ...prev.landUse,
                [category]: {
                    ...prev.landUse[category],
                    [field]: parseFloat(value) || 0
                }
            }
        }));
    };

    // Fruits Management
    const addFruit = () => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                fruits: [...prev.crops.fruits, {
                    fruitType: fruitTypes[0].nameInArrabic,
                    fruidId: fruitTypes[0].id,
                    area: 0,
                    totalTrees: 0,
                    fruitBearing: 0,
                    productionPercent: 0,
                    coordinates: []
                }]
            }
        }));
    };

    const updateFruit = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                fruits: prev.crops.fruits.map((fruit, i) =>
                    i === index ? { ...fruit, [field]: (field === 'fruidId' || field === 'fruitType' || field === 'coordinates') ? value : parseFloat(value) || 0 } : fruit
                )
            }
        }));
    };

    const removeFruit = (index) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                fruits: prev.crops.fruits.filter((_, i) => i !== index)
            }
        }));
    };

    // Vegetables Management
    const addVegetable = () => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                vegetables: [...prev.crops.vegetables, {
                    vegetableId: vegetableTypes[0].id,
                    vegetableType: vegetableTypes[0].nameInArrabic,
                    area: 0,
                    productionPercent: 0,
                    coordinates: []
                }]
            }
        }));
    };

    const updateVegetable = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                vegetables: prev.crops.vegetables.map((veg, i) =>
                    i === index ? { ...veg, [field]: (field === 'vegetableType' || field === 'vegetableId' || field === 'coordinates') ? value : parseFloat(value) || 0 } : veg
                )
            }
        }));
    };

    const removeVegetable = (index) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                vegetables: prev.crops.vegetables.filter((_, i) => i !== index)
            }
        }));
    };

    // Field Crops Management
    const addFieldCrop = () => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                fieldCropsFodder: [...prev.crops.fieldCropsFodder, {
                    fodderType: fodderTypes[0].nameInArrabic,
                    fodderId: fodderTypes[0].id,
                    area: 0,
                    productionPercent: 0,
                    coordinates: []
                }]
            }
        }));
    };

    const updateFieldCrop = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                fieldCropsFodder: prev.crops.fieldCropsFodder.map((crop, i) =>
                    i === index ? { ...crop, [field]: (field === 'fodderType' || field === 'fodderId' || field === 'coordinates') ? value : parseFloat(value) || 0 } : crop
                )
            }
        }));
    };

    const removeFieldCrop = (index) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                fieldCropsFodder: prev.crops.fieldCropsFodder.filter((_, i) => i !== index)
            }
        }));
    };
    const addStock = () => {
        setFormData(prev => ({
            ...prev,
            livestocks: [
                ...prev.livestocks,
                {
                    stockType: livestocks[0].nameInArrabic,
                    stockId: livestocks[0].id,
                    numberOfAnimals: 0,
                    coordinates: []
                }
            ]
        }));
    };

    const removeStock = (index) => {
        setFormData(prev => ({
            ...prev,
            livestocks: prev.livestocks.filter((_, i) => i !== index)
        }));
    };

    // const removePolygon = (index) => {
    //     setFormData(prev => ({
    //         ...prev,
    //         livestocks: prev.livestocks.filter((_, i) => i !== index)
    //     }));
    // };


    // Greenhouse Management
    const addGreenhouse = () => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                greenhouses: [...prev.crops.greenhouses, {
                    crop: crops[0].nameInArrabic,
                    cropId: crops[0].id,
                    greenhouseType: greenHouseTypes[0].nameInArrabic,
                    greenhouseTypeId: greenHouseTypes[0].id,
                    coverType: coverTypes[0].nameInArrabic,
                    coverTypeId: coverTypes[0].id,
                    farmingSystem: farmingSystems[0].nameInArrabic,
                    farmingSystemId: farmingSystems[0].id,
                    firstCropNoOfGreenhouses: 0,
                    firstCropHouseArea: 0,
                    firstCropArea: 0,
                    firstCropProductionPercent: 0,
                    secondCropNoOfGreenhouses: 0,
                    secondCropHouseArea: 0,
                    secondCropArea: 0,
                    secondCropProductionPercent: 0,
                    thirdCropNoOfGreenhouses: 0,
                    thirdCropHouseArea: 0,
                    thirdCropArea: 0,
                    thirdCropProductionPercent: 0,
                    coordinates: []
                }]
            }
        }));
    };

    const updateGreenhouse = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                greenhouses: prev.crops.greenhouses.map((gh, i) =>
                    i === index ? {
                        ...gh,
                        [field]: [
                            'crop',
                            'cropId',
                            'greenhouseType',
                            'greenhouseTypeId',
                            'coverType',
                            'coverTypeId',
                            'farmingSystem',
                            'coordinates',
                            'farmingSystemId'
                        ].includes(field)
                            ? value
                            : parseFloat(value) || 0
                    } : gh
                )
            }
        }));
    };

    const removeGreenhouse = (index) => {
        setFormData(prev => ({
            ...prev,
            crops: {
                ...prev.crops,
                greenhouses: prev.crops.greenhouses.filter((_, i) => i !== index)
            }
        }));
    };

    const handleSelectItems = (items, name) => {
        setFormData(prev => ({ ...prev, [name]: items.map(it => it.id) }))
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, farm.id);
    };

    const updateLiveStock = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            livestocks: prev.livestocks.map((stock, i) =>
                i === index ? { ...stock, [field]: (field === 'stockType' || field === 'stockId' || field === 'coordinates') ? value : parseInt(value) || 0 } : stock
            )
        }));
    };

    const handleCoordinates = (coords) => {
        if (cropType === 'mapData') {
            setFormData(prev => ({ ...prev, mapData: coords }));
        } else {
            if (!isPolygonInsidePolygon(coords, formData.mapData)) {
                alert(t('farms.selectionOutsideFarmArea'));
                return;
            }
            if (selectedCropIndex < 0) return;
            const fruits = formData.crops.fruits.filter(it => it.coordinates).map(it => it.coordinates);
            const vegetables = formData.crops.vegetables.filter(it => it.coordinates).map(it => it.coordinates);
            const fodders = formData.crops.fieldCropsFodder.filter(it => it.coordinates).map(it => it.coordinates);
            const greenhouses = formData.crops.greenhouses.filter(it => it.coordinates).map(it => it.coordinates);
            const stocks = formData.livestocks.filter(it => it.coordinates).map(it => it.coordinates);

            const polygons = [...fruits, ...vegetables, ...fodders, ...greenhouses, ...stocks];
            const isOverlap = anyPolygonsOverlap([...polygons, coords]);
            if (isOverlap) {
                alert(t('farms.selectionOverlapped'));
                return;
            }
            const updateFunctions = {
                fruit: updateFruit,
                vegetable: updateVegetable,
                greenhouse: updateGreenhouse,
                fieldCrop: updateFieldCrop,
                stock: updateLiveStock,
            };


            const updateFunction = updateFunctions[cropType];
            if (updateFunction) {
                updateFunction(selectedCropIndex, 'coordinates', coords);
            }
        }
        setCropType('');
        setSelectedCropIndex(-1);
        setOpen(false);
    };

    const previewCoords = useMemo(() => {
        const mapData = formData.mapData.length > 0 ? formData.mapData : farm.mapData;
        const fruits = formData.crops.fruits.filter(it => it.coordinates).map(it => it.coordinates);
        const vegetables = formData.crops.vegetables.filter(it => it.coordinates).map(it => it.coordinates);
        const fodders = formData.crops.fieldCropsFodder.filter(it => it.coordinates).map(it => it.coordinates);
        const greenhouses = formData.crops.greenhouses.filter(it => it.coordinates).map(it => it.coordinates);
        const stocks = formData.livestocks.filter(it => it.coordinates).map(it => it.coordinates);
        return [mapData, ...fruits, ...vegetables, ...fodders, ...greenhouses, ...stocks]
    }, [farm.mapData, formData.crops.fieldCropsFodder, formData.crops.fruits, formData.crops.greenhouses, formData.crops.vegetables, formData.livestocks, formData.mapData]);

    return (
        <div className="min-h-0 h-full bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-0 md:p-6">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={onCancel}
                    className="flex items-center cursor-pointer gap-2 mb-4 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-colors duration-200 border border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">{t('common.back')}</span>
                </button>
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
                    <h1 className="text-4xl font-bold mb-2">{t('farms.editFarmDetails')}</h1>
                    <p className="opacity-90">{t('farms.updateInformationFor')}  {farm.farmName}</p>
                </div>

                <div>
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className='flex items-center justify-between'>
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                                <Home className="w-6 h-6 text-green-600" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('farms.basicInformation')}</h3>

                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setOpen(true);
                                    setCropType('mapData');
                                    setFormData(pre => ({ ...pre, mapData: [] }))
                                }}
                                className='bg-green-600 p-2 text-white rounded-md'
                            >
                                {t('farms.selectFarmArea')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.farmName')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='text'
                                    name="farmName"
                                    value={formData.farmName}
                                    onChange={(e) => setFormData(pre => ({ ...pre, farmName: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.agricultureId')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='text'
                                    name="agricultureId"
                                    value={formData.agricultureId}
                                    onChange={(e) => setFormData(pre => ({ ...pre, agricultureId: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.accountNumber')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='text'
                                    name="accountNo"
                                    value={formData.accountNo}
                                    onChange={(e) => setFormData(pre => ({ ...pre, accountNo: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.farmSerial')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='number'
                                    name="farmSerial"
                                    value={formData.farmSerial}
                                    onChange={(e) => setFormData(pre => ({ ...pre, farmSerial: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.farmNumber')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='number'
                                    name="farmNo"
                                    value={formData.farmNo}
                                    onChange={(e) => setFormData(pre => ({ ...pre, farmNo: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.phoneNumber')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData(pre => ({ ...pre, phoneNumber: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.emiratesId')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="emiratesID"
                                    value={formData.emiratesID}
                                    onChange={(e) => setFormData(pre => ({ ...pre, emiratesID: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.latitude')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={formData.coordinates.lat}
                                    type='number'
                                    onChange={(e) => setFormData(pre => ({ ...pre, coordinates: { lat: Number(e.target.value), lng: pre.coordinates.lng } }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.longitude')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={formData.coordinates.lng}
                                    type='number'
                                    onChange={(e) => setFormData(pre => ({ ...pre, coordinates: { lng: Number(e.target.value), lat: pre.coordinates.lat } }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.emirate')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.emirate}
                                    onChange={(e) => {
                                        const center = centers.filter(it => it.emirateId === e.target.value)[0]?.id || '';
                                        setFormData(prev => ({ ...prev, emirate: e.target.value, serviceCenter: center }))
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {
                                        emirates.map((item) => (
                                            <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.center')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.serviceCenter}
                                    onChange={(e) => {
                                        const location = locations.filter(it => it.centerId === e.target.value)[0]?.id || '';
                                        setFormData(prev => ({ ...prev, serviceCenter: e.target.value, location: location }))
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {
                                        centers.filter(it => it.emirateId === formData.emirate).map((item) => (
                                            <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.location')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.location}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, location: e.target.value }))
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {
                                        locations.filter(it => it.centerId === formData.serviceCenter).map((item) => (
                                            <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="mb-4 col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.waterSources')}
                                </label>
                                <MultiSelect name="waterSources" data={waterSources} selectedItems={waterSources.filter((ite) => formData.waterSources.includes(ite.id))} handleSelectItems={handleSelectItems} />
                            </div>
                            <div className="mb-4 col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.irrigationSystem')}
                                </label>
                                <MultiSelect name='irrigationSystem' data={irrigationSystems} selectedItems={irrigationSystems.filter((ite) => formData.irrigationSystem.includes(ite.id))} handleSelectItems={handleSelectItems} />
                            </div>
                            <div className="mb-4 col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.farmingSystem')}
                                </label>
                                <MultiSelect name='farmingSystem' data={farmingSystems} selectedItems={farmingSystems.filter((ite) => formData.farmingSystem.includes(ite.id))} handleSelectItems={handleSelectItems} />
                            </div>
                            <div className="mb-4 col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.possession')}
                                </label>
                                <select
                                    value={formData.possessionStyle}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, possessionStyle: e.target.value }))
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {
                                        possessions.map((item) => (
                                            <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.notes')}</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        {
                            !!formData.mapData.length && (
                                <PolygonDisplayComponent
                                    coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                    polygonCoordinates={formData.mapData}
                                />
                            )
                        }

                    </div>

                    {/* Farm Properties */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <MapPin className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.farmProperties')}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.totalArea')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='number'
                                    name="totalArea"
                                    value={formData.totalArea}
                                    onChange={(e) => setFormData(pre => ({ ...pre, totalArea: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.numberOfWorkers')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='number'
                                    value={formData.noOfWorkers}
                                    onChange={(e) => setFormData(pre => ({ ...pre, noOfWorkers: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.productionWells')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='number'
                                    value={formData.numberOfProductionWells}
                                    onChange={(e) => setFormData(pre => ({ ...pre, numberOfProductionWells: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {t('farms.desalinationUnits')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type='number'
                                    value={formData.desalinationUnits}
                                    onChange={(e) => setFormData(pre => ({ ...pre, desalinationUnits: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Land Use - Arable */}

                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <Sprout className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.landUseArable')}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Vegetables Open (m²)</label>
                                <input
                                    type="number"
                                    value={formData.landUse.arrableLand.vegetablesOpen}
                                    onChange={(e) => handleLandUseChange('arrableLand', 'vegetablesOpen', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Fruit & Palm Trees Open (m²)</label>
                                <input
                                    type="number"
                                    value={formData.landUse.arrableLand.fruitPalmTreesOpen}
                                    onChange={(e) => handleLandUseChange('arrableLand', 'fruitPalmTreesOpen', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div> */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.fieldCropsFodder')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.arrableLand.fieldCropsFodder}
                                    onChange={(e) => handleLandUseChange('arrableLand', 'fieldCropsFodder', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.leftForRest')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.arrableLand.leftForRest}
                                    onChange={(e) => handleLandUseChange('arrableLand', 'leftForRest', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.ornamentalTrees')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.arrableLand.ornamentalTrees}
                                    onChange={(e) => handleLandUseChange('arrableLand', 'ornamentalTrees', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.nurseries')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.arrableLand.nurseries}
                                    onChange={(e) => handleLandUseChange('arrableLand', 'nurseries', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Land Use - Non-Arable */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <Sprout className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.landUseNonArable')}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.buildingsRoads')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.nonArrableLand.buildingsRoads}
                                    onChange={(e) => handleLandUseChange('nonArrableLand', 'buildingsRoads', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.windbreaks')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.nonArrableLand.windbreaks}
                                    onChange={(e) => handleLandUseChange('nonArrableLand', 'windbreaks', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('farms.barrenLand')}</label>
                                <input
                                    type="number"
                                    value={formData.landUse.nonArrableLand.barrenLand}
                                    onChange={(e) => handleLandUseChange('nonArrableLand', 'barrenLand', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Livestocks */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <TreePine className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.livestocks')}</h3>
                        </div>
                        {formData.livestocks.map((stock, index) => (
                            <div key={index} className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-green-800">{t('farms.stock')} #{index + 1}</h4>
                                    <div className='flex items-center gap-2'>
                                        <button
                                            type="button"
                                            onClick={() =>  updateLiveStock(index, 'coordinates', [])}
                                            className="  cursor-pointer flex items-center gap-1 text-sm bg-red-700 p-1 text-white rounded-md"
                                        >
                                            <Trash2 className="w-5 h-5 text-xs" /> <span>Delete Map</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!formData.mapData || !formData.mapData.length) {
                                                    alert(t('farms.farmAreaSelectionRequired'));
                                                    return;
                                                }
                                                setOpen(true);
                                                setCropType('stock');
                                                setSelectedCropIndex(index);
                                                updateLiveStock(index, 'coordinates', []);
                                            }}
                                            className='bg-green-600 p-1 text-white rounded-md'
                                        >
                                            {t('farms.selectArea')}
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => removeStock(index)}
                                            className="text-red-600 hover:text-red-800 cursor-pointer"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.type')}
                                        </label>
                                        <select
                                            value={stock.stockId}
                                            onChange={(e) => {
                                                updateLiveStock(index, 'stockId', e.target.value);
                                                const item = livestocks.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateLiveStock(index, 'stockType', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border w-full border-gray-300 rounded-lg"
                                        >
                                            {
                                                livestocks.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.numberOfAnimals')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Number of Animals"
                                            value={stock.numberOfAnimals}
                                            onChange={(e) => updateLiveStock(index, 'numberOfAnimals', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                {
                                    !!stock.coordinates?.length && (
                                        <PolygonDisplayComponent
                                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                            polygonCoordinates={stock.coordinates}
                                        />
                                    )
                                }
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addStock}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4" />
                            {t('farms.addStock')}
                        </button>
                    </div>

                    {/* Fruits */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <TreePine className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.fruitTrees')}</h3>
                        </div>
                        {formData.crops.fruits.map((fruit, index) => (
                            <div key={index} className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-green-800">{t('farms.fruit')} #{index + 1}</h4>
                                    <div className='flex items-center gap-2'>
                                        <button
                                            type="button"
                                            onClick={() =>  updateFruit(index, 'coordinates', [])}
                                            className="  cursor-pointer flex items-center gap-1 text-sm bg-red-700 p-1 text-white rounded-md"
                                        >
                                            <Trash2 className="w-5 h-5 text-xs" /> <span>Delete Map</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!formData.mapData || !formData.mapData.length) {
                                                    alert(t('farms.farmAreaSelectionRequired'));
                                                    return;
                                                }
                                                setOpen(true);
                                                setCropType('fruit');
                                                setSelectedCropIndex(index);
                                                updateFruit(index, 'coordinates', []);
                                            }}
                                            className='bg-green-600 p-1 text-white rounded-md'
                                        >
                                            {t('farms.selectArea')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeFruit(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.fruitType')}
                                        </label>
                                        <select
                                            value={fruit.fruidId}
                                            onChange={(e) => {
                                                updateFruit(index, 'fruidId', e.target.value);
                                                const item = fruitTypes.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateFruit(index, 'fruitType', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border w-full border-gray-300 rounded-lg"
                                        >
                                            {
                                                fruitTypes.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.area')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Area (m²)"
                                            value={fruit.area}
                                            onChange={(e) => updateFruit(index, 'area', e.target.value)}
                                            className="px-3 py-2 w-full border border-gray-300 rounded-lg"
                                            min="0"
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.totalTrees')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Total Trees"
                                            value={fruit.totalTrees}
                                            onChange={(e) => updateFruit(index, 'totalTrees', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.fruitBearing')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Fruit Bearing"
                                            value={fruit.fruitBearing}
                                            onChange={(e) => updateFruit(index, 'fruitBearing', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.production')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Production (kg)"
                                            value={fruit.productionPercent}
                                            onChange={(e) => updateFruit(index, 'productionPercent', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                {
                                    !!fruit.coordinates?.length && (
                                        <PolygonDisplayComponent
                                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                            polygonCoordinates={fruit.coordinates}
                                        />
                                    )
                                }
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addFruit}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4" />
                            {t('farms.addFruit')}
                        </button>
                    </div>

                    {/* Vegetables */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <Sprout className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.vegetables')}</h3>
                        </div>
                        {formData.crops.vegetables.map((veg, index) => (
                            <div key={index} className="bg-lime-50 rounded-lg p-4 mb-4 border border-lime-200">
                                <div className='flex items-center justify-end mb-4 gap-2'>
                                    <button
                                            type="button"
                                            onClick={() =>  updateVegetable(index, 'coordinates', [])}
                                            className="  cursor-pointer flex items-center gap-1 text-sm bg-red-700 p-1 text-white rounded-md"
                                        >
                                            <Trash2 className="w-5 h-5 text-xs" /> <span>Delete Map</span>
                                        </button>
                                    <button
                                        onClick={() => {
                                            if (!formData.mapData || !formData.mapData.length) {
                                                alert(t('farms.farmAreaSelectionRequired'));
                                                return;
                                            }
                                            setOpen(true);
                                            setCropType('vegetable');
                                            updateVegetable(index, 'coordinates', []);
                                            setSelectedCropIndex(index);
                                        }}
                                        className='bg-green-600 p-1 text-white rounded-md'
                                    >
                                        {t('farms.selectArea')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeVegetable(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.vegetableType')}
                                        </label>
                                        <select
                                            value={veg.vegetableId}
                                            onChange={(e) => {
                                                updateVegetable(index, 'vegetableId', e.target.value);
                                                const item = vegetableTypes.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateVegetable(index, 'vegetableType', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            {
                                                vegetableTypes.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.area')}
                                        </label>  <input
                                            type="number"
                                            placeholder="Area (m²)"
                                            value={veg.area}
                                            onChange={(e) => updateVegetable(index, 'area', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.production')}
                                        </label>  <input
                                            type="number"
                                            placeholder="Production (kg)"
                                            value={veg.productionPercent}
                                            onChange={(e) => updateVegetable(index, 'productionPercent', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                {
                                    !!veg.coordinates?.length && (
                                        <PolygonDisplayComponent
                                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                            polygonCoordinates={veg.coordinates}
                                        />
                                    )
                                }
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addVegetable}
                            className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700"
                        >
                            <Plus className="w-4 h-4" />
                            {t('farms.addVegetable')}
                        </button>
                    </div>

                    {/* Field Crops & Fodder */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <Sprout className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.fieldCropsFodder')}</h3>
                        </div>
                        {formData.crops.fieldCropsFodder.map((crop, index) => (
                            <div key={index} className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                                <div className='flex items-center justify-end mb-4 gap-2'>
                                    <button
                                            type="button"
                                            onClick={() =>  updateFieldCrop(index, 'coordinates', [])}
                                            className="  cursor-pointer flex items-center gap-1 text-sm bg-red-700 p-1 text-white rounded-md"
                                        >
                                            <Trash2 className="w-5 h-5 text-xs" /> <span>Delete Map</span>
                                        </button>
                                    <button
                                        onClick={() => {
                                            if (!formData.mapData || !formData.mapData.length) {
                                                alert(t('farms.farmAreaSelectionRequired'));
                                                return;
                                            }
                                            setOpen(true);
                                            setCropType('fieldCrop');
                                            updateFieldCrop(index, 'coordinates', []);
                                            setSelectedCropIndex(index);
                                        }}
                                        className='bg-green-600 p-1 text-white rounded-md'
                                    >
                                        {t('farms.selectArea')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeFieldCrop(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.fodderType')}
                                        </label>
                                        <select
                                            value={crop.fodderId}
                                            onChange={(e) => {
                                                updateFieldCrop(index, 'fodderId', e.target.value)
                                                const item = fodderTypes.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateFieldCrop(index, 'fodderType', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            {
                                                vegetableTypes.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.area')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Area (m²)"
                                            value={crop.area}
                                            onChange={(e) => updateFieldCrop(index, 'area', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.production')}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Production (kg)"
                                            value={crop.productionPercent}
                                            onChange={(e) => updateFieldCrop(index, 'productionPercent', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                {
                                    !!crop.coordinates?.length && (
                                        <PolygonDisplayComponent
                                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                            polygonCoordinates={crop.coordinates}
                                        />
                                    )
                                }
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addFieldCrop}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            <Plus className="w-4 h-4" />
                            {t('farms.addFieldCrop')}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                            <Home className="w-6 h-6 text-green-600" />
                            <h3 className="text-xl font-bold text-gray-800">{t('farms.greenhouses')}</h3>
                        </div>
                        {formData.crops.greenhouses.map((greenhouse, index) => (
                            <div key={index} className="bg-emerald-50 rounded-lg p-6 mb-4 border-2 border-emerald-200">
                                <div className='flex items-center justify-end mb-4 gap-2'>
                                    <button
                                            type="button"
                                            onClick={() =>  updateGreenhouse(index, 'coordinates', [])}
                                            className="  cursor-pointer flex items-center gap-1 text-sm bg-red-700 p-1 text-white rounded-md"
                                        >
                                            <Trash2 className="w-5 h-5 text-xs" /> <span>Delete Map</span>
                                        </button>
                                    <button
                                        onClick={() => {
                                            if (!formData.mapData || !formData.mapData.length) {
                                                alert(t('farms.farmAreaSelectionRequired'));
                                                return;
                                            }
                                            setOpen(true);
                                            setCropType('greenhouse');
                                            updateGreenhouse(index, 'coordinates', []);
                                            setSelectedCropIndex(index);

                                        }}
                                        className='bg-green-600 p-1 text-white rounded-md'
                                    >
                                        {t('farms.selectArea')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeGreenhouse(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.cropType')}
                                        </label>
                                        <select
                                            value={greenhouse.cropId}
                                            onChange={(e) => {
                                                updateGreenhouse(index, 'cropId', e.target.value);
                                                const item = crops.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateGreenhouse(index, 'crop', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            {
                                                crops.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.greenhouseType')}
                                        </label>
                                        <select
                                            value={greenhouse.greenhouseTypeId}
                                            onChange={(e) => {
                                                updateGreenhouse(index, 'greenhouseTypeId', e.target.value);
                                                const item = greenHouseTypes.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateGreenhouse(index, 'greenhouseType', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            {
                                                greenHouseTypes.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.coverType')}
                                        </label>
                                        <select
                                            value={greenhouse.coverTypeId}
                                            onChange={(e) => {
                                                updateGreenhouse(index, 'coverTypeId', e.target.value);
                                                const item = coverTypes.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateGreenhouse(index, 'coverType', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            {
                                                coverTypes.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {t('farms.farmingSystem')}
                                        </label>
                                        <select
                                            value={greenhouse.farmingSystemId}
                                            onChange={(e) => {
                                                updateGreenhouse(index, 'farmingSystemId', e.target.value);
                                                const item = farmingSystems.find(it => it.id === e.target.value);
                                                if (item) {
                                                    updateGreenhouse(index, 'farmingSystem', item.nameInArrabic);
                                                }
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            {
                                                farmingSystems.map((item) => (
                                                    <option key={item.id} value={item.id}>{isLTR ? item.name : item.nameInArrabic}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 mb-3 border-l-4 border-blue-400">
                                    <p className="font-bold text-blue-800 mb-3">{t('farms.firstCropSeason')}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.numberOfGreenhouses')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="No. of Greenhouses"
                                                value={greenhouse.firstCropNoOfGreenhouses}
                                                onChange={(e) => updateGreenhouse(index, 'firstCropNoOfGreenhouses', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.houseArea')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="House Area (m²)"
                                                value={greenhouse.firstCropHouseArea}
                                                onChange={(e) => updateGreenhouse(index, 'firstCropHouseArea', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.cropArea')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Crop Area (m²)"
                                                value={greenhouse.firstCropArea}
                                                onChange={(e) => updateGreenhouse(index, 'firstCropArea', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.production')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Production (kg)"
                                                value={greenhouse.firstCropProductionPercent}
                                                onChange={(e) => updateGreenhouse(index, 'firstCropProductionPercent', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Second Crop Season */}
                                <div className="bg-purple-50 rounded-lg p-4 mb-3 border-l-4 border-purple-400">
                                    <p className="font-bold text-purple-800 mb-3">{t('farms.secondCropSeason')}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.numberOfGreenhouses')}
                                            </label><input
                                                type="number"
                                                placeholder="No. of Greenhouses"
                                                value={greenhouse.secondCropNoOfGreenhouses}
                                                onChange={(e) => updateGreenhouse(index, 'secondCropNoOfGreenhouses', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.houseArea')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="House Area (m²)"
                                                value={greenhouse.secondCropHouseArea}
                                                onChange={(e) => updateGreenhouse(index, 'secondCropHouseArea', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.cropArea')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Crop Area (m²)"
                                                value={greenhouse.secondCropArea}
                                                onChange={(e) => updateGreenhouse(index, 'secondCropArea', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.production')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Production (kg)"
                                                value={greenhouse.secondCropProductionPercent}
                                                onChange={(e) => updateGreenhouse(index, 'secondCropProductionPercent', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Third Crop Season */}
                                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                                    <p className="font-bold text-orange-800 mb-3">{t('farms.thirdCropSeason')}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.numberOfGreenhouses')}
                                            </label><input
                                                type="number"
                                                placeholder="No. of Greenhouses"
                                                value={greenhouse.thirdCropNoOfGreenhouses}
                                                onChange={(e) => updateGreenhouse(index, 'thirdCropNoOfGreenhouses', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.houseArea')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="House Area (m²)"
                                                value={greenhouse.thirdCropHouseArea}
                                                onChange={(e) => updateGreenhouse(index, 'thirdCropHouseArea', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.cropArea')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Crop Area (m²)"
                                                value={greenhouse.thirdCropArea}
                                                onChange={(e) => updateGreenhouse(index, 'thirdCropArea', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {t('farms.production')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Production (kg)"
                                                value={greenhouse.thirdCropProductionPercent}
                                                onChange={(e) => updateGreenhouse(index, 'thirdCropProductionPercent', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {
                                    !!greenhouse.coordinates?.length && (
                                        <PolygonDisplayComponent
                                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                            polygonCoordinates={greenhouse.coordinates}
                                        />
                                    )
                                }
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addGreenhouse}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            <Plus className="w-4 h-4" />
                            {t('farms.addGreenhouse')}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end sticky bottom-6 left-8 md:left-0 bg-white rounded-lg shadow-2xl p-4 border-2 border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex items-center gap-2 px-3 md:px-6 py-1 md:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                        >
                            <X className="w-5 h-5 hidden md:inline" />
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex items-center gap-3 px-2 md:px-6 py-1 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg transition-all"
                        >
                            <Save className="w-5 h-5 hidden md:inline" />
                            {t('farms.saveChanges')}
                        </button>
                    </div>
                </div>
            </div>
            <Modal open={open} onClose={() => setOpen(false)} center classNames='w-full'>
                <h1 className='text-3xl font-bold my-4'>{t('farms.addAreaOnMap')}</h1>
                <PolygonMapSelector
                    coords={previewCoords}
                    coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                    handleCoordinates={(coords) => {
                        handleCoordinates(coords);
                    }}
                />
            </Modal>
        </div>
    );
});
