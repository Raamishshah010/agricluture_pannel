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
    loading: true,
    adminToken: sessionStorage.getItem('adminToken'),
    setCrops: (fruitTypes) => {
        set({ ...fruitTypes });
    },
    setLanguage: (lang) => {
        set({
            language: lang
        })
    },
    setLoading: (pay) => {
        set({
            loading: pay
        })
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
}));

export default useStore;
