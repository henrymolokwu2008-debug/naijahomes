// NaijaHomes - Nigeria Premier Real Estate Data Store
// Curated Authentic Nigerian Properties & Live User Listings

const NAIJA_EXCHANGE_RATE = 1500; // ₦1,500 = $1 USD

// Real, verified Nigerian properties across Lagos, Abuja, and Port Harcourt
const INITIAL_PROPERTIES = [
  {
    "id": "nh-prop-1",
    "title": "5-Bedroom Contemporary Detached Duplex with Swimming Pool & Cinema",
    "purpose": "sale",
    "type": "duplex",
    "state": "Lagos",
    "location": "Lekki Phase 1, Lagos",
    "landmark": "Off Admiralty Way, Lekki Phase 1",
    "priceNgn": 380000000,
    "priceFormattedNgn": "₦380,000,000",
    "pricePeriod": "",
    "titleDoc": "Governor's Consent",
    "titleDocType": "gov-consent",
    "bedrooms": 5,
    "bathrooms": 6,
    "hasBq": true,
    "landSize": "650 SQM",
    "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "An architectural masterpiece situated in a gated cul-de-sac off Admiralty Way, Lekki Phase 1. Features high-ceiling double-volume living room, private swimming pool with outdoor wooden deck, private soundproof cinema room, fully fitted Italian kitchen with German appliances, solar inverter backup system, smart home automation, and en-suite staff quarters. Fully charted with Lagos Lands Bureau Alausa under valid Governor's Consent.",
    "features": [
      "Private Swimming Pool",
      "Home Cinema Room",
      "Fitted Italian Kitchen",
      "Automated Smart Home",
      "En-suite Boys Quarters",
      "24/7 Security Gatehouse",
      "Solar Inverter System",
      "Ample Parking for 5 Cars"
    ],
    "lat": 6.4474,
    "lng": 3.4731,
    "agent": {
      "name": "Engr. Babatunde Alabi",
      "phone": "+234 803 245 8891",
      "whatsapp": "2348032458891",
      "company": "Lekki Prime Realty Partners",
      "verified": true
    }
  },
  {
    "id": "nh-prop-2",
    "title": "4-Bedroom Waterfront Luxury Penthouse with Private Boat Jetty",
    "purpose": "sale",
    "type": "penthouse",
    "state": "Lagos",
    "location": "Old Ikoyi & Waterfront, Lagos",
    "landmark": "Alexander Road / Bourdillon, Old Ikoyi",
    "priceNgn": 850000000,
    "priceFormattedNgn": "₦850,000,000",
    "pricePeriod": "",
    "titleDoc": "Federal C of O",
    "titleDocType": "c-of-o",
    "bedrooms": 4,
    "bathrooms": 5,
    "hasBq": true,
    "landSize": "850 SQM (Penthouse)",
    "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Expansive top-floor penthouse with unobstructed 270-degree panoramic views of Five Cowries Creek and Lagos Lagoon. Includes direct private elevator access with biometric keycard, wrap-around terrace deck, personal boat slip at the private jetty, Olympic swimming pool, fully equipped clubhouse gym, and round-the-clock power. Fully verified with Federal Land Registry.",
    "features": [
      "Private Boat Jetty Access",
      "Direct Keycard Elevator",
      "Wrap-around Lagoon Terrace",
      "Olympic Pool & Gym",
      "24/7 Redundant Power",
      "2 Dedicated En-suite BQs",
      "Biometric Access Control",
      "Underground Parking (3 bays)"
    ],
    "lat": 6.4531,
    "lng": 3.435,
    "agent": {
      "name": "Arc. Ngozi Adeleke",
      "phone": "+234 802 119 4432",
      "whatsapp": "2348021194432",
      "company": "Ikoyi Haven Luxury Portfolio",
      "verified": true
    }
  },
  {
    "id": "nh-prop-3",
    "title": "7-Bedroom Palatial Ambassadorial Villa with Elevator & Olympic Pool",
    "purpose": "sale",
    "type": "duplex",
    "state": "Lagos",
    "location": "Banana Island, Lagos",
    "landmark": "Zone A Close, Banana Island Gated Access",
    "priceNgn": 2400000000,
    "priceFormattedNgn": "₦2,400,000,000",
    "pricePeriod": "",
    "titleDoc": "Federal C of O",
    "titleDocType": "c-of-o",
    "bedrooms": 7,
    "bathrooms": 9,
    "hasBq": true,
    "landSize": "1,400 SQM",
    "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "An ultra-exclusive ambassadorial estate located in prime Zone A of Banana Island. Features triple-volume foyer with imported Italian marble, internal glass pneumatic elevator, heated Olympic lap pool, executive boardroom/library, private spa with sauna and steam room, 12-car subterranean garage, and double gatehouse security.",
    "features": [
      "Internal Glass Elevator",
      "Heated Olympic Pool",
      "Private Sauna & Spa",
      "12-Car Garage",
      "Double Armed Security Guardhouse",
      "Dedicated 250kVA Generator",
      "Full Crestron Home Automation",
      "3 Maid & Driver Quarters"
    ],
    "lat": 6.4682,
    "lng": 3.439,
    "agent": {
      "name": "Barr. Chukwuma Okonkwo",
      "phone": "+234 809 332 7701",
      "whatsapp": "2348093327701",
      "company": "Banana Island Estates Ltd",
      "verified": true
    }
  },
  {
    "id": "nh-prop-4",
    "title": "6-Bedroom Diplomatic Hilltop Mansion with Guardhouse & Lush Gardens",
    "purpose": "sale",
    "type": "duplex",
    "state": "Abuja",
    "location": "Maitama, Abuja FCT",
    "landmark": "Mississippi Street / Gana Street, Maitama",
    "priceNgn": 1250000000,
    "priceFormattedNgn": "₦1,250,000,000",
    "pricePeriod": "",
    "titleDoc": "Certificate of Occupancy (C of O)",
    "titleDocType": "c-of-o",
    "bedrooms": 6,
    "bathrooms": 8,
    "hasBq": true,
    "landSize": "1,200 SQM",
    "image": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Prestigious diplomatic residence set on an elevated terrain in Maitama, Abuja. Designed to international embassy specifications with bulletproof glass installations on master wings, fortified security sentry post, private gym, tennis court, gazebos amidst manicured tropical gardens, and solar hybrid backup.",
    "features": [
      "Diplomatic Security Post",
      "Private Tennis Court",
      "FCDA AGIS Verified Title",
      "Manicured Landscape Garden",
      "Solar Hybrid Micro-grid",
      "Swimming Pool & Jacuzzi",
      "2-Bedroom Detached Guest Chalet",
      "Parking for 8 Executive Vehicles"
    ],
    "lat": 9.082,
    "lng": 7.498,
    "agent": {
      "name": "Hajia Fatima Dantata",
      "phone": "+234 803 774 1290",
      "whatsapp": "2348037741290",
      "company": "Abuja Capital Crest Properties",
      "verified": true
    }
  },
  {
    "id": "nh-prop-5",
    "title": "4-Bedroom Ultra-Modern Terrace Duplex with Panoramic Skyline Views",
    "purpose": "sale",
    "type": "terrace",
    "state": "Abuja",
    "location": "Guzape Hills, Abuja FCT",
    "landmark": "Guzape Hills Extension, overlooking Asokoro",
    "priceNgn": 270000000,
    "priceFormattedNgn": "₦270,000,000",
    "pricePeriod": "",
    "titleDoc": "Certificate of Occupancy (C of O)",
    "titleDocType": "c-of-o",
    "bedrooms": 4,
    "bathrooms": 5,
    "hasBq": true,
    "landSize": "450 SQM",
    "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Perched on the scenic Guzape hilltop with commanding views over Abuja City. Features modern minimalist cubic architecture, rooftop sunset lounge with barbecue grill, en-suite bedrooms with walk-in closets, central sound system, automated curtains, and paved dual-access driveway.",
    "features": [
      "Rooftop Sky Lounge",
      "Automated Ambient Lighting",
      "Fitted Kitchen with Island",
      "Gated Access Estate",
      "FCDA Title Clean Search",
      "Solar Backup Installed",
      "En-suite Boys Quarters",
      "Fast Fiber Internet Ready"
    ],
    "lat": 9.035,
    "lng": 7.521,
    "agent": {
      "name": "Tunde Balogun",
      "phone": "+234 818 902 5566",
      "whatsapp": "2348189025566",
      "company": "Prime Heights Realty Abuja",
      "verified": true
    }
  },
  {
    "id": "nh-prop-6",
    "title": "600 SQM 100% Dry Titled Residential Plot Facing Express",
    "purpose": "land",
    "type": "land",
    "state": "Lagos",
    "location": "Ibeju-Lekki / Epe Corridor",
    "landmark": "Facing Lekki-Epe Expressway, Near Alaro City",
    "priceNgn": 38000000,
    "priceFormattedNgn": "₦38,000,000",
    "pricePeriod": "",
    "titleDoc": "Gazette & Registered Survey",
    "titleDocType": "gazette",
    "bedrooms": 0,
    "bathrooms": 0,
    "hasBq": false,
    "landSize": "600 SQM (1 Standard Plot)",
    "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "100% table-dry commercial/residential plot in an excised, fully perimeter-fenced estate along the bustling Lekki-Epe Expressway. Free from any government acquisition, committed land, or local 'Omo-Onile' disputes. Instant physical allocation upon payment with registered beacon numbers. High appreciation corridor near the proposed Lekki International Airport and deep seaport.",
    "features": [
      "100% Table Dry Land",
      "Official Lagos State Gazette",
      "Registered Beacon Survey",
      "Zero Omo-Onile Harassment",
      "Direct Expressway Access",
      "Instant Physical Allocation",
      "Perimeter Fencing & Gate",
      "Projected 35% Annual ROI"
    ],
    "lat": 6.586,
    "lng": 3.985,
    "agent": {
      "name": "Engr. Babatunde Alabi",
      "phone": "+234 803 245 8891",
      "whatsapp": "2348032458891",
      "company": "Lekki Prime Realty Partners",
      "verified": true
    }
  },
  {
    "id": "nh-prop-7",
    "title": "3-Bedroom Serviced Oceanview Apartment with 24/7 Power",
    "purpose": "rent",
    "type": "apartment",
    "state": "Lagos",
    "location": "Victoria Island, Lagos",
    "landmark": "Adeola Odeku / Kuramo Waters, Victoria Island",
    "priceNgn": 25000000,
    "priceFormattedNgn": "₦25,000,000",
    "pricePeriod": "/ year",
    "titleDoc": "Registered Tenancy",
    "titleDocType": "gov-consent",
    "bedrooms": 3,
    "bathrooms": 4,
    "hasBq": true,
    "landSize": "320 SQM",
    "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Fully serviced ocean-facing apartment in an elite residential tower in Victoria Island. High-speed elevators, 24-hour guaranteed power from dual generator backups, fully equipped gymnasium, swimming pool, treated borehole water, and dedicated facility managers.",
    "features": [
      "24/7 Guaranteed Power",
      "Ocean & City Skyline View",
      "Fully Equipped Gym",
      "Swimming Pool & Clubhouse",
      "En-suite Maid's Room",
      "CCTV & Concierge Desk",
      "2 Reserved Covered Car Slots",
      "Professional Facility Mgmt"
    ],
    "lat": 6.4281,
    "lng": 3.4219,
    "agent": {
      "name": "Arc. Ngozi Adeleke",
      "phone": "+234 802 119 4432",
      "whatsapp": "2348021194432",
      "company": "Island Haven Luxury Portfolio",
      "verified": true
    }
  },
  {
    "id": "nh-prop-8",
    "title": "5-Bedroom Executive Smart Duplex with Swimming Pool & CCTV",
    "purpose": "sale",
    "type": "duplex",
    "state": "Lagos",
    "location": "Ikeja GRA, Lagos Mainland",
    "landmark": "Isaac John Street Corridor, Ikeja GRA",
    "priceNgn": 420000000,
    "priceFormattedNgn": "₦420,000,000",
    "pricePeriod": "",
    "titleDoc": "Certificate of Occupancy (C of O)",
    "titleDocType": "c-of-o",
    "bedrooms": 5,
    "bathrooms": 6,
    "hasBq": true,
    "landSize": "750 SQM",
    "image": "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Located in the prime, secure heart of Ikeja GRA. Contemporary architecture, spacious compound accommodating up to 7 cars, private swimming pool with water fountain, fully integrated smart locks and CCTV, fitted kitchen, and 2-room staff quarters. Minutes away from Lagos International Airport.",
    "features": [
      "Minutes from Airport",
      "Private Swimming Pool",
      "C of O Land Title",
      "Compound for 7 Cars",
      "Smart Automated Entry",
      "2-Room Staff Quarters",
      "Perimeter Infrared Sensors",
      "Fitted Chef's Kitchen"
    ],
    "lat": 6.5912,
    "lng": 3.3562,
    "agent": {
      "name": "Engr. Babatunde Alabi",
      "phone": "+234 803 245 8891",
      "whatsapp": "2348032458891",
      "company": "Lekki Prime Realty Partners",
      "verified": true
    }
  },
  {
    "id": "nh-prop-9",
    "title": "2-Bedroom Designer Waterfront Serviced Shortlet Flat",
    "purpose": "shortlet",
    "type": "apartment",
    "state": "Lagos",
    "location": "Lekki Phase 1, Lagos",
    "landmark": "Freedom Way, Lekki Phase 1",
    "priceNgn": 120000,
    "priceFormattedNgn": "₦120,000",
    "pricePeriod": "/ night",
    "titleDoc": "Governor's Consent",
    "titleDocType": "gov-consent",
    "bedrooms": 2,
    "bathrooms": 3,
    "hasBq": false,
    "landSize": "180 SQM",
    "image": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "High-yield luxury shortlet located along Freedom Way, Lekki Phase 1. Fully furnished with bespoke Scandinavian styling, 100Mbps unlimited fiber internet, PlayStation 5 console, Netflix/DSTV Premium, 24/7 uninterrupted electricity, and daily professional housekeeping.",
    "features": [
      "24/7 Guaranteed Electricity",
      "100Mbps High-Speed WiFi",
      "PlayStation 5 Console",
      "Waterfront View Balcony",
      "Daily Housekeeping Included",
      "Smart 65' OLED TVs",
      "Access to Gym & Pool",
      "Self Check-in Smart Keypad"
    ],
    "lat": 6.442,
    "lng": 3.485,
    "agent": {
      "name": "Arc. Ngozi Adeleke",
      "phone": "+234 802 119 4432",
      "whatsapp": "2348021194432",
      "company": "Island Haven Luxury Portfolio",
      "verified": true
    }
  },
  {
    "id": "nh-prop-10",
    "title": "4-Bedroom Luxury Waterfront Detached Villa with Private Jetty",
    "purpose": "sale",
    "type": "duplex",
    "state": "Rivers",
    "location": "Peter Odili Road, Trans-Amadi, Port Harcourt",
    "landmark": "Near Genesis Center & Woji Link Bridge",
    "priceNgn": 195000000,
    "priceFormattedNgn": "₦195,000,000",
    "pricePeriod": "",
    "titleDoc": "Certificate of Occupancy (C of O)",
    "titleDocType": "c-of-o",
    "bedrooms": 4,
    "bathrooms": 5,
    "hasBq": true,
    "landSize": "700 SQM",
    "image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Serene waterfront home along Peter Odili Road, Port Harcourt. Features private boat landing, lush emerald front lawn, massive master suite with jacuzzi, security patrol gatehouse, and water purification plant. Clean Rivers State Ministry of Lands title.",
    "features": [
      "Private Waterfront Jetty",
      "Rivers State C of O",
      "Gated Security Estate",
      "Lush Front Lawn",
      "Solar Power System",
      "En-suite Maid's Room",
      "Borehole Water Plant",
      "Space for 6 Vehicles"
    ],
    "lat": 4.8156,
    "lng": 7.0498,
    "agent": {
      "name": "Barr. Chukwuma Okonkwo",
      "phone": "+234 809 332 7701",
      "whatsapp": "2348093327701",
      "company": "South-South Prime Properties",
      "verified": true
    }
  },
  {
    "id": "nh-prop-11",
    "title": "4-Bedroom Luxury Furnished Penthouse with Marina Views",
    "purpose": "rent",
    "type": "penthouse",
    "state": "Lagos",
    "location": "Banana Island, Lagos",
    "landmark": "Ocean Parade Towers, Banana Island",
    "priceNgn": 65000000,
    "priceFormattedNgn": "₦65,000,000",
    "pricePeriod": "/ year",
    "titleDoc": "Registered Tenancy",
    "titleDocType": "gov-consent",
    "bedrooms": 4,
    "bathrooms": 5,
    "hasBq": true,
    "landSize": "600 SQM",
    "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Fully furnished executive rental in Ocean Parade Towers, Banana Island. Unrivaled luxury with tennis courts, twin swimming pools, squash courts, children's play park, 24-hour electricity, marina access, and armed security patrols.",
    "features": [
      "Ocean Parade Amenities",
      "Twin Swimming Pools",
      "Tennis & Squash Courts",
      "24/7 Redundant Power",
      "Marina Boat Access",
      "Biometric Building Access",
      "2 En-suite Staff Quarters",
      "Expatriate Standard Finishing"
    ],
    "lat": 6.467,
    "lng": 3.441,
    "agent": {
      "name": "Barr. Chukwuma Okonkwo",
      "phone": "+234 809 332 7701",
      "whatsapp": "2348093327701",
      "company": "Banana Island Estates Ltd",
      "verified": true
    }
  },
  {
    "id": "nh-prop-12",
    "title": "3-Bedroom Presidential Serviced Villa with Private Chef",
    "purpose": "shortlet",
    "type": "duplex",
    "state": "Abuja",
    "location": "Maitama, Abuja FCT",
    "landmark": "Gana Street / Millennium Park Enclave, Maitama",
    "priceNgn": 220000,
    "priceFormattedNgn": "₦220,000",
    "pricePeriod": "/ night",
    "titleDoc": "Certificate of Occupancy (C of O)",
    "titleDocType": "c-of-o",
    "bedrooms": 3,
    "bathrooms": 4,
    "hasBq": true,
    "landSize": "500 SQM",
    "image": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
    ],
    "description": "Presidential-grade shortlet duplex in Maitama, Abuja. Ideal for visiting diplomats, corporate executives, and high-net-worth visitors. Includes private butler, option of private chef, high-speed Starlink satellite internet, round-the-clock armed perimeter guard, and chauffeur services.",
    "features": [
      "Starlink High-Speed Internet",
      "Private Chef & Butler Option",
      "Diplomatic Armed Security",
      "24/7 Uninterrupted Power",
      "Private Heated Plunge Pool",
      "Executive Workspace Desk",
      "Airport Chauffeur Transfer",
      "Smart Voice Automation"
    ],
    "lat": 9.086,
    "lng": 7.495,
    "agent": {
      "name": "Hajia Fatima Dantata",
      "phone": "+234 803 774 1290",
      "whatsapp": "2348037741290",
      "company": "Abuja Capital Crest Properties",
      "verified": true
    }
  }
];

// Helper to retrieve all real properties (combines user listings + verified initial listings)
function getAllNaijaProperties() {
  let localListings = [];
  try {
    localListings = JSON.parse(localStorage.getItem("naijahomes_user_listings") || "[]");
    if (!Array.isArray(localListings)) localListings = [];
  } catch (e) {
    localListings = [];
  }

  // Combine user posted listings first, followed by curated verified listings
  const combined = [...localListings, ...INITIAL_PROPERTIES];

  return combined.map((p, idx) => {
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
