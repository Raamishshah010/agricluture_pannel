import React from 'react';
import { MapPin, User, Droplet, Sprout, Calendar, FileText, Map, CheckCircle, XCircle, ArrowLeft, Users, TreePine, Home, Pencil, SquarePenIcon } from 'lucide-react';
import useStore from '../../store/store';
import PolygonDisplayComponent from '../../components/displayPolygon';
import useTranslation from '../../hooks/useTranslation';

const FarmDetails = ({ farm, handleBack }) => {
    const t = useTranslation();
    const {
        fruitTypes,
        vegetableTypes,
        fodderTypes,
        farmingSystems,
        coverTypes,
        language: lang
    } = useStore((state) => state);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const InfoCard = ({ icon: Icon, title, children, gradient = "from-green-50 to-emerald-50" }) => (
        <div className={`bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300`}>
            <div className={`flex items-center ${isLTR ? "justify-start" : "justify-end"} gap-3 mb-5 pb-3 border-b-2 border-green-200`}>
                {Icon && <Icon className="w-6 h-6 text-green-600" />}
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );

    const InfoRow = ({ label, value, valueClass = "" }) => (
        <div className={`flex justify-between items-start py-2 hover:bg-white/50 px-2 rounded transition-colors ${isLTR ? "flex-row" : "flex-row-reverse"}`}>
            <span className="text-sm text-gray-600 font-semibold">{isLTR ? `${label}:` : `:${label}`}</span>
            <span className={`text-sm text-gray-900 text-right max-w-xs font-medium ${valueClass}`}>
                {value || 'N/A'}
            </span>
        </div>
    );

    const UpdatedValueRow = ({ label, oldValue, newValue, isLTR }) => {
        const hasUpdate = newValue !== undefined && newValue !== oldValue;
        
        return (
            <div className={`flex justify-between items-start py-2 hover:bg-white/50 px-2 rounded transition-colors ${isLTR ? "flex-row" : "flex-row-reverse"}`}>
                <span className="text-sm text-gray-600 font-semibold">{isLTR ? `${label}:` : `:${label}`}</span>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-orange-600 font-semibold text-right max-w-xs">
                        {oldValue || 'N/A'}
                    </span>
                    {hasUpdate && (
                        <>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 font-semibold text-right max-w-xs">
                                {newValue}
                            </span>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const StatCard = ({ label, value, icon: Icon, color = "green" }) => (
        <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-4 border-l-4 border-${color}-500 shadow-md`}>
            <div className={`flex items-center justify-between ${lang.includes('en') ? 'flex-row' : 'flex-row-reverse'}`}>
                <div>
                    <p className="text-xs text-gray-600 font-medium">{label}</p>
                    <p className={`text-2xl font-bold text-${color}-700 mt-1`}>{value}</p>
                </div>
                {Icon && <Icon className={`w-8 h-8 text-${color}-400 opacity-50`} />}
            </div>
        </div>
    );

    const fruitType = (fr) => {
        const item = fruitTypes.find((it) => it.id === fr.fruidId);
        return !lang.includes('en') ? fr.fruitType : item?.name ?? fr.fruitType;
    };
    const vegetableType = (veg) => {
        const item = vegetableTypes.find((it) => it.id === veg.vegetableId);
        return !lang.includes('en') ? veg.vegetableType : item?.name ?? veg.vegetableType;
    };
    const fodderTypeHandler = (fodd) => {
        const item = fodderTypes.find((it) => it.id === fodd.fodderId);
        return !lang.includes('en') ? fodd.fodderType : item?.name ?? fodd.fodderType;
    };
    const farmingSystemHandler = (fs) => {
        const item = farmingSystems.find((it) => it.id === fs.farmingSystemId);
        return !lang.includes('en') ? fs.farmingSystem : item?.name ?? fs.farmingSystem;
    };
    const coverTypeHandler = (fs) => {
        const item = coverTypes.find((it) => it.id === fs.coverTypeId);
        return !lang.includes('en') ? fs.coverType : item?.name ?? fs.coverType;
    };

    const isLTR = lang.includes('en');

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-0 md:p-6">
            <button
                onClick={handleBack}
                className="flex items-center cursor-pointer gap-2 mb-4 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-colors duration-200 border border-gray-200"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">{t('farmCodingDetails.back')}</span>
            </button>
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2" dir="rtl">{farm.farmName}</h1>
                            <div className="flex flex-wrap gap-4 text-sm opacity-90">
                                <span>🆔 {
                                    farm.updatingData && farm.updatingData.agricultureId ?
                                    <span className="text-orange-600 font-semibold">{farm.agricultureId}</span> : <span>{farm.agricultureId}</span>
                                }{
                                    farm.updatingData && farm.updatingData.agricultureId &&
                                    <span className="text-white font-semibold"> → {farm.updatingData.agricultureId}</span>
                                }</span>
                                <span>📞 {
                                    farm.updatingData && farm.updatingData.phoneNumber ?
                                    <span className="text-orange-600 font-semibold">{farm.phoneNumber}</span> : <span>{farm.phoneNumber}</span>
                                }{
                                    farm.updatingData && farm.updatingData.phoneNumber &&
                                    <span className="text-white font-semibold"> → {farm.updatingData.phoneNumber}</span>
                                }</span>
                                <span>🏛️ Farm #{
                                    farm.updatingData && farm.updatingData.farmNo ?
                                    <span className="text-orange-600 font-semibold">{farm.farmNo}</span> : <span>{farm.farmNo}</span>
                                }{
                                    farm.updatingData && farm.updatingData.farmNo &&
                                    <span className="text-white font-semibold"> → {farm.updatingData.farmNo}</span>
                                }</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {farm.activeStatus ? (
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
                                    <CheckCircle className="w-5 h-5" />
                                    {t('farmCodingDetails.active')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
                                    <XCircle className="w-5 h-5" />
                                    {t('farmCodingDetails.inactive')}
                                </span>
                            )}
                            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold capitalize text-center">
                                {farm.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label={isLTR ? t('farmCodingDetails.totalArea') : t('farmCodingDetails.totalArea')} value={`${Math.round(farm.totalArea)} ha`} icon={Map} color="blue" />
                    <StatCard label={isLTR ? t('farmCodingDetails.productionWells') : t('farmCodingDetails.productionWells')} value={farm.numberOfProductionWells} icon={Droplet} color="cyan" />
                    <StatCard label={isLTR ? t('farmCodingDetails.workers') : t('farmCodingDetails.workers')} value={farm.noOfWorkers || 0} icon={Users} color="purple" />
                    <StatCard label={isLTR ? t('farmCodingDetails.waterSources') : t('farmCodingDetails.waterSources')} value={farm.waterSources?.length || 0} icon={Droplet} color="teal" />
                </div>

                {/* Owner & Holder Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <InfoCard icon={User} title={isLTR ? t('farmCodingDetails.ownerInformation') : t('farmCodingDetails.ownerInformation')} gradient="from-blue-50 to-cyan-50">
                        <InfoRow label={isLTR ? "Name" : "اسم"} value={farm.owner?.name} />
                        <InfoRow
                            label={isLTR ? "Emirates ID" : "الهوية الإماراتية"}
                            value={
                                farm.updatingData && farm.updatingData.emiratesID ?
                                <span className="text-orange-600 font-semibold">{farm.emiratesID} → <span className="text-green-600 font-semibold">{farm.updatingData.emiratesID}</span></span> :
                                farm.emiratesID}
                            valueClass={farm.updatingData && farm.updatingData.emiratesID ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow label={isLTR ? "Email" : "بريد إلكتروني"} value={farm.owner?.email} />
                        <InfoRow
                            label={isLTR ? "Email Verified" : "تم التحقق من البريد الإلكتروني"}
                            value={farm.owner?.isEmailVerified ? 'Yes ✓' : 'No ✗'}
                            valueClass={farm.owner?.isEmailVerified ? 'text-green-600' : 'text-red-600'}
                        />
                        <InfoRow
                            label={isLTR ? "Phone Number" : "رقم التليفون"}
                            value={
                                farm.updatingData && farm.updatingData.phoneNumber ?
                                <span className="text-orange-600 font-semibold">{farm.phoneNumber} → <span className="text-green-600 font-semibold">{farm.updatingData.phoneNumber}</span></span> :
                                farm.phoneNumber
                            }
                            valueClass={farm.updatingData && farm.updatingData.phoneNumber ? 'text-orange-600 font-semibold' : ''}
                        />
                    </InfoCard>

                    <InfoCard icon={Users} title={isLTR ? t('farmCodingDetails.holderInformation') : t('farmCodingDetails.holderInformation')} gradient="from-purple-50 to-pink-50">
                        <InfoRow label={isLTR ? "Name" : "اسم"} value={farm.holder?.name} />
                        <InfoRow label={isLTR ? "Email" : "بريد إلكتروني"} value={farm.holder?.email} />
                        <InfoRow
                            label={isLTR ? "Email Verified" : "تم التحقق من البريد الإلكتروني"}
                            value={farm.holder?.isEmailVerified ? 'Yes ✓' : 'No ✗'}
                            valueClass={farm.holder?.isEmailVerified ? 'text-green-600' : 'text-red-600'}
                        />
                        <InfoRow label={isLTR ? "Phone Number" : "رقم التليفون"} value={farm.holder?.phoneNumber || 'N/A'} />
                    </InfoCard>
                </div>

                {/* Location Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <InfoCard icon={MapPin} title={isLTR ? t('farmCodingDetails.locationDetails') : t('farmCodingDetails.locationDetails')} gradient="from-amber-50 to-orange-50">
                        <InfoRow
                            label={isLTR ? "Location" : "موقع"}
                            value={
                                farm.updatingData && farm.updatingData.region ?
                                <span className="text-orange-600 font-semibold">{isLTR ? farm.location?.name : farm.location?.nameInArrabic} → <span className="text-green-600 font-semibold">{isLTR ? farm.region?.name : farm.region?.nameInArrabic}</span></span> :
                                (isLTR ? farm.location?.name : farm.location?.nameInArrabic)
                            }
                            valueClass={farm.updatingData && farm.updatingData.region ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow
                            label={isLTR ? "Region" : "منطقة"}
                            value={
                                farm.updatingData && farm.updatingData.region ?
                                <span className="text-orange-600 font-semibold">{isLTR ? farm.region?.name : farm.region?.nameInArrabic} → <span className="text-green-600 font-semibold">{isLTR ? farm.region?.name : farm.region?.nameInArrabic}</span></span> :
                                (isLTR ? farm.region?.name : farm.region?.nameInArrabic)
                            }
                            valueClass={farm.updatingData && farm.updatingData.region ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow
                            label={isLTR ? "Emirate" : "الإمارة"}
                            value={
                                farm.updatingData && farm.updatingData.emirate ?
                                <span className="text-orange-600 font-semibold">{isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic} → <span className="text-green-600 font-semibold">{isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic}</span></span> :
                                (isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic)
                            }
                            valueClass={farm.updatingData && farm.updatingData.emirate ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow
                            label={isLTR ? "Service Center" : "مركز الخدمة"}
                            value={
                                farm.updatingData && farm.updatingData.serviceCenter ?
                                <span className="text-orange-600 font-semibold">{isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic} → <span className="text-green-600 font-semibold">{isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic}</span></span> :
                                (isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic)
                            }
                            valueClass={farm.updatingData && farm.updatingData.serviceCenter ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow
                            label={isLTR ? "Coordinates" : "الإحداثيات"}
                            value={`${farm.coordinates?.lat.toFixed(6)}, ${farm.coordinates?.lng.toFixed(6)}`}
                        />
                        <a
                            href={`https://www.google.com/maps?q=${farm.coordinates?.lat},${farm.coordinates?.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-2 hover:underline"
                        >
                            <Map className="w-4 h-4" />
                            {t('farmCodingDetails.viewOnGoogleMaps')}
                        </a>
                    </InfoCard>

                    <InfoCard icon={Home} title={isLTR ? t('farmCodingDetails.farmProperties') : t('farmCodingDetails.farmProperties')} gradient="from-green-50 to-lime-50">
                        <InfoRow
                            label={isLTR ? "Farm Serial" : "مسلسل المزرعة"}
                            value={
                                farm.updatingData && farm.updatingData.farmNo ?
                                <span className="text-orange-600 font-semibold">{farm.farmSerial} → <span className="text-green-600 font-semibold">{farm.updatingData.farmNo}</span></span> :
                                farm.farmSerial
                            }
                            valueClass={farm.updatingData && farm.updatingData.farmNo ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow
                            label={isLTR ? `Account No` : `رقم الحساب`}
                            value={
                                farm.updatingData && farm.updatingData.accountNo ?
                                <span className="text-orange-600 font-semibold">{farm.accountNo} → <span className="text-green-600 font-semibold">{farm.updatingData.accountNo}</span></span> :
                                farm.accountNo
                            }
                            valueClass={farm.updatingData && farm.updatingData.accountNo ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow label={isLTR ? `Size` : `الحجم`} value={`${Math.round(farm.size)} ha`} />
                        <InfoRow
                            label={isLTR ? `Possession Style` : `أسلوب الاستحواذ`}
                            value={
                                farm.updatingData && farm.updatingData.possessionStyle ?
                                <span className="text-orange-600 font-semibold">{isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic} → <span className="text-green-600 font-semibold">{isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic}</span></span> :
                                (isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic)
                            }
                            valueClass={farm.updatingData && farm.updatingData.possessionStyle ? 'text-orange-600 font-semibold' : ''}
                        />
                        <InfoRow label={isLTR ? `Farming System` : `نظام الزراعة`} value={farm.farmingSystem?.map(fs => isLTR ? fs.name : fs.nameInArrabic).join(', ')} />
                    </InfoCard>
                </div>
                {
                    !!farm.mapData?.length && (
                        <PolygonDisplayComponent
                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                            polygonCoordinates={farm.mapData}
                        />
                    )
                }
                <InfoCard icon={Sprout} title={isLTR ? t('farmCodingDetails.landUseDistribution') : t('farmCodingDetails.landUseDistribution')} gradient="from-teal-50 to-cyan-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>
                                {isLTR ? "Arable Land" : "أرض صالحة للزراعة"}</h4>
                            <InfoRow label={isLTR ? `Vegetables (Open)` : `الخضروات (مفتوحة)`} value={`${farm.landUse?.arrableLand?.vegetablesOpen} m²`} />
                            <InfoRow label={isLTR ? `Fruit & Palm Trees (Open)` : `أشجار الفاكهة والنخيل (مفتوح)`} value={`${farm.landUse?.arrableLand?.fruitPalmTreesOpen} m²`} />
                            <InfoRow label={isLTR ? `Field Crops & Fodder` : 'المحاصيل الحقلية والأعلاف'} value={`${farm.landUse?.arrableLand?.fieldCropsFodder} m²`} />
                            <InfoRow label={isLTR ? `Left for Rest` : `غادر للراحة`} value={`${Math.round(farm.landUse?.arrableLand?.leftForRest)} m²`} />
                            <InfoRow label={isLTR ? `Nurseries` : `مشاتل`} value={`${farm.landUse?.arrableLand?.nurseries} m²`} />
                        </div>
                        <div>
                            <h4 className={`font-bold text-orange-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>
                                {isLTR ? "Non-Arable Land" : "الأراضي غير الصالحة للزراعة"}</h4>
                            <InfoRow label={isLTR ? `Buildings & Roads` : 'المباني والطرق'} value={`${farm.landUse?.nonArrableLand?.buildingsRoads} m²`} />
                            <InfoRow label={isLTR ? `Windbreaks` : `مصدات الرياح`} value={`${farm.landUse?.nonArrableLand?.windbreaks} m²`} />
                            <InfoRow label={isLTR ? `Barren Land` : `أرض قاحلة`} value={`${farm.landUse?.nonArrableLand?.barrenLand} m²`} />
                        </div>
                    </div>
                </InfoCard>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
                    <InfoCard icon={Droplet} title={isLTR ? t('farmCodingDetails.irrigationSystems') : t('farmCodingDetails.irrigationSystems')} gradient="from-blue-50 to-indigo-50">
                        {farm.irrigationSystem?.map((system, idx) => (
                            <div key={idx} className="bg-white/70 rounded-lg p-3 border border-blue-200">
                                {
                                    isLTR ? (
                                        <p className="font-semibold text-blue-900">{system.name}</p>
                                    ) : (
                                        <p className="text-sm text-gray-600" dir="rtl">{system.nameInArrabic}</p>
                                    )
                                }
                            </div>
                        ))}
                    </InfoCard>

                    <InfoCard icon={Droplet} title={isLTR ? t('farmCodingDetails.waterSources') : t('farmCodingDetails.waterSources')} gradient="from-cyan-50 to-teal-50">
                        {farm.waterSources?.map((source, idx) => (
                            <div key={idx} className="bg-white/70 rounded-lg p-3 border border-cyan-200">
                                {
                                    isLTR ? (
                                        <p className="font-semibold text-cyan-900">{source.name}</p>

                                    ) : (
                                        <p className="text-sm text-gray-600" dir="rtl">{source.nameInArrabic}</p>
                                    )
                                }
                            </div>
                        ))}
                        <InfoRow label={isLTR ? "Desalination Units" : "وحدات تحلية المياه"} value={farm.desalinationUnits} />
                        <InfoRow label={isLTR ? "Production Wells" : "آبار الإنتاج"} value={farm.numberOfProductionWells} />
                    </InfoCard>
                </div>

                {/* Crops Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
                    <div className={`${isLTR ? "justify-start" : "justify-end"} flex items-center gap-3 mb-5`}>
                        <TreePine className="w-6 h-6 text-green-600" />
                        <h3 className="text-xl font-bold text-gray-800">{isLTR ? t('farmCodingDetails.cropsProduction') : t('farmCodingDetails.cropsProduction')}</h3>
                    </div>

                    {/* Fruits */}
                    {farm.crops?.fruits && farm.crops.fruits.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🌳 {isLTR ? t('farmCodingDetails.fruitTrees') : t('farmCodingDetails.fruitTrees')}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
                                {farm.crops.fruits.map((fruit, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
                                        <h5 className="font-bold text-green-800 mb-2 text-lg" >{fruitType(fruit)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Area" : "منطقة"}:</span> {fruit.area} m²</p>
                                            <p><span className="font-semibold">{isLTR ? "Total Trees" : " مجموع الأشجار"}:</span> {fruit.totalTrees}</p>
                                            <p><span className="font-semibold">{isLTR ? "Fruit Bearing" : "تحمل الفاكهة"}:</span> {fruit.fruitBearing}</p>
                                            <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {fruit.productionPercent} kg</p>
                                        </div>
                                        {
                                            !!fruit.coordinates?.length && (
                                                <PolygonDisplayComponent
                                                    height='h-[200px]'
                                                    coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                                    polygonCoordinates={fruit.coordinates}
                                                />
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vegetables */}
                    {farm.crops?.vegetables && farm.crops.vegetables.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🥬 {isLTR ? t('farmCodingDetails.vegetables') : t('farmCodingDetails.vegetables')}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
                                {farm.crops.vegetables.map((veg, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-lime-500 shadow-md hover:shadow-lg transition-shadow">
                                        <h5 className="font-bold text-lime-800 mb-2" >{vegetableType(veg)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Area" : "منطقة"}:</span> {veg.area} m²</p>
                                            <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {veg.productionPercent} kg</p>
                                        </div>
                                        {
                                            !!veg.coordinates?.length && (
                                                <PolygonDisplayComponent
                                                    height='h-[200px]'
                                                    coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                                    polygonCoordinates={veg.coordinates}
                                                />
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Field Crops & Fodder */}
                    {farm.crops?.fieldCropsFodder && farm.crops.fieldCropsFodder.length > 0 && (
                        <div>
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🌾 {isLTR ? t('farmCodingDetails.fieldCropsFodderLabel') : t('farmCodingDetails.fieldCropsFodderLabel')} </h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
                                {farm.crops.fieldCropsFodder.map((fodder, idx) => (
                                    <div key={idx} className={`bg-white rounded-lg p-4 border-l-4 border-yellow-500 shadow-md hover:shadow-lg transition-shadow `}>
                                        <h5 className="font-bold text-yellow-800 mb-2" >{fodderTypeHandler(fodder)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Area" : "منطقة"}:</span> {fodder.area} m²</p>
                                            <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {fodder.productionPercent} kg</p>
                                        </div>
                                        {
                                            !!fodder.coordinates?.length && (
                                                <PolygonDisplayComponent
                                                    height='h-[200px]'
                                                    coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                                    polygonCoordinates={fodder.coordinates}
                                                />
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* greenhouses */}
                    {farm.crops?.greenhouses && farm.crops.greenhouses.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🏠 {isLTR ? t('farmCodingDetails.greenhouseCrops') : t('farmCodingDetails.greenhouseCrops')}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
                                {farm.crops.greenhouses.map((greenhouse, idx) => (
                                    <div key={idx} className="bg-white rounded-xl p-5 border-2 border-emerald-300 shadow-lg hover:shadow-xl transition-shadow">
                                        <div className={`flex items-start justify-between mb-4 border-b-2 border-emerald-100 pb-3 ${isLTR ? 'flex-row' : "flex-row-reverse"}`}>
                                            <div>
                                                <h5 className="font-bold text-emerald-900 text-xl mb-1" >{greenhouse.crop}</h5>
                                                <p className="text-sm text-gray-600" >
                                                    <span className="font-semibold">{isLTR ? t('farmCodingDetails.greenhouseType') : t('farmCodingDetails.greenhouseType')}:</span> {greenhouse.greenhouseType}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                {isLTR ? t('farmCodingDetails.greenhouse') : t('farmCodingDetails.greenhouse')}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="bg-emerald-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-600 font-semibold mb-1">{isLTR ? t('farmCodingDetails.systemDetails') : t('farmCodingDetails.systemDetails')}</p>
                                                <p className="text-sm" ><span className="font-semibold">{isLTR ? t('farmCodingDetails.farmingSystem') : t('farmCodingDetails.farmingSystem')}:</span> {farmingSystemHandler(greenhouse)}</p>
                                                <p className="text-sm" ><span className="font-semibold">{isLTR ? t('farmCodingDetails.coverType') : t('farmCodingDetails.coverType')}:</span> {coverTypeHandler(greenhouse)}</p>
                                            </div>

                                            {/* First Crop */}
                                            <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                                                <p className="font-bold text-blue-800 mb-2">{isLTR ? t('farmCodingDetails.firstCropSeason') : t('farmCodingDetails.firstCropSeason')}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.greenhouses') : t('farmCodingDetails.greenhouses')}:</span> {greenhouse.firstCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.houseArea') : t('farmCodingDetails.houseArea')}:</span> {greenhouse.firstCropHouseArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.cropArea') : t('farmCodingDetails.cropArea')}:</span> {greenhouse.firstCropArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.production') : t('farmCodingDetails.production')}:</span> {greenhouse.firstCropProductionPercent} kg</p>
                                                </div>
                                            </div>

                                            {/* Second Crop */}
                                            <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                                                <p className="font-bold text-purple-800 mb-2">{isLTR ? t('farmCodingDetails.secondCropSeason') : t('farmCodingDetails.secondCropSeason')}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.greenhouses') : t('farmCodingDetails.greenhouses')}:</span> {greenhouse.secondCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.houseArea') : t('farmCodingDetails.houseArea')}:</span> {greenhouse.secondCropHouseArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.cropArea') : t('farmCodingDetails.cropArea')}:</span> {greenhouse.secondCropArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.production') : t('farmCodingDetails.production')}:</span> {greenhouse.secondCropProductionPercent} kg</p>
                                                </div>
                                            </div>

                                            {/* Third Crop */}
                                            <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                                                <p className="font-bold text-orange-800 mb-2">{isLTR ? t('farmCodingDetails.thirdCropSeason') : t('farmCodingDetails.thirdCropSeason')}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.greenhouses') : t('farmCodingDetails.greenhouses')}:</span> {greenhouse.thirdCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.houseArea') : t('farmCodingDetails.houseArea')}:</span> {greenhouse.thirdCropHouseArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.cropArea') : t('farmCodingDetails.cropArea')}:</span> {greenhouse.thirdCropArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.production') : t('farmCodingDetails.production')}:</span> {greenhouse.thirdCropProductionPercent} kg</p>
                                                </div>
                                            </div>

                                            {/* Total Summary */}
                                            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg p-3 border border-emerald-300">
                                                <p className="font-bold text-emerald-900 mb-1">{isLTR ? t('farmCodingDetails.totalSummary') : t('farmCodingDetails.totalSummary')}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.totalGreenhouses') : t('farmCodingDetails.totalGreenhouses')}:</span> {greenhouse.firstCropNoOfGreenhouses + greenhouse.secondCropNoOfGreenhouses + greenhouse.thirdCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? t('farmCodingDetails.totalArea') : t('farmCodingDetails.totalArea')}:</span> {greenhouse.firstCropArea + greenhouse.secondCropArea + greenhouse.thirdCropArea} m²</p>
                                                </div>
                                            </div>
                                        </div>
                                        {
                                            !!greenhouse.coordinates?.length && (
                                                <PolygonDisplayComponent
                                                    height='h-[200px]'
                                                    coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                                                    polygonCoordinates={greenhouse.coordinates}
                                                />
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InfoCard icon={FileText} title={isLTR ? t('farmCodingDetails.additionalInformation') : t('farmCodingDetails.additionalInformation')} gradient="from-gray-50 to-slate-50">
                        <InfoRow label={isLTR ? t('farmCodingDetails.notes') : t('farmCodingDetails.notes')} value={farm.notes} />
                        <InfoRow label={isLTR ? t('farmCodingDetails.numberOfGreenhouses') : t('farmCodingDetails.numberOfGreenhouses')} value={farm.crops.greenhouses?.length || 'None'} />
                        <InfoRow label={isLTR ? t('farmCodingDetails.destinationMachines') : t('farmCodingDetails.destinationMachines')} value={farm.numberOfDestinationMachines} />
                        {farm.updatingData && Object.keys(farm.updatingData).length > 0 && (
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <h4 className={`font-bold text-orange-800 mb-2 text-sm ${isLTR ? 'text-start' : 'text-end'}`}>
                                    {isLTR ? t('farmCodingDetails.pendingUpdates') : t('farmCodingDetails.pendingUpdates')}
                                </h4>
                                <div className="space-y-1 text-xs">
                                    {farm.updatingData.agricultureId && farm.updatingData.agricultureId !== farm.agricultureId && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.agricultureId') : t('farmCodingDetails.agricultureId')}
                                            oldValue={farm.agricultureId}
                                            newValue={farm.updatingData.agricultureId}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.phoneNumber && farm.updatingData.phoneNumber !== farm.phoneNumber && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.phone') : t('farmCodingDetails.phone')}
                                            oldValue={farm.phoneNumber}
                                            newValue={farm.updatingData.phoneNumber}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.emiratesID && farm.updatingData.emiratesID !== farm.emiratesID && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.emiratesId') : t('farmCodingDetails.emiratesId')}
                                            oldValue={farm.emiratesID}
                                            newValue={farm.updatingData.emiratesID}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.farmNo && farm.updatingData.farmNo !== farm.farmNo && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.farmNo') : t('farmCodingDetails.farmNo')}
                                            oldValue={farm.farmNo}
                                            newValue={farm.updatingData.farmNo}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.accountNo && farm.updatingData.accountNo !== farm.accountNo && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.accountNo') : t('farmCodingDetails.accountNo')}
                                            oldValue={farm.accountNo}
                                            newValue={farm.updatingData.accountNo}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.emirate && farm.updatingData.emirate !== farm.emirate?.id && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.emirate') : t('farmCodingDetails.emirate')}
                                            oldValue={isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic}
                                            newValue={isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.serviceCenter && farm.updatingData.serviceCenter !== farm.serviceCenter?.id && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.serviceCenter') : t('farmCodingDetails.serviceCenter')}
                                            oldValue={isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic}
                                            newValue={isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic}
                                            isLTR={isLTR}
                                        />
                                    )}
                                    {farm.updatingData.possessionStyle && farm.updatingData.possessionStyle !== farm.possessionStyle?.id && (
                                        <UpdatedValueRow
                                            label={isLTR ? t('farmCodingDetails.possessionStyle') : t('farmCodingDetails.possessionStyle')}
                                            oldValue={isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic}
                                            newValue={isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic}
                                            isLTR={isLTR}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </InfoCard>

                    <InfoCard icon={Calendar} title={isLTR ? t('farmCodingDetails.timestamps') : t('farmCodingDetails.timestamps')} gradient="from-indigo-50 to-purple-50">
                        <InfoRow label={isLTR ? t('farmCodingDetails.createdAt') : t('farmCodingDetails.createdAt')} value={formatDate(farm.createdAt)} />
                        <InfoRow label={isLTR ? t('farmCodingDetails.updatedAt') : t('farmCodingDetails.updatedAt')} value={formatDate(farm.updatedAt)} />
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default FarmDetails;