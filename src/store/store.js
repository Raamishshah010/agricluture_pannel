import { create } from 'zustand';

const useStore = create((set) => ({
    fruitTypes: [],
    vegetableTypes: [],
    fodderTypes: [],
    crops: [],
    greenHouseTypes: [],
    farmingSystems: [],
    coverTypes: [],
    waterSources: [],
    irrigationSystems: [],
    possessions: [],
    regions: [],
    emirates: [],
    centers: [],
    locations: [],
    farms: [],
    farmers: [],
    livestocks: [],
    language: 'en',
    dashboardLoading: {
        masterData: Boolean(sessionStorage.getItem('adminToken')),
        farms: Boolean(sessionStorage.getItem('adminToken')),
        farmers: Boolean(sessionStorage.getItem('adminToken')),
    },
    adminToken: sessionStorage.getItem('adminToken'),
    admin: (typeof window !== 'undefined' && sessionStorage.getItem('admin')) ? JSON.parse(sessionStorage.getItem('admin')) : null,
    setCrops: (fruitTypes) => {
        set({ ...fruitTypes });
    },
    setLanguage: (lang) => {
        set({
            language: lang
        })
    },
    setDashboardLoading: (section, value) => {
        set((state) => ({
            dashboardLoading: {
                ...state.dashboardLoading,
                [section]: value,
            },
        }))
    },
    setFarms: (farms) => {
        set({
            farms: farms
        })
    },
    setFarmers: (payload) => {
        set({
            farmers: payload
        })
    },
    setAdminToken: (token) => {
        set({
            adminToken: token
        })
    }
    ,
    setAdmin: (admin) => {
        if (typeof window !== 'undefined') {
            if (admin) sessionStorage.setItem('admin', JSON.stringify(admin));
            else sessionStorage.removeItem('admin');
        }
        set({ admin });
    }
}));

export default useStore;
