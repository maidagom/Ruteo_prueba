const velocidad_KMH = 40;

function haversineKm(a, b) {
    const R = 6371; // Radio de la Tierra en km
    const rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

function trasladoMin(a, b) {
    return (haversineKm(a, b) / velocidad_KMH) * 60;
}

function hhmm(min) {
    const total = Math.round(min);
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
}

module.exports = { velocidad_KMH, haversineKm, trasladoMin, hhmm };