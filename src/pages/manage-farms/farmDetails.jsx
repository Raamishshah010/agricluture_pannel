import React, { useState } from 'react';
import { MapPin, User, Droplet, Sprout, Calendar, FileText, Map, CheckCircle, XCircle, ArrowLeft, Users, TreePine, Home, Pencil, SquarePenIcon, Download, ChevronDown } from 'lucide-react';
import useStore from '../../store/store';
import PolygonDisplayComponent from '../../components/displayPolygon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { amiriFontBase64 } from '../../assets/AmiriFont';
import { toast } from 'react-toastify';

const FarmDetails = ({ farm, handleBack, handleEdit }) => {
    const {
        fruitTypes,
        vegetableTypes,
        fodderTypes,
        farmingSystems,
        coverTypes,
        farmers,
        livestocks,
        language: lang
    } = useStore((state) => state);

    const [isDownloadOpen, setIsDownloadOpen] = useState(false);

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
            <div className={`flex items-center ${isLTR ? "justify-start" : "justify-start"} gap-3 mb-5 pb-3 border-b-2 border-green-200`}>
                {Icon && <Icon className="w-6 h-6 text-green-600" />}
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );

    const InfoRow = ({ label, value, valueClass = "" }) => (
        <div className={`flex justify-between items-start py-2 hover:bg-white/50 px-2 rounded transition-colors ${isLTR ? "flex-row" : "flex-row"}`}>
            <span className="text-sm text-gray-600 font-semibold">{isLTR ? `${label}:` : `${label}:`}</span>
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
        return !lang.includes('en') ? (item?.nameInArrabic ?? fr.fruitType) : (item?.name ?? fr.fruitType);
    };

    const stockType = (fr) => {
        const item = livestocks.find((it) => it.id === fr.stockId);
        return !lang.includes('en') ? (item?.nameInArrabic ?? fr.stockType) : (item?.name ?? fr.stockType);
    };

    const vegetableType = (veg) => {
        const item = vegetableTypes.find((it) => it.id === veg.vegetableId);
        return !lang.includes('en') ? (item?.nameInArrabic ?? veg.vegetableType) : (item?.name ?? veg.vegetableType);
    };

    const fodderTypeHandler = (fodd) => {
        const item = fodderTypes.find((it) => it.id === fodd.fodderId);
        return !lang.includes('en') ? (item?.nameInArrabic ?? fodd.fodderType) : (item?.name ?? fodd.fodderType);
    };

    const farmingSystemHandler = (fs) => {
        const item = farmingSystems.find((it) => it.id === fs.farmingSystemId);
        return !lang.includes('en') ? (item?.nameInArrabic ?? fs.farmingSystem) : (item?.name ?? fs.farmingSystem);
    };

    const coverTypeHandler = (fs) => {
        const item = coverTypes.find((it) => it.id === fs.coverTypeId);
        return !lang.includes('en') ? (item?.nameInArrabic ?? fs.coverType) : (item?.name ?? fs.coverType);
    };

    // Helper to get localized possession style name
    const getPossessionStyleName = () => {
        if (!farm.possessionStyle) return 'N/A';
        return isLTR ? farm.possessionStyle?.name : farm.possessionStyle?.nameInArrabic;
    };

    // Helper to get localized farming system names
    const getFarmingSystemNames = () => {
        if (!farm.farmingSystem || farm.farmingSystem.length === 0) return 'N/A';
        return farm.farmingSystem.map(fs => isLTR ? fs.name : fs.nameInArrabic).join(', ');
    };

    const isLTR = lang.includes('en');
    const coder = farmers.find(f => f.farms?.includes(farm.id));

    // Download as PDF
    const downloadPDF = () => {
        const doc = new jsPDF();
        
        // Font Setup
        doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');

        let yPosition = 20;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(34, 197, 94);
        const titleText = isLTR ? `Farm Details: ${farm.farmName}` : `تفاصيل المزرعة: ${farm.farmName}`;
        doc.text(titleText, 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Basic Information
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(isLTR ? 'Basic Information' : 'المعلومات الأساسية', 20, yPosition);
        yPosition += 10;

        const basicInfo = [
            [isLTR ? 'Agriculture ID' : 'معرف الزراعة', farm.agricultureId || 'N/A'],
            [isLTR ? 'Phone Number' : 'رقم الهاتف', farm.phoneNumber || 'N/A'],
            [isLTR ? 'Farm Number' : 'رقم المزرعة', farm.farmNo || 'N/A'],
            [isLTR ? 'Farm Serial' : 'مسلسل المزرعة', farm.farmSerial || 'N/A'],
            [isLTR ? 'Status' : 'الحالة', farm.status || 'N/A'],
            [isLTR ? 'Total Area' : 'المساحة الإجمالية', `${Math.round(farm.totalArea)} ${isLTR ? 'ha' : 'هكتار'}`],
            [isLTR ? 'Size' : 'الحجم', `${Math.round(farm.size)} ${isLTR ? 'ha' : 'هكتار'}`],
            [isLTR ? 'Possession Style' : 'أسلوب الاستحواذ', getPossessionStyleName()],
            [isLTR ? 'Farming System' : 'نظام الزراعة', getFarmingSystemNames()],
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [[isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة']],
            body: basicInfo,
            theme: 'grid',
            styles: { font: 'Amiri', fontSize: 10, halign: 'center' },
            headStyles: { fillColor: [34, 197, 94], halign: 'center' },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Owner Information
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text(isLTR ? 'Owner Information' : 'معلومات المالك', 20, yPosition);
        yPosition += 10;

        const ownerInfo = [
            [isLTR ? 'Name' : 'الاسم', farm.owner?.name || 'N/A'],
            [isLTR ? 'Email' : 'البريد الإلكتروني', farm.owner?.email || 'N/A'],
            [isLTR ? 'Emirates ID' : 'الهوية الإماراتية', farm.emiratesID || 'N/A'],
            [isLTR ? 'Email Verified' : 'تم التحقق من البريد الإلكتروني', farm.owner?.isEmailVerified ? (isLTR ? 'Yes' : 'نعم') : (isLTR ? 'No' : 'لا')],
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [[isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة']],
            body: ownerInfo,
            theme: 'grid',
            styles: { font: 'Amiri', fontSize: 10, halign: 'center' },
            headStyles: { fillColor: [34, 197, 94], halign: 'center' },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Holder Information
        if (farm.holder) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Holder Information' : 'معلومات الحامل', 20, yPosition);
            yPosition += 10;

            const holderInfo = [
                [isLTR ? 'Name' : 'الاسم', farm.holder?.name || 'N/A'],
                [isLTR ? 'Email' : 'البريد الإلكتروني', farm.holder?.email || 'N/A'],
                [isLTR ? 'Email Verified' : 'تم التحقق من البريد الإلكتروني', farm.holder?.isEmailVerified ? (isLTR ? 'Yes' : 'نعم') : (isLTR ? 'No' : 'لا')],
                [isLTR ? 'Phone Number' : 'رقم الهاتف', farm.holder?.phoneNumber || 'N/A'],
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [[isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة']],
                body: holderInfo,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 10, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Location Information
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text(isLTR ? 'Location Information' : 'معلومات الموقع', 20, yPosition);
        yPosition += 10;

        const locationInfo = [
            [isLTR ? 'Location' : 'الموقع', (isLTR ? farm.location?.name : farm.location?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Region' : 'المنطقة', (isLTR ? farm.region?.name : farm.region?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Emirate' : 'الإمارة', (isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Service Center' : 'مركز الخدمة', (isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Coordinates' : 'الإحداثيات', `${farm.coordinates?.lat || 'N/A'}, ${farm.coordinates?.lng || 'N/A'}`],
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [[isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة']],
            body: locationInfo,
            theme: 'grid',
            styles: { font: 'Amiri', fontSize: 10, halign: 'center' },
            headStyles: { fillColor: [34, 197, 94], halign: 'center' },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Land Use Information
        if (farm.landUse) {
            if (yPosition > 230) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Land Use Distribution' : 'توزيع استخدامات الأراضي', 20, yPosition);
            yPosition += 10;

            const landUseInfo = [
                [isLTR ? 'Vegetables (Open)' : 'الخضروات (مفتوحة)', `${farm.landUse?.arrableLand?.vegetablesOpen || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Fruit & Palm Trees (Open)' : 'أشجار الفاكهة والنخيل (مفتوح)', `${farm.landUse?.arrableLand?.fruitPalmTreesOpen || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Field Crops & Fodder' : 'المحاصيل الحقلية والأعلاف', `${farm.landUse?.arrableLand?.fieldCropsFodder || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Buildings & Roads' : 'المباني والطرق', `${farm.landUse?.nonArrableLand?.buildingsRoads || 0} ${isLTR ? 'm²' : 'م²'}`],
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [[isLTR ? 'Land Use Type' : 'نوع استخدام الأرض', isLTR ? 'Area' : 'المساحة']],
                body: landUseInfo,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 10, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Water Sources & Irrigation
        if (farm.waterSources && farm.waterSources.length > 0) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Water & Irrigation' : 'المياه والري', 20, yPosition);
            yPosition += 10;

            const waterInfo = [
                [isLTR ? 'Water Sources' : 'مصادر المياه', farm.waterSources.map(ws => isLTR ? ws.name : ws.nameInArrabic).join(', ')],
                [isLTR ? 'Irrigation Systems' : 'أنظمة الري', farm.irrigationSystem?.map(is => isLTR ? is.name : is.nameInArrabic).join(', ') || 'N/A'],
                [isLTR ? 'Production Wells' : 'آبار الإنتاج', farm.numberOfProductionWells || 'N/A'],
                [isLTR ? 'Desalination Units' : 'وحدات تحلية المياه', farm.desalinationUnits || 'N/A'],
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [[isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة']],
                body: waterInfo,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Crops Information - Fruits
        if (farm.crops?.fruits && farm.crops.fruits.length > 0) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Fruit Trees' : 'أشجار الفاكهة', 20, yPosition);
            yPosition += 10;

            const fruitsData = farm.crops.fruits.map(fruit => [
                fruitType(fruit),
                `${fruit.area} ${isLTR ? 'm²' : 'م²'}`,
                fruit.totalTrees || 'N/A',
                `${fruit.productionPercent} ${isLTR ? 'kg' : 'كجم'}`
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [[
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Area' : 'المساحة',
                    isLTR ? 'Total Trees' : 'إجمالي الأشجار',
                    isLTR ? 'Production' : 'الإنتاج'
                ]],
                body: fruitsData,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Vegetables
        if (farm.crops?.vegetables && farm.crops.vegetables.length > 0) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Vegetables' : 'الخضروات', 20, yPosition);
            yPosition += 10;

            const vegetablesData = farm.crops.vegetables.map(veg => [
                vegetableType(veg),
                `${veg.area} ${isLTR ? 'm²' : 'م²'}`,
                `${veg.productionPercent} ${isLTR ? 'kg' : 'كجم'}`
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [[
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Area' : 'المساحة',
                    isLTR ? 'Production' : 'الإنتاج'
                ]],
                body: vegetablesData,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Field Crops & Fodder
        if (farm.crops?.fieldCropsFodder && farm.crops.fieldCropsFodder.length > 0) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Field Crops & Fodder' : 'المحاصيل الحقلية والأعلاف', 20, yPosition);
            yPosition += 10;

            const fodderData = farm.crops.fieldCropsFodder.map(fodder => [
                fodderTypeHandler(fodder),
                `${fodder.area} ${isLTR ? 'm²' : 'م²'}`,
                `${fodder.productionPercent} ${isLTR ? 'kg' : 'كجم'}`
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [[
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Area' : 'المساحة',
                    isLTR ? 'Production' : 'الإنتاج'
                ]],
                body: fodderData,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Livestocks
        if (farm.livestocks && farm.livestocks.length > 0) {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(14);
            doc.text(isLTR ? 'Livestocks' : 'الثروة الحيوانية', 20, yPosition);
            yPosition += 10;

            const livestocksData = farm.livestocks.map(stock => [
                stockType(stock),
                stock.numberOfAnimals || 'N/A'
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [[
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Number of Animals' : 'عدد الحيوانات'
                ]],
                body: livestocksData,
                theme: 'grid',
                styles: { font: 'Amiri', fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [34, 197, 94], halign: 'center' },
            });

            yPosition = doc.lastAutoTable.finalY + 15;
        }

        doc.save(`farm-details-${farm.farmName}.pdf`);
        setIsDownloadOpen(false);
        toast.success(isLTR ? 'PDF downloaded successfully!' : 'تم تنزيل ملف PDF بنجاح!');
    };

    // Download as Excel
    const downloadExcel = () => {
        const workbook = XLSX.utils.book_new();

        // Basic Information Sheet
        const basicData = [
            [isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة'],
            [isLTR ? 'Farm Name' : 'اسم المزرعة', farm.farmName],
            [isLTR ? 'Agriculture ID' : 'معرف الزراعة', farm.agricultureId],
            [isLTR ? 'Phone Number' : 'رقم الهاتف', farm.phoneNumber],
            [isLTR ? 'Farm Number' : 'رقم المزرعة', farm.farmNo],
            [isLTR ? 'Farm Serial' : 'مسلسل المزرعة', farm.farmSerial],
            [isLTR ? 'Status' : 'الحالة', farm.status],
            [isLTR ? 'Total Area' : 'المساحة الإجمالية', `${Math.round(farm.totalArea)} ${isLTR ? 'ha' : 'هكتار'}`],
            [isLTR ? 'Size' : 'الحجم', `${Math.round(farm.size)} ${isLTR ? 'ha' : 'هكتار'}`],
            [isLTR ? 'Possession Style' : 'أسلوب الاستحواذ', getPossessionStyleName()],
            [isLTR ? 'Farming System' : 'نظام الزراعة', getFarmingSystemNames()],
            [isLTR ? 'Workers' : 'العمال', farm.noOfWorkers || 0],
        ];
        const basicSheet = XLSX.utils.aoa_to_sheet(basicData);
        XLSX.utils.book_append_sheet(workbook, basicSheet, isLTR ? 'Basic Info' : 'المعلومات الأساسية');

        // Owner Information Sheet
        const ownerData = [
            [isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة'],
            [isLTR ? 'Name' : 'الاسم', farm.owner?.name || 'N/A'],
            [isLTR ? 'Email' : 'البريد الإلكتروني', farm.owner?.email || 'N/A'],
            [isLTR ? 'Emirates ID' : 'الهوية الإماراتية', farm.emiratesID || 'N/A'],
            [isLTR ? 'Email Verified' : 'تم التحقق من البريد الإلكتروني', farm.owner?.isEmailVerified ? (isLTR ? 'Yes' : 'نعم') : (isLTR ? 'No' : 'لا')],
        ];
        const ownerSheet = XLSX.utils.aoa_to_sheet(ownerData);
        XLSX.utils.book_append_sheet(workbook, ownerSheet, isLTR ? 'Owner Info' : 'معلومات المالك');

        // Holder Information Sheet
        if (farm.holder) {
            const holderData = [
                [isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة'],
                [isLTR ? 'Name' : 'الاسم', farm.holder?.name || 'N/A'],
                [isLTR ? 'Email' : 'البريد الإلكتروني', farm.holder?.email || 'N/A'],
                [isLTR ? 'Email Verified' : 'تم التحقق من البريد الإلكتروني', farm.holder?.isEmailVerified ? (isLTR ? 'Yes' : 'نعم') : (isLTR ? 'No' : 'لا')],
                [isLTR ? 'Phone Number' : 'رقم الهاتف', farm.holder?.phoneNumber || 'N/A'],
            ];
            const holderSheet = XLSX.utils.aoa_to_sheet(holderData);
            XLSX.utils.book_append_sheet(workbook, holderSheet, isLTR ? 'Holder Info' : 'معلومات الحامل');
        }

        // Location Information Sheet
        const locationData = [
            [isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة'],
            [isLTR ? 'Location' : 'الموقع', (isLTR ? farm.location?.name : farm.location?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Region' : 'المنطقة', (isLTR ? farm.region?.name : farm.region?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Emirate' : 'الإمارة', (isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Service Center' : 'مركز الخدمة', (isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Coordinates' : 'الإحداثيات', `${farm.coordinates?.lat || 'N/A'}, ${farm.coordinates?.lng || 'N/A'}`],
        ];
        const locationSheet = XLSX.utils.aoa_to_sheet(locationData);
        XLSX.utils.book_append_sheet(workbook, locationSheet, isLTR ? 'Location Info' : 'معلومات الموقع');

        // Land Use Sheet
        if (farm.landUse) {
            const landUseData = [
                [isLTR ? 'Land Use Type' : 'نوع استخدام الأرض', isLTR ? 'Area' : 'المساحة'],
                [isLTR ? 'Vegetables (Open)' : 'الخضروات (مفتوحة)', `${farm.landUse?.arrableLand?.vegetablesOpen || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Fruit & Palm Trees (Open)' : 'أشجار الفاكهة والنخيل (مفتوح)', `${farm.landUse?.arrableLand?.fruitPalmTreesOpen || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Field Crops & Fodder' : 'المحاصيل الحقلية والأعلاف', `${farm.landUse?.arrableLand?.fieldCropsFodder || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Left for Rest' : 'غادر للراحة', `${Math.round(farm.landUse?.arrableLand?.leftForRest || 0)} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Nurseries' : 'مشاتل', `${farm.landUse?.arrableLand?.nurseries || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Buildings & Roads' : 'المباني والطرق', `${farm.landUse?.nonArrableLand?.buildingsRoads || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Windbreaks' : 'مصدات الرياح', `${farm.landUse?.nonArrableLand?.windbreaks || 0} ${isLTR ? 'm²' : 'م²'}`],
                [isLTR ? 'Barren Land' : 'أرض قاحلة', `${farm.landUse?.nonArrableLand?.barrenLand || 0} ${isLTR ? 'm²' : 'م²'}`],
            ];
            const landUseSheet = XLSX.utils.aoa_to_sheet(landUseData);
            XLSX.utils.book_append_sheet(workbook, landUseSheet, isLTR ? 'Land Use' : 'استخدام الأراضي');
        }

        // Water & Irrigation Sheet
        if (farm.waterSources && farm.waterSources.length > 0) {
            const waterData = [
                [isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة'],
                [isLTR ? 'Water Sources' : 'مصادر المياه', farm.waterSources.map(ws => isLTR ? ws.name : ws.nameInArrabic).join(', ')],
                [isLTR ? 'Irrigation Systems' : 'أنظمة الري', farm.irrigationSystem?.map(is => isLTR ? is.name : is.nameInArrabic).join(', ') || 'N/A'],
                [isLTR ? 'Production Wells' : 'آبار الإنتاج', farm.numberOfProductionWells || 'N/A'],
                [isLTR ? 'Desalination Units' : 'وحدات تحلية المياه', farm.desalinationUnits || 'N/A'],
            ];
            const waterSheet = XLSX.utils.aoa_to_sheet(waterData);
            XLSX.utils.book_append_sheet(workbook, waterSheet, isLTR ? 'Water & Irrigation' : 'المياه والري');
        }

        // Crops Sheet - Fruits
        if (farm.crops?.fruits && farm.crops.fruits.length > 0) {
            const fruitsData = [
                [
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Area' : 'المساحة',
                    isLTR ? 'Total Trees' : 'إجمالي الأشجار',
                    isLTR ? 'Fruit Bearing' : 'تحمل الفاكهة',
                    isLTR ? 'Production' : 'الإنتاج'
                ],
                ...farm.crops.fruits.map(fruit => [
                    fruitType(fruit),
                    `${fruit.area} ${isLTR ? 'm²' : 'م²'}`,
                    fruit.totalTrees,
                    fruit.fruitBearing,
                    `${fruit.productionPercent} ${isLTR ? 'kg' : 'كجم'}`
                ])
            ];
            const fruitsSheet = XLSX.utils.aoa_to_sheet(fruitsData);
            XLSX.utils.book_append_sheet(workbook, fruitsSheet, isLTR ? 'Fruit Trees' : 'أشجار الفاكهة');
        }

        // Vegetables
        if (farm.crops?.vegetables && farm.crops.vegetables.length > 0) {
            const vegetablesData = [
                [
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Area' : 'المساحة',
                    isLTR ? 'Production' : 'الإنتاج'
                ],
                ...farm.crops.vegetables.map(veg => [
                    vegetableType(veg),
                    `${veg.area} ${isLTR ? 'm²' : 'م²'}`,
                    `${veg.productionPercent} ${isLTR ? 'kg' : 'كجم'}`
                ])
            ];
            const vegetablesSheet = XLSX.utils.aoa_to_sheet(vegetablesData);
            XLSX.utils.book_append_sheet(workbook, vegetablesSheet, isLTR ? 'Vegetables' : 'الخضروات');
        }

        // Field Crops & Fodder
        if (farm.crops?.fieldCropsFodder && farm.crops.fieldCropsFodder.length > 0) {
            const fodderData = [
                [
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Area' : 'المساحة',
                    isLTR ? 'Production' : 'الإنتاج'
                ],
                ...farm.crops.fieldCropsFodder.map(fodder => [
                    fodderTypeHandler(fodder),
                    `${fodder.area} ${isLTR ? 'm²' : 'م²'}`,
                    `${fodder.productionPercent} ${isLTR ? 'kg' : 'كجم'}`
                ])
            ];
            const fodderSheet = XLSX.utils.aoa_to_sheet(fodderData);
            XLSX.utils.book_append_sheet(workbook, fodderSheet, isLTR ? 'Field Crops & Fodder' : 'المحاصيل والأعلاف');
        }

        // Livestocks
        if (farm.livestocks && farm.livestocks.length > 0) {
            const livestocksData = [
                [
                    isLTR ? 'Type' : 'النوع',
                    isLTR ? 'Number of Animals' : 'عدد الحيوانات'
                ],
                ...farm.livestocks.map(stock => [
                    stockType(stock),
                    stock.numberOfAnimals
                ])
            ];
            const livestocksSheet = XLSX.utils.aoa_to_sheet(livestocksData);
            XLSX.utils.book_append_sheet(workbook, livestocksSheet, isLTR ? 'Livestocks' : 'الثروة الحيوانية');
        }

        XLSX.writeFile(workbook, `farm-details-${farm.farmName}.xlsx`);
        setIsDownloadOpen(false);
        toast.success(isLTR ? 'Excel file downloaded successfully!' : 'تم تنزيل ملف Excel بنجاح!');
    };

    // Download as CSV
    const downloadCSV = () => {
        const headers = [isLTR ? 'Field' : 'الحقل', isLTR ? 'Value' : 'القيمة'];
        const csvData = [
            [isLTR ? 'Farm Name' : 'اسم المزرعة', farm.farmName],
            [isLTR ? 'Agriculture ID' : 'معرف الزراعة', farm.agricultureId],
            [isLTR ? 'Phone Number' : 'رقم الهاتف', farm.phoneNumber],
            [isLTR ? 'Farm Number' : 'رقم المزرعة', farm.farmNo],
            [isLTR ? 'Farm Serial' : 'مسلسل المزرعة', farm.farmSerial],
            [isLTR ? 'Status' : 'الحالة', farm.status],
            [isLTR ? 'Total Area' : 'المساحة الإجمالية', `${Math.round(farm.totalArea)} ${isLTR ? 'ha' : 'هكتار'}`],
            [isLTR ? 'Size' : 'الحجم', `${Math.round(farm.size)} ${isLTR ? 'ha' : 'هكتار'}`],
            [isLTR ? 'Possession Style' : 'أسلوب الاستحواذ', getPossessionStyleName()],
            [isLTR ? 'Farming System' : 'نظام الزراعة', getFarmingSystemNames()],
            [isLTR ? 'Workers' : 'العمال', farm.noOfWorkers || 0],
            [isLTR ? 'Owner Name' : 'اسم المالك', farm.owner?.name || 'N/A'],
            [isLTR ? 'Owner Email' : 'بريد المالك الإلكتروني', farm.owner?.email || 'N/A'],
            [isLTR ? 'Emirates ID' : 'الهوية الإماراتية', farm.emiratesID || 'N/A'],
            [isLTR ? 'Location' : 'الموقع', (isLTR ? farm.location?.name : farm.location?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Region' : 'المنطقة', (isLTR ? farm.region?.name : farm.region?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Emirate' : 'الإمارة', (isLTR ? farm.emirate?.name : farm.emirate?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Service Center' : 'مركز الخدمة', (isLTR ? farm.serviceCenter?.name : farm.serviceCenter?.nameInArrabic) || 'N/A'],
            [isLTR ? 'Water Sources' : 'مصادر المياه', farm.waterSources?.map(ws => isLTR ? ws.name : ws.nameInArrabic).join(', ') || 'N/A'],
            [isLTR ? 'Irrigation Systems' : 'أنظمة الري', farm.irrigationSystem?.map(is => isLTR ? is.name : is.nameInArrabic).join(', ') || 'N/A'],
            [isLTR ? 'Production Wells' : 'آبار الإنتاج', farm.numberOfProductionWells || 'N/A'],
            [isLTR ? 'Desalination Units' : 'وحدات تحلية المياه', farm.desalinationUnits || 'N/A'],
        ];

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `farm-details-${farm.farmName}.csv`;
        link.click();
        setIsDownloadOpen(false);
        toast.success(isLTR ? 'CSV file downloaded successfully!' : 'تم تنزيل ملف CSV بنجاح!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-0 md:p-6">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleBack}
                    className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-colors duration-200 border border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Back</span>
                </button>

                {/* Download Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
                    >
                        <Download size={20} />
                        <span className="font-medium">Download</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isDownloadOpen ? "rotate-180" : ""}`}
                        />
                    </button>

                    {isDownloadOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsDownloadOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                                <button
                                    onClick={downloadPDF}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                        <svg
                                            className="w-5 h-5 text-emerald-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">PDF Format</div>
                                        <div className="text-xs text-gray-500">Printable document</div>
                                    </div>
                                </button>
                                <button
                                    onClick={downloadExcel}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                        <svg
                                            className="w-5 h-5 text-emerald-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">Excel Format</div>
                                        <div className="text-xs text-gray-500">Spreadsheet file</div>
                                    </div>
                                </button>
                                <button
                                    onClick={downloadCSV}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group rounded-b-xl"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                        <svg
                                            className="w-5 h-5 text-emerald-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">CSV Format</div>
                                        <div className="text-xs text-gray-500">Comma-separated</div>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                            <button title='Edit Farm' className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold" onClick={() => handleEdit(farm)}>
                                <SquarePenIcon size={14} />
                                <span>Edit</span>
                            </button>
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
                    {
                        coder && (
                            <InfoCard icon={Users} title={isLTR ? "Coder Information" : "معلومات المبرمج"} gradient="from-purple-50 to-pink-50">
                                <InfoRow label={isLTR ? "Name" : "اسم"} value={coder?.name} />
                                <InfoRow label={isLTR ? "Email" : "بريد إلكتروني"} value={coder?.email} />
                                <InfoRow
                                    label={isLTR ? "Email Verified" : "تم التحقق من البريد الإلكتروني"}
                                    value={coder?.isEmailVerified ? 'Yes ✓' : 'No ✗'}
                                    valueClass={coder?.isEmailVerified ? 'text-green-600' : 'text-red-600'}
                                />
                                <InfoRow label={isLTR ? "Phone Number" : "رقم التليفون"} value={coder?.phoneNumber || 'N/A'} />
                            </InfoCard>
                        )
                    }
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
                            value={`${farm.coordinates?.lat}, ${farm.coordinates?.lng}`}
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
                {
                    !!farm.mapData?.length && (
                        <PolygonDisplayComponent
                            coordinates={farm.coordinates || { lat: 23.4241, lng: 53.8478 }}
                            polygonCoordinates={farm.mapData}
                        />
                    )
                }
                <InfoCard icon={Sprout} title={isLTR ? "Land Use Distribution" : "توزيع استخدامات الأراضي"} gradient="from-teal-50 to-cyan-50" >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-start"}`}>
                                {isLTR ? "Arable Land" : "أرض صالحة للزراعة"}</h4>
                            <InfoRow label={isLTR ? `Vegetables (Open)` : `الخضروات (مفتوحة)`} value={`${farm.landUse?.arrableLand?.vegetablesOpen} m²`} />
                            <InfoRow label={isLTR ? `Fruit & Palm Trees (Open)` : `أشجار الفاكهة والنخيل (مفتوح)`} value={`${farm.landUse?.arrableLand?.fruitPalmTreesOpen} m²`} />
                            <InfoRow label={isLTR ? `Field Crops & Fodder` : 'المحاصيل الحقلية والأعلاف'} value={`${farm.landUse?.arrableLand?.fieldCropsFodder} m²`} />
                            <InfoRow label={isLTR ? `Left for Rest` : `غادر للراحة`} value={`${Math.round(farm.landUse?.arrableLand?.leftForRest)} m²`} />
                            <InfoRow label={isLTR ? `Nurseries` : `مشاتل`} value={`${farm.landUse?.arrableLand?.nurseries} m²`} />
                        </div>
                        <div>
                            <h4 className={`font-bold text-orange-700 mb-3 text-lg ${isLTR ? "text-start" : "text-start"}`}>
                                {isLTR ? "Non-Arable Land" : "الأراضي غير الصالحة للزراعة"}</h4>
                            <InfoRow label={isLTR ? `Buildings & Roads` : 'المباني والطرق'} value={`${farm.landUse?.nonArrableLand?.buildingsRoads} m²`} />
                            <InfoRow label={isLTR ? `Windbreaks` : `مصدات الرياح`} value={`${farm.landUse?.nonArrableLand?.windbreaks} m²`} />
                            <InfoRow label={isLTR ? `Barren Land` : `أرض قاحلة`} value={`${farm.landUse?.nonArrableLand?.barrenLand} m²`} />
                        </div>
                    </div>
                </InfoCard>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6 ">
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


                {/* Livestocks */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
                    <div className={`flex  ${isLTR ? "justify-start" : "justify-start"} items-center gap-3 mb-5`}>
                        <TreePine className="w-6 h-6 text-green-600" />
                        <h3 className={`text-xl font-bold text-gray-800 ${isLTR ? "text-left" : "text-right"}`}>{isLTR ? "LiveStocks" : "الأسهم الحية"}</h3>
                    </div>

                    {farm.livestocks && farm.livestocks.length > 0 && (
                        <div className="mb-6">
                           <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
                                {farm.livestocks.map((stock, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
                                        <h5 className="font-bold text-green-800 mb-2 text-lg" >{stockType(stock)}</h5>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold">{isLTR ? "Number Of Animals" : "عدد الحيوانات"}:</span> {stock.numberOfAnimals}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
                    <div className={`${isLTR ? "justify-start" : "justify-end"} flex items-center gap-3 mb-5`}>
                        <TreePine className="w-6 h-6 text-green-600" />
                        <h3 className="text-xl font-bold text-gray-800">{isLTR ? "Crops & Production" : "المحاصيل والإنتاج"}</h3>
                    </div>

                    {/* Fruits */}
                    {farm.crops?.fruits && farm.crops.fruits.length > 0 && (
                        <div className="mb-6">
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "flex justify-end"}`}>🌳 {isLTR ? "Fruit Trees" : "أشجار الفاكهة"}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
                                {farm.crops.fruits.map((fruit, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
                                        <h5 className="font-bold text-green-800 mb-2 text-lg" >{isLTR ?  fruitType(fruit) : fruitType(fruit)  } </h5>
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
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🥬 {isLTR ? "Vegetables" : "خضار"}</h4>
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
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🌾 {isLTR ? "Field Crops & Fodder" : "المحاصيل الحقلية والأعلاف"} </h4>
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
                            <h4 className={`font-bold text-green-700 mb-3 text-lg ${isLTR ? "text-start" : "text-end"}`}>🏠 {isLTR ? "Greenhouse Crops" : "محاصيل الدفيئة"}</h4>
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLTR ? "left-direction" : "right-direction"}`}>
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