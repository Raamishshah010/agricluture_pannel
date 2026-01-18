import React from 'react';
import { MapPin, User, Droplet, Sprout, Calendar, FileText, Map, CheckCircle, XCircle, ArrowLeft, Users, TreePine, Home } from 'lucide-react';
import useStore from '../../store/store';

const FarmDetails = ({ farm, handleBack }) => {
    const {
        fruitTypes,
        vegetableTypes,
        fodderTypes,
        farmingSystems,
        coverTypes,
        language: lang
    } = useStore((state) => state);
    const isLTR = lang.includes('en');

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
            <span className="text-sm text-gray-600 font-semibold">{isLTR ? label + ":" : ":" + label}</span>
            <span className={`text-sm text-gray-900 text-right max-w-xs font-medium ${valueClass}`}>
                {value || 'N/A'}
            </span>
        </div>
    );

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


    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-0 md:p-6">
            <button
                onClick={handleBack}
                className="flex items-center cursor-pointer gap-2 mb-4 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-colors duration-200 border border-gray-200"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back</span>
            </button>
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2" dir="rtl">{farm.farmName}</h1>
                            <div className="flex flex-wrap gap-4 text-sm opacity-90">
                                <span>🆔 {farm.agricultureId}</span>
                                <span>📞 {farm.phoneNumber}</span>
                                <span>🏛️ Farm #{farm.farmNo}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {farm.activeStatus ? (
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
                                    <CheckCircle className="w-5 h-5" />
                                    Active
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
                                    <XCircle className="w-5 h-5" />
                                    Inactive
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
                    <StatCard label={isLTR ? "Total Area" : "المساحة الكلية"} value={`${Math.round(farm.totalArea)} ha`} icon={Map} color="blue" />
                    <StatCard label={isLTR ? "Production Wells" : "آبار الإنتاج"} value={farm.numberOfProductionWells} icon={Droplet} color="cyan" />
                    <StatCard label={isLTR ? "Workers" : "العمال"} value={farm.noOfWorkers || 0} icon={Users} color="purple" />
                    <StatCard label={isLTR ? "Water Sources" : "مصادر المياه"} value={farm.waterSources?.length || 0} icon={Droplet} color="teal" />
                </div>

                {/* Owner & Holder Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <InfoCard icon={User} title={isLTR ? "Owner Information" : "معلومات المالك"} gradient="from-blue-50 to-cyan-50">
                        <InfoRow label={isLTR ? "Name" : "اسم"} value={farm.owner?.name} />
                        <InfoRow label={isLTR ? "Emirates ID" : "الهوية الإماراتية"} value={farm.emiratesID} />
                        <InfoRow label={isLTR ? "Email" : "بريد إلكتروني"} value={farm.owner?.email} />
                        <InfoRow
                            label={isLTR ? "Email Verified" : "تم التحقق من البريد الإلكتروني"}
                            value={farm.owner?.isEmailVerified ? 'Yes ✓' : 'No ✗'}
                            valueClass={farm.owner?.isEmailVerified ? 'text-green-600' : 'text-red-600'}
                        />
                        <InfoRow label={isLTR ? "Phone Number" : "رقم التليفون"} value={farm.phoneNumber} />
                    </InfoCard>

                    <InfoCard icon={Users} title={isLTR ? "Holder Information" : "معلومات الحامل"} gradient="from-purple-50 to-pink-50">
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
                    <InfoCard icon={MapPin} title={isLTR ? "Location Details" : "تفاصيل الموقع"} gradient="from-amber-50 to-orange-50">
                        <InfoRow label={isLTR ? "Location" : "موقع"} value={isLTR ? farm.location?.name : farm.location?.nameInArrabic} />
                        <InfoRow label={isLTR ? "Region" : "منطقة"} value={isLTR ? farm.region?.name : farm.region?.nameInArrabic} />
                        <InfoRow label={isLTR ? "Emirate" : "الإمارة"} value={isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic} />
                        <InfoRow label={isLTR ? "Service Center" : "مركز الخدمة"} value={isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic} />
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
                            View on Google Maps
                        </a>
                    </InfoCard>

                    <InfoCard icon={Home} title={isLTR ? "Farm Properties" : "خصائص المزرعة"} gradient="from-green-50 to-lime-50">
                        <InfoRow label={isLTR ? "Farm Serial" : "مسلسل المزرعة"} value={farm.farmSerial} />
                        <InfoRow label={isLTR ? `Account No` : `رقم الحساب`} value={farm.accountNo} />
                        <InfoRow label={isLTR ? `Size` : `الحجم`} value={`${Math.round(farm.size)} ha`} />
                        <InfoRow label={isLTR ? `Possession Style` : `أسلوب الاستحواذ`} value={isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic} />
                        <InfoRow label={isLTR ? `Farming System` : `نظام الزراعة`} value={farm.farmingSystem?.map(fs => isLTR ? fs.name : fs.nameInArrabic).join(', ')} />
                    </InfoCard>
                </div>
                <InfoCard icon={Sprout} title={isLTR ? "Land Use Distribution" : "توزيع استخدامات الأراضي"} gradient="from-teal-50 to-cyan-50">
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
                    <InfoCard icon={Droplet} title={isLTR ? "Irrigation Systems" : "أنظمة الري"} gradient="from-blue-50 to-indigo-50">
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

                    <InfoCard icon={Droplet} title={isLTR ? "Water Sources" : "أنظمة الري"} gradient="from-cyan-50 to-teal-50">
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
                        <h3 className="text-xl font-bold text-gray-800">{isLTR ? "Crops & Production" : "المحاصيل والإنتاج"}</h3>
                    </div>

                    {/* Fruits */}
                    {farm.crops?.fruits && farm.crops.fruits.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🌳 {isLTR ? "Fruit Trees" : "أشجار الفاكهة"}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-re gap-4 [direction:${isLTR ? "ltr" : "rtl"}]`}>
                                {farm.crops.fruits.map((fruit, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
                                        <h5 className="font-bold text-green-800 mb-2 text-lg" >{fruitType(fruit)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Area" : "منطقة"}:</span> {fruit.area} m²</p>
                                            <p><span className="font-semibold">{isLTR ? "Total Trees" : " مجموع الأشجار"}:</span> {fruit.totalTrees}</p>
                                            <p><span className="font-semibold">{isLTR ? "Fruit Bearing" : "تحمل الفاكهة"}:</span> {fruit.fruitBearing}</p>
                                            <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {fruit.productionPercent} kg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vegetables */}
                    {farm.crops?.vegetables && farm.crops.vegetables.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🥬 {isLTR ? "Vegetables" : "خضار"}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-re gap-4 [direction:${isLTR ? "ltr" : "rtl"}]`}>
                                {farm.crops.vegetables.map((veg, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-lime-500 shadow-md hover:shadow-lg transition-shadow">
                                        <h5 className="font-bold text-lime-800 mb-2" >{vegetableType(veg)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Area" : "منطقة"}:</span> {veg.area} m²</p>
                                            <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {veg.productionPercent} kg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Field Crops & Fodder */}
                    {farm.crops?.fieldCropsFodder && farm.crops.fieldCropsFodder.length > 0 && (
                        <div>
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🌾 {isLTR ? "Field Crops & Fodder" : "المحاصيل الحقلية والأعلاف"} </h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-re gap-4 [direction:${isLTR ? "ltr" : "rtl"}]`}>
                                {farm.crops.fieldCropsFodder.map((fodder, idx) => (
                                    <div key={idx} className={`bg-white rounded-lg p-4 border-l-4 border-yellow-500 shadow-md hover:shadow-lg transition-shadow `}>
                                        <h5 className="font-bold text-yellow-800 mb-2" >{fodderTypeHandler(fodder)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Area" : "منطقة"}:</span> {fodder.area} m²</p>
                                            <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {fodder.productionPercent} kg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* greenhouses */}
                    {farm.crops?.greenhouses && farm.crops.greenhouses.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🏠 {isLTR ? "Greenhouse Crops" : "محاصيل الدفيئة"}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-re gap-4 [direction:${isLTR ? "ltr" : "rtl"}]`}>
                                {farm.crops.greenhouses.map((greenhouse, idx) => (
                                    <div key={idx} className="bg-white rounded-xl p-5 border-2 border-emerald-300 shadow-lg hover:shadow-xl transition-shadow">
                                        <div className={`flex items-start justify-between mb-4 border-b-2 border-emerald-100 pb-3 ${isLTR ? 'flex-row' : "flex-row-reverse"}`}>
                                            <div>
                                                <h5 className="font-bold text-emerald-900 text-xl mb-1" >{greenhouse.crop}</h5>
                                                <p className="text-sm text-gray-600" >
                                                    <span className="font-semibold">{isLTR ? "Greenhouse Type" : "نوع الدفيئة"}:</span> {greenhouse.greenhouseType}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                {isLTR ? "Greenhouse" : "دفيئة"}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="bg-emerald-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-600 font-semibold mb-1">{isLTR ? "System Details" : "تفاصيل النظام"}</p>
                                                <p className="text-sm" ><span className="font-semibold">{isLTR ? "Farming System" : "نظام الزراعة"}:</span> {farmingSystemHandler(greenhouse)}</p>
                                                <p className="text-sm" ><span className="font-semibold">{isLTR ? "Cover Type" : "نوع الغطاء"}:</span> {coverTypeHandler(greenhouse)}</p>
                                            </div>

                                            {/* First Crop */}
                                            <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                                                <p className="font-bold text-blue-800 mb-2">{isLTR ? "First Crop Season" : "موسم المحاصيل الأول"}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? "Greenhouses" : "الدفيئات الزراعية"}:</span> {greenhouse.firstCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? "House Area" : "مساحة المنزل"}:</span> {greenhouse.firstCropHouseArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? "Crop Area" : "مساحة المحصول"}:</span> {greenhouse.firstCropArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {greenhouse.firstCropProductionPercent} kg</p>
                                                </div>
                                            </div>

                                            {/* Second Crop */}
                                            <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                                                <p className="font-bold text-purple-800 mb-2">{isLTR ? "Second Crop Season" : "الموسم الزراعي الثاني"}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? "Greenhouses" : "الدفيئات الزراعية"}:</span> {greenhouse.secondCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? "House Area" : "مساحة المنزل"}:</span> {greenhouse.secondCropHouseArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? "Crop Area" : "مساحة المحصول"}:</span> {greenhouse.secondCropArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {greenhouse.secondCropProductionPercent} kg</p>
                                                </div>
                                            </div>

                                            {/* Third Crop */}
                                            <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                                                <p className="font-bold text-orange-800 mb-2">{isLTR ? "Third Crop Season" : "موسم المحاصيل الثالث"}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? "Greenhouses" : "الدفيئات الزراعية"}:</span> {greenhouse.thirdCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? "House Area" : "مساحة المنزل"}:</span> {greenhouse.thirdCropHouseArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? "Crop Area" : "مساحة المحصول"}:</span> {greenhouse.thirdCropArea} m²</p>
                                                    <p><span className="font-semibold">{isLTR ? "Production" : "إنتاج"}:</span> {greenhouse.thirdCropProductionPercent} kg</p>
                                                </div>
                                            </div>

                                            {/* Total Summary */}
                                            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg p-3 border border-emerald-300">
                                                <p className="font-bold text-emerald-900 mb-1">{isLTR ? "Total Summary" : "ملخص إجمالي"}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p><span className="font-semibold">{isLTR ? "Total Greenhouses" : "إجمالي الدفيئات الزراعية"}:</span> {greenhouse.firstCropNoOfGreenhouses + greenhouse.secondCropNoOfGreenhouses + greenhouse.thirdCropNoOfGreenhouses}</p>
                                                    <p><span className="font-semibold">{isLTR ? "Total Area" : "المساحة الإجمالية"}:</span> {greenhouse.firstCropArea + greenhouse.secondCropArea + greenhouse.thirdCropArea} m²</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InfoCard icon={FileText} title={isLTR ? "Additional Information" : "معلومات إضافية"} gradient="from-gray-50 to-slate-50">
                        <InfoRow label={isLTR ? "Notes" : "ملحوظات"} value={farm.notes} />
                        <InfoRow label={isLTR ? "Number of Greenhouses" : "عدد البيوت الزجاجية"} value={farm.crops.greenhouses?.length || 'None'} />
                        <InfoRow label={isLTR ? "Destination Machines" : "آلات الوجهة"} value={farm.numberOfDestinationMachines} />
                    </InfoCard>

                    <InfoCard icon={Calendar} title={isLTR ? "Timestamps" : "الطوابع الزمنية"} gradient="from-indigo-50 to-purple-50">
                        <InfoRow label={isLTR ? "Created At" : "تم إنشاؤه في"} value={formatDate(farm.createdAt)} />
                        <InfoRow label={isLTR ? "Updated At" : "تم التحديث في"} value={formatDate(farm.updatedAt)} />
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default FarmDetails;