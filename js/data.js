// NaijaHomes - Nigeria Premier Real Estate Data Store
// Real Real-Estate Listing Store (User-submitted listings)

const NAIJA_EXCHANGE_RATE = 1500; // ₦1,500 = $1 USD

// No mock, fake, demo, or placeholder properties. Real listings are posted by users.
const INITIAL_PROPERTIES = [];

// Helper to retrieve all real properties from user listings stored in localStorage
function getAllNaijaProperties() {
  const localListings = JSON.parse(localStorage.getItem("naijahomes_user_listings") || "[]");
  return localListings.map((p, idx) => {
    if (!p.lat || !p.lng) {
      return {
        ...p,
        lat: 6.4474 + ((idx + 1) * 0.008 * (idx % 2 === 0 ? 1 : -1)),
        lng: 3.4731 + ((idx + 1) * 0.006 * (idx % 3 === 0 ? 1 : -1))
      };
    }
    return p;
  });
}
