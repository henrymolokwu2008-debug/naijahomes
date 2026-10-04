/**
 * NaijaHomes - Authentic Google Maps Real Engine (google.com/maps)
 * Powered by Leaflet.js with official Google Maps tiles,
 * live traffic routes, collapsible side panel, and Nigerian luxury real estate pins.
 */

document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("realGMapDesk");
  if (!mapElement) return;

  // 1. Nigerian Coordinates Setup (Origin: Lekki-Ikoyi Link Bridge Gateway)
  const DEFAULT_ORIGIN = {
    lat: 6.4550,
    lng: 3.4480,
    title: "Your Location (Lekki-Ikoyi Link Bridge)"
  };

  let userLocation = { ...DEFAULT_ORIGIN };
  let activeProperty = null;
  let activeMode = "drive";
  let activeTileLayer = "streets";
  let isNavigating = false;
  let currentRouteLayers = [];
  let propertyMarkers = {};
  let currentFilterPurpose = "all";
  let currentCorridorKey = "all";

  // Transport Modes
  const MODE_DATA = {
    drive: { factor: 1.0, icon: "🚗", label: "Driving", speedKmH: 40 },
    transit: { factor: 2.2, icon: "🚌", label: "BRT Transit", speedKmH: 18 },
    walk: { factor: 5.5, icon: "🚶", label: "Walking", speedKmH: 5 },
    bike: { factor: 2.4, icon: "🚴", label: "Cycling", speedKmH: 15 },
    ride: { factor: 0.95, icon: "🚕", label: "Uber / Bolt", speedKmH: 42 }
  };

  // 2. Initialize Real Leaflet Map with Official Google Tiles
  const map = L.map("realGMapDesk", {
    center: [6.4500, 3.4600],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
  });

  // Official Google Maps Tile Layers
  const googleTileLayers = {
    streets: L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"]
    }),
    satellite: L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"]
    }),
    traffic: L.tileLayer("https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"]
    })
  };

  // Add default Google Streets tile layer
  googleTileLayers.streets.addTo(map);

  // Markers Layer Group
  const markersGroup = L.featureGroup().addTo(map);

  // 3. User Origin Pulsing GPS Marker
  const originIcon = L.divIcon({
    className: "nh-origin-gps-marker",
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="width: 22px; height: 22px; border-radius: 50%; background: #1a73e8; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(26,115,232,0.8);"></div>
        <div style="position: absolute; top: -6px; left: -6px; width: 34px; height: 34px; border-radius: 50%; background: rgba(26,115,232,0.25); animation: applePulse 2s infinite ease-out;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  const originMarker = L.marker([userLocation.lat, userLocation.lng], { icon: originIcon, zIndexOffset: 2000 }).addTo(map);
  originMarker.bindTooltip("You are here (Lekki-Ikoyi Link)", { direction: "top", permanent: false });

  // 4. Price Compact Formatter
  function formatCompactPrice(priceNgn) {
    if (priceNgn >= 1000000000) {
      return "₦" + (priceNgn / 1000000000).toFixed(1) + "B";
    } else if (priceNgn >= 1000000) {
      return "₦" + Math.round(priceNgn / 1000000) + "M";
    } else if (priceNgn >= 1000) {
      return "₦" + Math.round(priceNgn / 1000) + "K";
    }
    return "₦" + priceNgn.toLocaleString();
  }

  // 5. CAU Properties Limited - Proposed Residential Development Data
  const isPagesPath = window.location.pathname.includes('/pages/');
  const pathPrefix = isPagesPath ? "../" : "";

  const CAU_PROJECT = {
    id: "cau-lekki-phase-1",
    title: "Modern Residential Development, Lekki Phase 1",
    developer: "CAU Properties Limited",
    location: "No. 10 Ayo Jagun Street, Lekki Phase 1, Lagos",
    state: "Lagos State",
    landmark: "Ayo Jagun Street / Admiralty Way",
    lat: 6.4474,
    lng: 3.4731,
    status: "Proposed Residential Development",
    purpose: "development",
    priceNgn: 0,
    priceFormattedNgn: "CAU Properties Limited",
    image: pathPrefix + "images/cau-development/front-exterior-render.jpg",
    rearImage: pathPrefix + "images/cau-development/rear-exterior-render.jpg",
    floors: "5 Floors",
    parking: "27 Parking Spaces",
    landSize: "~885.399 m² Site (~85.87% Open Space)",
    titleDoc: "Proposed Residential Development",
    titleDocType: "c-of-o",
    agent: {
      name: "CAU Properties Limited",
      phone: "+234 803 245 8891",
      whatsapp: "2348032458891",
      email: "enquiries@cauproperties.ng"
    },
    projectUrl: pathPrefix + "cau-lekki.html",
    pdfUrl: pathPrefix + "docs/AYO_JAGUN_ARCHITECTURAL_DRAWING.pdf"
  };

  // 6. Create Premium Architectural Marker for CAU Development
  function createCauMarker(proj) {
    const customIcon = L.divIcon({
      className: "nh-custom-pin cau-flagship-pin",
      html: `
        <div class="nh-custom-pin-pill" style="background: linear-gradient(135deg, #c5a059 0%, #9a7837 100%); color: #000000; font-weight: 800; border: 1.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.35); font-size: 0.72rem; padding: 4px 10px; border-radius: 12px; white-space: nowrap;">
          ⭐ CAU Lekki Phase 1
        </div>
        <svg width="34" height="44" viewBox="0 0 24 32">
          <path fill="#c5a059" stroke="#ffffff" stroke-width="1.2" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z"/>
          <circle fill="#090e0c" cx="12" cy="11" r="5"/>
          <path fill="#fce7b0" d="M12 7.5L8 11.5h2.5v3h3v-3h2.5L12 7.5z"/>
        </svg>
      `,
      iconSize: [130, 52],
      iconAnchor: [65, 52],
      popupAnchor: [0, -52]
    });

    const marker = L.marker([proj.lat, proj.lng], { icon: customIcon, zIndexOffset: 1500 });

    const popupHtml = `
      <div class="nh-gmap-popup-card" style="width: 280px;">
        <div class="nh-gmap-popup-img" style="height: 140px; position: relative;">
          <img src="${proj.image}" alt="${proj.title}" style="width: 100%; height: 100%; object-fit: cover;">
          <span style="position: absolute; top: 8px; left: 8px; background: rgba(9,14,12,0.9); color: #fce7b0; font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; border: 1px solid rgba(197,160,89,0.5);">
            ⭐ Proposed Residential
          </span>
        </div>
        <div class="nh-gmap-popup-body" style="padding: 12px;">
          <div style="font-size: 0.75rem; font-weight: 800; color: #c5a059; text-transform: uppercase;">
            ${proj.developer}
          </div>
          <h4 class="nh-gmap-popup-title" style="margin: 3px 0 6px; font-size: 0.95rem;">
            ${proj.title}
          </h4>
          <p class="nh-gmap-popup-loc" style="font-size: 0.78rem; margin: 0 0 10px;">
            📍 ${proj.location}
          </p>
          <div class="nh-gmap-popup-actions" style="display: flex; gap: 6px;">
            <button type="button" class="nh-gmap-popup-btn directions" style="flex: 1;" onclick="window.nhOpenDirections('cau-lekki-phase-1');">
              🚗 Route
            </button>
            <a href="${proj.projectUrl}" class="nh-gmap-popup-btn primary" style="flex: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center;">
              Explore &rarr;
            </a>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 300, closeButton: true });

    marker.on("click", () => {
      showPlaceDetails(proj);
    });

    return marker;
  }

  // 7. Load & Render CAU Development Marker
  function renderAllMarkers() {
    markersGroup.clearLayers();
    propertyMarkers = {};

    const marker = createCauMarker(CAU_PROJECT);
    markersGroup.addLayer(marker);
    propertyMarkers[CAU_PROJECT.id] = { marker, data: CAU_PROJECT };
  }

  // 8. Show Place Details View (Side Panel Tab 2)
  function showPlaceDetails(p) {
    if (!p) p = CAU_PROJECT;
    activeProperty = p;
    ensurePanelExpanded();
    switchSidePanelView("details");

    const heroImg = document.getElementById("gmapPlaceHeroImg");
    const purposePill = document.getElementById("gmapPlacePurposePill");
    const titleEl = document.getElementById("gmapPlaceTitle");
    const priceEl = document.getElementById("gmapPlacePrice");
    const addressEl = document.getElementById("gmapPlaceAddress");
    const docBadge = document.getElementById("gmapPlaceDocBadge");
    const specsEl = document.getElementById("gmapPlaceSpecsPills");
    const agentNameEl = document.getElementById("gmapPlaceAgentName");
    const agentPhoneEl = document.getElementById("gmapPlaceAgentPhone");
    const agentLinkEl = document.getElementById("gmapPlaceAgentLink");
    const fullDetailLink = document.getElementById("gmapPlaceFullDetailLink");

    if (heroImg) heroImg.src = p.image;
    if (purposePill) {
      purposePill.textContent = "PROPOSED RESIDENTIAL DEVELOPMENT";
      purposePill.style.background = "#c5a059";
      purposePill.style.color = "#000000";
    }
    if (titleEl) titleEl.textContent = p.title;
    if (priceEl) {
      priceEl.textContent = p.developer || "CAU Properties Limited";
      priceEl.style.color = "#c5a059";
      priceEl.style.fontSize = "1.05rem";
      priceEl.style.letterSpacing = "0.02em";
    }
    if (addressEl) addressEl.textContent = p.location;
    if (docBadge) docBadge.textContent = "✓ Proposed Residential Development";

    if (specsEl) {
      specsEl.innerHTML = `
        <span class="gmap-spec-pill">🏢 5 Floors</span>
        <span class="gmap-spec-pill">🚗 27 Parking Spaces</span>
        <span class="gmap-spec-pill">🏊 Swimming Pool (Lap Pool)</span>
        <span class="gmap-spec-pill">🏋️ Private Glazed Gym</span>
        <span class="gmap-spec-pill">🌅 Balconies &amp; Terraces</span>
        <span class="gmap-spec-pill">🌿 ~85.87% Unbuilt Landscaped Space</span>
        <span class="gmap-spec-pill">📐 ~885.399 m² Site Area</span>
        <span class="gmap-spec-pill">🏛️ Contemporary Architecture</span>
      `;
    }

    if (p.agent) {
      if (agentNameEl) agentNameEl.textContent = p.agent.name;
      if (agentPhoneEl) agentPhoneEl.textContent = p.agent.phone;
      if (agentLinkEl) agentLinkEl.href = `https://wa.me/${p.agent.whatsapp}?text=Hello%20CAU%20Properties,%20I%20am%20inquiring%20about%20the%20Modern%20Residential%20Development%20at%20No.%2010%20Ayo%20Jagun%20Street,%20Lekki%20Phase%201.`;
    }

    if (fullDetailLink) {
      fullDetailLink.href = p.projectUrl || "cau-lekki.html";
      fullDetailLink.innerHTML = "Open Project Presentation & Architectural Plans &rarr;";
    }

    // Highlight marker on map & fly
    if (propertyMarkers[p.id] && propertyMarkers[p.id].marker) {
      const el = propertyMarkers[p.id].marker.getElement();
      if (el) el.classList.add("selected");
    }

    map.flyTo([p.lat, p.lng], 16, { duration: 0.8 });
  }

  // 9. Show Directions View (Side Panel Tab 3)
  function showDirections(destination) {
    if (!destination) return;
    activeProperty = destination;
    ensurePanelExpanded();
    switchSidePanelView("directions");

    const originInput = document.getElementById("gmapDirOriginInput");
    const destInput = document.getElementById("gmapDirDestInput");
    if (originInput) originInput.value = userLocation.title || "Your Location (Lekki-Ikoyi Link)";
    if (destInput) destInput.value = destination.title;

    drawRoute(userLocation, destination);
  }

  // 10. Switch Side Panel Views ('places' | 'details' | 'directions')
  function switchSidePanelView(viewName) {
    const viewPlaces = document.getElementById("gmapViewPlaces");
    const viewDetails = document.getElementById("gmapViewDetails");
    const viewDirections = document.getElementById("gmapViewDirections");

    if (viewPlaces) viewPlaces.classList.toggle("hidden", viewName !== "places");
    if (viewDetails) viewDetails.classList.toggle("hidden", viewName !== "details");
    if (viewDirections) viewDirections.classList.toggle("hidden", viewName !== "directions");
  }

  // Back Button Handlers in Side Panel
  const btnBackFromDetails = document.getElementById("btnBackFromDetails");
  if (btnBackFromDetails) {
    btnBackFromDetails.addEventListener("click", () => {
      switchSidePanelView("places");
      if (markersGroup.getLayers().length > 0) {
        map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
      }
    });
  }

  const btnBackFromDirections = document.getElementById("btnBackFromDirections");
  if (btnBackFromDirections) {
    btnBackFromDirections.addEventListener("click", () => {
      if (activeProperty) {
        showPlaceDetails(activeProperty);
      } else {
        switchSidePanelView("places");
      }
      clearRoute();
    });
  }

  // 11. Panel Toggle (Collapse / Expand Handle)
  const sidePanel = document.getElementById("gmapSidePanel");
  const toggleTab = document.getElementById("gmapPanelToggleTab");

  function ensurePanelExpanded() {
    if (sidePanel && sidePanel.classList.contains("collapsed")) {
      sidePanel.classList.remove("collapsed");
      if (toggleTab) {
        toggleTab.classList.remove("collapsed");
        toggleTab.textContent = "◀";
        toggleTab.title = "Collapse Side Panel";
      }
      setTimeout(() => map.invalidateSize(), 300);
    }
  }

  if (toggleTab && sidePanel) {
    toggleTab.addEventListener("click", () => {
      sidePanel.classList.toggle("collapsed");
      const isCollapsed = sidePanel.classList.contains("collapsed");
      toggleTab.classList.toggle("collapsed", isCollapsed);
      toggleTab.textContent = isCollapsed ? "▶" : "◀";
      toggleTab.title = isCollapsed ? "Expand Side Panel" : "Collapse Side Panel";
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  // 12. Calculate Route Waypoints with Realistic Curvature
  function generateRouteCoordinates(origin, destination) {
    const lat1 = origin.lat, lng1 = origin.lng;
    const lat2 = destination.lat, lng2 = destination.lng;

    // Cross-state Lagos to Abuja
    const isAbuja = destination.lat > 8.0;
    if (isAbuja && origin.lat < 8.0) {
      return [
        [lat1, lng1],
        [6.5500, 3.4000],
        [6.8300, 3.6500],
        [7.2500, 5.2000],
        [7.8000, 6.7400],
        [8.4500, 7.1500],
        [lat2, lng2]
      ];
    }

    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;

    const step1 = [lat1 + (lat2 - lat1) * 0.25 + 0.002, lng1 + (lng2 - lng1) * 0.25 - 0.001];
    const step2 = [midLat + 0.003, midLng + 0.002];
    const step3 = [lat1 + (lat2 - lat1) * 0.75 - 0.001, lng1 + (lng2 - lng1) * 0.75 + 0.002];

    return [
      [lat1, lng1],
      step1,
      step2,
      step3,
      [lat2, lng2]
    ];
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;
    return {
      km: Math.max(1.2, distKm * 1.3),
      miles: Math.max(0.8, (distKm * 1.3) * 0.621371)
    };
  }

  // 13. Draw Multi-Segment Google Live Route
  function drawRoute(origin, destination) {
    clearRoute();

    const waypoints = generateRouteCoordinates(origin, destination);
    const distInfo = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const mode = MODE_DATA[activeMode] || MODE_DATA.drive;

    let totalMin = Math.round((distInfo.km / mode.speedKmH) * 60);
    totalMin = Math.max(4, Math.round(totalMin * mode.factor));

    const now = new Date();
    now.setMinutes(now.getMinutes() + totalMin);
    const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Blue Underlay Glow
    const glowRoute = L.polyline(waypoints, {
      color: "#1a73e8",
      weight: 12,
      opacity: 0.35,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);
    currentRouteLayers.push(glowRoute);

    // Multi-color Google traffic polyline
    const n = waypoints.length;
    const segGreen = L.polyline([waypoints[0], waypoints[1], waypoints[2]], {
      color: "#34A853",
      weight: 7,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);
    currentRouteLayers.push(segGreen);

    const segOrange = L.polyline([waypoints[2], waypoints[3]], {
      color: "#FBBC05",
      weight: 7,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);
    currentRouteLayers.push(segOrange);

    const segFinal = L.polyline([waypoints[3], waypoints[n - 1]], {
      color: "#4285F4",
      weight: 7,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);
    currentRouteLayers.push(segFinal);

    // Update Directions Card
    const dirTime = document.getElementById("gmapDirRouteTime");
    const dirDist = document.getElementById("gmapDirRouteDist");
    const dirCorridor = document.getElementById("gmapDirRouteCorridor");

    if (dirTime) dirTime.textContent = `${totalMin} min`;
    if (dirDist) dirDist.textContent = `${distInfo.miles.toFixed(1)} mi • ${distInfo.km.toFixed(1)} km`;
    if (dirCorridor) dirCorridor.textContent = `via ${destination.landmark || destination.location}`;

    // Update Turn-by-Turn Navigation HUD
    const hudDist = document.getElementById("hudDistDesk");
    const hudStreet = document.getElementById("hudStreetDesk");
    const hudEtaBig = document.getElementById("hudEtaBigDesk");
    const hudEtaSub = document.getElementById("hudEtaSubDesk");

    if (hudDist) hudDist.textContent = "In 250 m";
    if (hudStreet) hudStreet.textContent = `Turn right toward ${destination.location.split(',')[0]}`;
    if (hudEtaBig) hudEtaBig.textContent = `${totalMin} min`;
    if (hudEtaSub) hudEtaSub.textContent = `${distInfo.miles.toFixed(1)} mi • ETA ${arrivalTime}`;

    // Fit map bounds to route nicely
    map.fitBounds(L.latLngBounds(waypoints), {
      paddingTopLeft: [420, 40],
      paddingBottomRight: [40, 40],
      maxZoom: 16
    });

    return { totalMin, distInfo, arrivalTime };
  }

  function clearRoute() {
    currentRouteLayers.forEach(layer => map.removeLayer(layer));
    currentRouteLayers = [];
  }

  // 14. Turn-by-Turn Navigation HUD
  const navHud = document.getElementById("gmapNavHudDesk");
  const btnStartNav = document.getElementById("btnStartNavDesk");
  const btnExitNav = document.getElementById("btnExitNavDesk");

  function startNavigation() {
    isNavigating = true;
    if (navHud) {
      navHud.style.display = "flex";
      navHud.style.animation = "gmapSlideDown 0.3s ease forwards";
    }
    if (typeof showNaijaToast === "function") {
      showNaijaToast("Google Navigation Active • Turn-by-Turn GPS Guided", "🚗");
    }
  }

  function exitNavigation() {
    isNavigating = false;
    if (navHud) navHud.style.display = "none";
  }

  if (btnStartNav) {
    btnStartNav.addEventListener("click", () => {
      if (!activeProperty) {
        activeProperty = CAU_PROJECT;
      }
      drawRoute(userLocation, activeProperty);
      startNavigation();
    });
  }

  if (btnExitNav) {
    btnExitNav.addEventListener("click", exitNavigation);
  }

  // 15. Transport Mode Tabs in Directions View
  document.querySelectorAll(".gmap-mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".gmap-mode-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeMode = tab.getAttribute("data-mode") || "drive";
      if (activeProperty) {
        drawRoute(userLocation, activeProperty);
      }
    });
  });

  // 16. Search Autocomplete (Nigerian Locations & CAU Development)
  const searchInput = document.getElementById("hhGmapSearchInput");
  const searchDropdown = document.getElementById("hhGmapSearchDropdown");

  const NIGERIAN_LOCATIONS = [
    { title: "Modern Residential Development, Lekki Phase 1", loc: "No. 10 Ayo Jagun Street, Lekki Phase 1, Lagos", lat: 6.4474, lng: 3.4731, isCau: true },
    { title: "CAU Properties Limited", loc: "No. 10 Ayo Jagun Street, Lekki Phase 1", lat: 6.4474, lng: 3.4731, isCau: true },
    { title: "Ayo Jagun Street, Lekki Phase 1", loc: "Lekki Phase 1, Eti-Osa LGA, Lagos", lat: 6.4474, lng: 3.4731, isCau: true },
    { title: "Admiralty Way, Lekki Phase 1", loc: "Lekki Phase 1, Lagos", lat: 6.4500, lng: 3.4700 },
    { title: "Lekki-Ikoyi Link Bridge", loc: "Lekki / Ikoyi Corridor, Lagos", lat: 6.4550, lng: 3.4480 },
    { title: "Old Ikoyi Waterfront", loc: "Ikoyi, Lagos", lat: 6.4532, lng: 3.4348 },
    { title: "Banana Island", loc: "Ikoyi, Lagos", lat: 6.4638, lng: 3.4472 },
    { title: "Victoria Island (VI)", loc: "Lagos State", lat: 6.4253, lng: 3.4195 },
    { title: "Ikeja GRA", loc: "Lagos Mainland", lat: 6.5924, lng: 3.3551 },
    { title: "Maitama District", loc: "Abuja FCT", lat: 9.0882, lng: 7.4934 },
    { title: "Guzape Hills", loc: "Abuja FCT", lat: 9.0350, lng: 7.5180 },
    { title: "Ibeju-Lekki Express Corridor", loc: "Lagos State", lat: 6.4715, lng: 3.8741 }
  ];

  if (searchInput && searchDropdown) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        searchDropdown.style.display = "none";
        return;
      }

      const matches = NIGERIAN_LOCATIONS.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.loc.toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        searchDropdown.innerHTML = `<div style="padding: 12px 16px; color: #5f6368; font-size: 0.85rem;">No matching locations found</div>`;
        searchDropdown.style.display = "block";
        return;
      }

      searchDropdown.innerHTML = matches.slice(0, 6).map((item, idx) => `
        <div class="nh-search-dropdown-item" data-idx="${idx}">
          <span style="font-size: 1.1rem;">📍</span>
          <div>
            <div style="font-weight: 700; color: #202124;">${item.title}</div>
            <div style="font-size: 0.75rem; color: #5f6368;">${item.loc}</div>
          </div>
        </div>
      `).join("");

      searchDropdown.style.display = "block";

      searchDropdown.querySelectorAll(".nh-search-dropdown-item").forEach(el => {
        el.addEventListener("click", () => {
          const idx = parseInt(el.getAttribute("data-idx"), 10);
          const target = matches[idx];
          if (target) {
            searchInput.value = target.title;
            searchDropdown.style.display = "none";
            if (target.isCau) {
              map.flyTo([target.lat, target.lng], 16, { duration: 1.0 });
              showPlaceDetails(CAU_PROJECT);
            } else {
              map.flyTo([target.lat, target.lng], 15, { duration: 1.0 });
            }
          }
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.style.display = "none";
      }
    });
  }

  // 17. Corridor Quick Filter Chips
  const CORRIDORS = {
    all: { name: "All Nigeria", center: [6.4474, 3.4731], zoom: 14 },
    cau: { name: "CAU Lekki Phase 1", center: [6.4474, 3.4731], zoom: 16, isCau: true },
    lekki: { name: "Lekki Phase 1", center: [6.4474, 3.4731], zoom: 15, isCau: true },
    ikoyi: { name: "Old Ikoyi", center: [6.4532, 3.4348], zoom: 15 },
    banana: { name: "Banana Island", center: [6.4638, 3.4472], zoom: 15 },
    vi: { name: "Victoria Island", center: [6.4253, 3.4195], zoom: 15 },
    ikeja: { name: "Ikeja GRA", center: [6.5924, 3.3551], zoom: 15 },
    abuja: { name: "Abuja FCT", center: [9.0600, 7.5000], zoom: 13 },
    ibeju: { name: "Ibeju-Lekki & Epe", center: [6.4715, 3.8741], zoom: 14 }
  };

  document.querySelectorAll(".gmap-floating-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".gmap-floating-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      const corridorKey = chip.getAttribute("data-corridor");

      if (corridorKey && CORRIDORS[corridorKey]) {
        currentCorridorKey = corridorKey;
        const c = CORRIDORS[corridorKey];
        map.flyTo(c.center, c.zoom, { duration: 1.2 });
        if (c.isCau) {
          showPlaceDetails(CAU_PROJECT);
        }
      }
    });
  });

  // 18. On-Map Controls: Layers Switcher (Bottom-Left)
  const layersWidget = document.getElementById("gmapLayersWidget");
  const layersThumb = document.getElementById("gmapLayersThumb");
  const layersLabel = document.getElementById("gmapLayersLabel");

  if (layersWidget) {
    layersWidget.addEventListener("click", () => {
      if (activeTileLayer === "streets") {
        map.removeLayer(googleTileLayers.streets);
        googleTileLayers.satellite.addTo(map);
        activeTileLayer = "satellite";
        if (layersLabel) layersLabel.textContent = "Map";
        if (layersThumb) layersThumb.style.backgroundImage = "url('https://mt1.google.com/vt/lyrs=m&x=1&y=1&z=1')";
        if (typeof showNaijaToast === "function") showNaijaToast("Switched to Google Satellite Imagery", "🛰️");
      } else {
        map.removeLayer(googleTileLayers.satellite);
        googleTileLayers.streets.addTo(map);
        activeTileLayer = "streets";
        if (layersLabel) layersLabel.textContent = "Satellite";
        if (layersThumb) layersThumb.style.backgroundImage = "url('https://mt1.google.com/vt/lyrs=y&x=1&y=1&z=1')";
        if (typeof showNaijaToast === "function") showNaijaToast("Switched to Google Streets Map", "🗺️");
      }
    });
  }

  // 19. On-Map Controls: Zoom, Locate Me, Pegman (Bottom-Right)
  const btnZoomIn = document.getElementById("btnZoomInDesk");
  const btnZoomOut = document.getElementById("btnZoomOutDesk");
  const btnLocateMe = document.getElementById("btnLocateMeDesk");
  const btnPegman = document.getElementById("btnPegmanDesk");

  if (btnZoomIn) btnZoomIn.addEventListener("click", () => map.zoomIn());
  if (btnZoomOut) btnZoomOut.addEventListener("click", () => map.zoomOut());

  if (btnLocateMe) {
    btnLocateMe.addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, title: "Your Exact GPS Location" };
            originMarker.setLatLng([userLocation.lat, userLocation.lng]);
            map.flyTo([userLocation.lat, userLocation.lng], 16);
            if (activeProperty) drawRoute(userLocation, activeProperty);
            if (typeof showNaijaToast === "function") showNaijaToast("Located your GPS position!", "📍");
          },
          () => {
            map.flyTo([DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng], 15);
            if (typeof showNaijaToast === "function") showNaijaToast("Centered on Lekki-Ikoyi Link Bridge", "📍");
          }
        );
      } else {
        map.flyTo([DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng], 15);
      }
    });
  }

  if (btnPegman) {
    btnPegman.addEventListener("click", () => {
      if (typeof showNaijaToast === "function") {
        showNaijaToast("Google Street View: Coverage available along Admiralty Way & Ozumba Mbadiwe", "🧍");
      }
    });
  }

  // 20. Swap Waypoints Button
  const btnSwap = document.getElementById("btnSwapWaypointsDesk");
  if (btnSwap) {
    btnSwap.addEventListener("click", () => {
      if (!activeProperty) return;
      const temp = { ...userLocation };
      userLocation = { lat: activeProperty.lat, lng: activeProperty.lng, title: activeProperty.title };
      originMarker.setLatLng([userLocation.lat, userLocation.lng]);
      const destInput = document.getElementById("gmapDirDestInput");
      const originInput = document.getElementById("gmapDirOriginInput");
      if (originInput) originInput.value = userLocation.title;
      if (destInput) destInput.value = temp.title;
      drawRoute(userLocation, temp);
      if (typeof showNaijaToast === "function") showNaijaToast("Directions origin & destination swapped", "⇅");
    });
  }

  // 21. Action buttons on Place Details
  const btnActionDirections = document.getElementById("btnActionDirections");
  if (btnActionDirections) {
    btnActionDirections.addEventListener("click", () => {
      if (activeProperty) showDirections(activeProperty);
    });
  }

  const btnActionInspect = document.getElementById("btnActionInspect");
  if (btnActionInspect) {
    btnActionInspect.addEventListener("click", () => {
      if (activeProperty && typeof openInspectionModal === "function") {
        openInspectionModal(activeProperty.title);
      }
    });
  }

  const btnActionSave = document.getElementById("btnActionSave");
  if (btnActionSave) {
    btnActionSave.addEventListener("click", () => {
      if (activeProperty && typeof toggleSaveProperty === "function") {
        const isSaved = toggleSaveProperty(activeProperty.id);
        if (typeof showNaijaToast === "function") {
          showNaijaToast(isSaved ? "Saved to your shortlisted Nigerian homes" : "Removed from saved homes", isSaved ? "❤️" : "🤍");
        }
      }
    });
  }

  const btnActionShare = document.getElementById("btnActionShare");
  if (btnActionShare) {
    btnActionShare.addEventListener("click", () => {
      if (activeProperty) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${activeProperty.id}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            if (typeof showNaijaToast === "function") showNaijaToast("Google Maps link copied to clipboard!", "🔗");
          });
        }
      }
    });
  }

  // Global window helpers for in-popup clicks
  // Global window helpers for in-popup clicks
  window.nhOpenPlaceDetails = function (propId) {
    showPlaceDetails(CAU_PROJECT);
  };

  window.nhOpenDirections = function (propId) {
    showDirections(CAU_PROJECT);
  };

  // 22. Initial Load & Render
  renderAllMarkers();

  // Initial view focuses on CAU Development in Lekki Phase 1
  map.setView([CAU_PROJECT.lat, CAU_PROJECT.lng], 15);
  showPlaceDetails(CAU_PROJECT);
});
