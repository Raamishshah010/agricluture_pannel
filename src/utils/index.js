// export const API_BASE_URL = 'http://localhost:5000';
export const API_BASE_URL = 'http://3.28.62.38';


export function generateOTP(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
}
export function formatNumberWithUnits(num) {
    if (num === null || num === undefined) return '';
    console.log(num, typeof num);
    

    const units = ["", "K", "M", "B", "T", "Q"];
    let unitIndex = 0;

    while (Math.abs(num) >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
    }

    return num.toFixed(1).replace(/\.0$/, "") + units[unitIndex];
}

function isPointInPolygon(point, polygon) {
    let x = point.lat, y = point.lng;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].lat, yi = polygon[i].lng;
        let xj = polygon[j].lat, yj = polygon[j].lng;
        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function isPolygonInsidePolygon(innerPolygon, outerPolygon) {
    for (let i = 0; i < innerPolygon.length; i++) {
        if (!isPointInPolygon(innerPolygon[i], outerPolygon)) {
            return false;
        }
    }

    for (let i = 0; i < innerPolygon.length; i++) {
        let p1 = innerPolygon[i];
        let p2 = innerPolygon[(i + 1) % innerPolygon.length];

        for (let j = 0; j < outerPolygon.length; j++) {
            let p3 = outerPolygon[j];
            let p4 = outerPolygon[(j + 1) % outerPolygon.length];

            if (doSegmentsIntersect(p1, p2, p3, p4)) {
                return false;
            }
        }
    }

    return true;
}

function pointInPolygon(point, polygon) {
    let x = point.lng, y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;

        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }
    return inside;
}

function polygonsOverlap(poly1, poly2) {
    for (let p of poly1) {
        if (pointInPolygon(p, poly2)) return true;
    }
    for (let p of poly2) {
        if (pointInPolygon(p, poly1)) return true;
    }
    return false;
}

export function anyPolygonsOverlap(polygons) {
    for (let i = 0; i < polygons.length; i++) {
        for (let j = i + 1; j < polygons.length; j++) {
            if (polygonsOverlap(polygons[i], polygons[j])) {
                return true;
            }
        }
    }
    return false;
}


function doSegmentsIntersect(p1, p2, p3, p4) {
    const ccw = (A, B, C) => {
        return (C.lng - A.lng) * (B.lat - A.lat) > (B.lng - A.lng) * (C.lat - A.lat);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

export function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
}

export const errorMessages = {
    farmName: 'Farm Name is required',
    accountNo: 'Account Number is required',
    farmSerial: "Farm Serial",
    farmNo: 'Farm Number is required',
    agricultureId: 'Agriculture Id is required',
    phoneNumber: 'Phone Number is required',
    emiratesID: 'Emirates ID is required',
    notes: 'Notes is required',
    emirate: 'Emirate is required',
    serviceCenter: 'Center is required',
    owner: 'Owner is required',
    holder: 'Holder is required',
    location: 'Location is required',
    mapData: "Farm Area (Polygon) is required",
    coordinates: "Coordinates is required",

    totalArea: "Total Area is required",
    noOfWorkers: "Numbers of Workers is required",
    numberOfProductionWells: "Production Wells is required",
    desalinationUnits: "Desalination Units is required",
    waterSources: "Water Sources is required",
    irrigationSystem: "Irrigation System is required",
    farmingSystem: "Farming System is required",
    possessionStyle: "Possession Style is required",
    numberOfDestinationMachines: "Number Of Destination Units is required",

    landUse: {
        arrableLand: {
            vegetablesOpen: "Open Vegetables Area is required",
            fruitPalmTreesOpen: "Fuit Palm Trees Open Area is required",
            fieldCropsFodder: "Field Crops Fodder Area is required",
            leftForRest: "Left For Rest Area is required",
            ornamentalTrees: "Ornamental Trees Area is required",
            nurseries: "Nurseries Area"
        },
        nonArrableLand: {
            buildingsRoads: "Building Roads Area is required",
            windbreaks: "Wind Breaks is required",
            barrenLand: "Barren Land is required"
        }
    }
};
