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

  // 5. Authentic Google Marker with Naira Price Badge
  function createPropertyMarker(p) {
    const compactPrice = formatCompactPrice(p.priceNgn);
    const purposeClass = p.purpose || "sale";

    const customIcon = L.divIcon({
      className: `nh-custom-pin ${purposeClass}`,
      html: `
        <div class="nh-custom-pin-pill">${compactPrice}</div>
        <svg width="28" height="36" viewBox="0 0 24 32">
          <path fill="${purposeClass === 'sale' ? '#EA4335' : (purposeClass === 'rent' ? '#1a73e8' : (purposeClass === 'shortlet' ? '#9333ea' : '#d97706'))}" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z"/>
          <circle fill="#FFFFFF" cx="12" cy="11" r="4.2"/>
          <path fill="${purposeClass === 'sale' ? '#EA4335' : (purposeClass === 'rent' ? '#1a73e8' : (purposeClass === 'shortlet' ? '#9333ea' : '#d97706'))}" d="M12 8.5L8.5 11.5v3h2.5v-2h2v2h2.5v-3L12 8.5z"/>
        </svg>
      `,
      iconSize: [56, 44],
      iconAnchor: [28, 44],
      popupAnchor: [0, -44]
    });

    const marker = L.marker([p.lat, p.lng], { icon: customIcon });

    // Google InfoWindow Popup
    const popupHtml = `
      <div class="nh-gmap-popup-card">
        <div class="nh-gmap-popup-img">
          <img src="${p.image}" alt="${p.title}">
          <span style="position: absolute; top: 8px; left: 8px; background: rgba(15,23,42,0.85); color: #fff; font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
            ${p.purpose === 'sale' ? 'FOR SALE' : (p.purpose === 'rent' ? 'FOR RENT' : (p.purpose === 'shortlet' ? 'SHORT LET' : 'LAND'))}
          </span>
          <span class="nh-doc-badge ${p.titleDocType || 'gov-consent'}" style="position: absolute; bottom: 8px; left: 8px; font-size: 0.68rem; padding: 2px 7px;">
            ✓ ${p.titleDoc}
          </span>
        </div>
        <div class="nh-gmap-popup-body">
          <div class="nh-gmap-popup-price" data-price-ngn="${p.priceNgn}" data-price-period="${p.pricePeriod || ''}">
            ${p.priceFormattedNgn}
          </div>
          <h4 class="nh-gmap-popup-title">${p.title}</h4>
          <p class="nh-gmap-popup-loc">📍 ${p.location}</p>
          <div class="nh-gmap-popup-actions">
            <button type="button" class="nh-gmap-popup-btn directions" onclick="window.nhOpenDirections('${p.id}');">
              🚗 Route
            </button>
            <button type="button" class="nh-gmap-popup-btn primary" onclick="window.nhOpenPlaceDetails('${p.id}');">
              Place Details &rarr;
            </button>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 300, closeButton: true });

    marker.on("click", () => {
      showPlaceDetails(p);
    });

    return marker;
  }

  // 6. Load & Render All Markers
  function renderAllMarkers() {
    markersGroup.clearLayers();
    propertyMarkers = {};

    const allProps = (typeof getAllNaijaProperties === "function") ? getAllNaijaProperties() : [];
    const filtered = allProps.filter(p => {
      const matchPurpose = (currentFilterPurpose === "all") || (p.purpose === currentFilterPurpose);
      return matchPurpose;
    });

    filtered.forEach(p => {
      if (p.lat && p.lng) {
        const marker = createPropertyMarker(p);
        markersGroup.addLayer(marker);
        propertyMarkers[p.id] = { marker, data: p };
      }
    });

    renderPlacesList(filtered);
  }

  // 7. Render Places List View (Side Panel Tab 1)
  function renderPlacesList(props) {
    const listEl = document.getElementById("gmapPlacesList");
    const countEl = document.getElementById("gmapPlacesCount");
    if (!listEl) return;

    listEl.innerHTML = "";
    if (countEl) countEl.textContent = `${props.length} places in Nigeria`;

    if (props.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 48px 16px; color: #5f6368;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📍</div>
          <div style="font-weight: 700; color: #202124; font-size: 1rem;">No properties found</div>
          <div style="font-size: 0.82rem; margin-top: 4px;">Try selecting another corridor or "All Nigeria".</div>
        </div>
      `;
      return;
    }

    props.forEach(p => {
      const item = document.createElement("div");
      item.className = `gmap-place-item ${activeProperty && activeProperty.id === p.id ? 'active' : ''}`;
      item.id = `place-item-${p.id}`;

      item.innerHTML = `
        <img class="gmap-place-thumb" src="${p.image}" alt="${p.title}">
        <div class="gmap-place-info">
          <div>
            <div class="gmap-place-price" data-price-ngn="${p.priceNgn}" data-price-period="${p.pricePeriod || ''}">
              ${p.priceFormattedNgn}
            </div>
            <h4 class="gmap-place-title">${p.title}</h4>
            <div class="gmap-place-rating">
              <span class="nh-doc-badge ${p.titleDocType || 'gov-consent'}" style="font-size: 0.65rem; padding: 1px 6px;">✓ ${p.titleDoc || 'Verified Title'}</span>
            </div>
            <div class="gmap-place-loc">📍 ${p.location}</div>
          </div>
          <div class="gmap-place-actions-row">
            <button type="button" class="gmap-place-btn-mini route" onclick="event.stopPropagation(); window.nhOpenDirections('${p.id}');">
              🚗 Route
            </button>
            <button type="button" class="gmap-place-btn-mini details" onclick="event.stopPropagation(); window.nhOpenPlaceDetails('${p.id}');">
              Details
            </button>
          </div>
        </div>
      `;

      item.addEventListener("click", () => {
        showPlaceDetails(p);
      });

      item.addEventListener("mouseenter", () => {
        const entry = propertyMarkers[p.id];
        if (entry && entry.marker) {
          const el = entry.marker.getElement();
          if (el) el.classList.add("selected");
        }
      });

      item.addEventListener("mouseleave", () => {
        const entry = propertyMarkers[p.id];
        if (entry && entry.marker && (!activeProperty || activeProperty.id !== p.id)) {
          const el = entry.marker.getElement();
          if (el) el.classList.remove("selected");
        }
      });

      listEl.appendChild(item);
    });
  }

  // 8. Show Place Details View (Side Panel Tab 2)
  function showPlaceDetails(p) {
    activeProperty = p;
    ensurePanelExpanded();
    switchSidePanelView("details");

    // Populate Place Details
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
      purposePill.textContent = p.purpose === 'sale' ? 'FOR SALE' : (p.purpose === 'rent' ? 'FOR RENT' : (p.purpose === 'shortlet' ? 'SHORT LET' : 'LAND PLOT'));
    }
    if (titleEl) titleEl.textContent = p.title;
    if (priceEl) {
      priceEl.textContent = p.priceFormattedNgn;
      priceEl.setAttribute("data-price-ngn", p.priceNgn);
      priceEl.setAttribute("data-price-period", p.pricePeriod || "");
    }
    if (addressEl) addressEl.textContent = p.location + (p.landmark ? ` (Near ${p.landmark})` : "");
    if (docBadge) docBadge.textContent = "✓ Verified " + p.titleDoc;

    if (specsEl) {
      specsEl.innerHTML = `
        ${p.bedrooms > 0 ? `<span class="gmap-spec-pill">🛏️ ${p.bedrooms} Bedrooms</span>` : ''}
        ${p.bathrooms > 0 ? `<span class="gmap-spec-pill">🚿 ${p.bathrooms} Bathrooms</span>` : ''}
        ${p.toilets > 0 ? `<span class="gmap-spec-pill">🚽 ${p.toilets} Toilets</span>` : ''}
        ${p.landSize ? `<span class="gmap-spec-pill">📐 ${p.landSize}</span>` : ''}
        <span class="gmap-spec-pill">⚡ 24/7 Power + Mikano Gen</span>
        <span class="gmap-spec-pill">🛡️ 24/7 Gated Security</span>
        <span class="gmap-spec-pill">📜 ${p.titleDoc}</span>
      `;
    }

    if (p.agent) {
      if (agentNameEl) agentNameEl.textContent = p.agent.name;
      if (agentPhoneEl) agentPhoneEl.textContent = p.agent.phone;
      if (agentLinkEl) agentLinkEl.href = `https://wa.me/${p.agent.whatsapp}?text=Hello%20${encodeURIComponent(p.agent.name)},%20I%20am%20interested%20in%20${encodeURIComponent(p.title)}%20on%20NaijaHomes.`;
    }

    if (fullDetailLink) fullDetailLink.href = `property-detail.html?id=${p.id}`;

    // Highlight marker on map & fly
    Object.keys(propertyMarkers).forEach(id => {
      const el = propertyMarkers[id].marker.getElement();
      if (el) el.classList.toggle("selected", id === p.id);
    });

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
        const allProps = (typeof getAllNaijaProperties === "function") ? getAllNaijaProperties() : [];
        if (allProps.length > 0) activeProperty = allProps[0];
      }
      if (activeProperty) {
        drawRoute(userLocation, activeProperty);
        startNavigation();
      }
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

  // 16. Search Autocomplete
  const searchInput = document.getElementById("hhGmapSearchInput");
  const searchDropdown = document.getElementById("hhGmapSearchDropdown");

  if (searchInput && searchDropdown) {
    const allProps = (typeof getAllNaijaProperties === "function") ? getAllNaijaProperties() : [];

    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        searchDropdown.style.display = "none";
        return;
      }

      const matches = allProps.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        (p.landmark && p.landmark.toLowerCase().includes(q))
      );

      if (matches.length === 0) {
        searchDropdown.innerHTML = `<div style="padding: 12px 16px; color: #5f6368; font-size: 0.85rem;">No matching properties or locations in Nigeria</div>`;
        searchDropdown.style.display = "block";
        return;
      }

      searchDropdown.innerHTML = matches.slice(0, 5).map(p => `
        <div class="nh-search-dropdown-item" data-id="${p.id}">
          <span style="font-size: 1.1rem;">📍</span>
          <div>
            <div style="font-weight: 700; color: #202124;">${p.title}</div>
            <div style="font-size: 0.75rem; color: #5f6368;">${p.location} • <strong style="color: #008751;">${p.priceFormattedNgn}</strong></div>
          </div>
        </div>
      `).join("");

      searchDropdown.style.display = "block";

      searchDropdown.querySelectorAll(".nh-search-dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
          const propId = item.getAttribute("data-id");
          const target = allProps.find(p => p.id === propId);
          if (target) {
            searchInput.value = target.title;
            searchDropdown.style.display = "none";
            showPlaceDetails(target);
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
    all: { name: "All Nigeria", center: [7.5000, 4.5000], zoom: 7 },
    lekki: { name: "Lekki Phase 1", center: [6.4474, 3.4731], zoom: 15 },
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
      const purposeKey = chip.getAttribute("data-purpose");

      if (corridorKey && CORRIDORS[corridorKey]) {
        currentCorridorKey = corridorKey;
        const c = CORRIDORS[corridorKey];
        if (corridorKey === "all") {
          if (markersGroup.getLayers().length > 0) {
            map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
          }
        } else {
          map.flyTo(c.center, c.zoom, { duration: 1.2 });
        }
      } else if (purposeKey) {
        currentFilterPurpose = purposeKey;
        renderAllMarkers();
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
  window.nhOpenPlaceDetails = function (propId) {
    const entry = propertyMarkers[propId];
    if (entry) showPlaceDetails(entry.data);
  };

  window.nhOpenDirections = function (propId) {
    const entry = propertyMarkers[propId];
    if (entry) showDirections(entry.data);
  };

  // 22. Initial Load & Render
  renderAllMarkers();

  // Check URL parameter (e.g., map.html?id=nh-002)
  const urlParams = new URLSearchParams(window.location.search);
  const paramPropId = urlParams.get("id");
  const allProps = (typeof getAllNaijaProperties === "function") ? getAllNaijaProperties() : [];

  if (paramPropId && propertyMarkers[paramPropId]) {
    showPlaceDetails(propertyMarkers[paramPropId].data);
  } else if (allProps.length > 0) {
    // Default show places list and focus bounds
    switchSidePanelView("places");
  }
});
