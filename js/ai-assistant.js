/**
 * NaijaHomes - AI Real Estate Assistant & Natural Language Property Matcher ("Ariya AI")
 * Intelligent conversational agent specialized in Nigerian luxury real estate,
 * title verification, corridor insights, and live natural-language property discovery.
 */

(function () {
  "use strict";

  // Check if running in subfolder (/pages/) or root (/)
  const isSubfolder = window.location.pathname.includes("/pages/");
  const pathPrefix = isSubfolder ? "../" : "";

  // 1. Knowledge Base for Real Estate & Platform Q&A
  const REAL_ESTATE_KB = [
    {
      keywords: ["what is c of o", "c of o", "certificate of occupancy", "governor's consent", "title document", "land title", "gazette", "excision", "deed of assignment", "alausa", "agis", "title verification"],
      response: `
        <strong>📜 Nigerian Land Title Documents Guide:</strong><br><br>
        • <strong>Governor's Consent:</strong> The legal approval signed by the State Governor (e.g., Lagos Lands Bureau, Alausa) validating transfer of ownership. It is the gold standard for developed properties.<br>
        • <strong>Certificate of Occupancy (C of O):</strong> Granted directly by the government for 99 years. Guarantees state recognition.<br>
        • <strong>Gazette & Excision:</strong> Official government gazette designating ancestral land excised to private ownership. 100% safe for acquisition.<br>
        • <strong>Verification Process:</strong> Every home on NaijaHomes is charted at Alausa (Lagos) or AGIS (Abuja) prior to listing to eliminate "Omo-onile" disputes.
      `
    },
    {
      keywords: ["how to buy", "buy process", "purchase step", "steps to buy", "process of buying"],
      response: `
        <strong>🏡 How to Buy a Home on NaijaHomes:</strong><br><br>
        1. <strong>Browse & Filter:</strong> Search by corridor (Lekki, Ikoyi, Maitama), property type, or budget.<br>
        2. <strong>Free Physical Inspection:</strong> Click "Book Inspection" to schedule a visit with our licensed coordinator (100% free).<br>
        3. <strong>Title Charting:</strong> Review the Governor's Consent / C of O documentation.<br>
        4. <strong>Contract & Escrow:</strong> Execute legal deed of assignment prepared by our verified legal partners.<br>
        5. <strong>Key Handover:</strong> Instant allocation and keys delivered!
      `
    },
    {
      keywords: ["how to rent", "rent process", "service charge", "tenancy", "agreement", "lease terms"],
      response: `
        <strong>🔑 Renting with NaijaHomes:</strong><br><br>
        • Annual rentals in prime corridors (Lekki, VI, Ikoyi) include standard 1-year leases.<br>
        • <strong>Service Charge:</strong> Covers 24/7 power backup (diesel generator fueling), security, waste disposal, and water treatment.<br>
        • <strong>Inspection:</strong> We arrange free physical or live video walkthroughs for tenants before signing any tenancy agreement.
      `
    },
    {
      keywords: ["how to sell", "post property", "list property", "sell my house", "sell my land", "list my home", "advertise"],
      response: `
        <strong>📢 Selling or Listing Your Property:</strong><br><br>
        You can post your property for free! Click the <strong>"+ Post a Property"</strong> button in the top navigation banner. Fill in the title, location, price in Naira (₦), title document type, and photos. Your listing will appear live to buyers and diaspora investors.
      `
    },
    {
      keywords: ["physical inspection", "inspection fee", "tour", "site visit", "book an inspection", "how to inspect"],
      response: `
        <strong>📅 100% Free Physical Inspections:</strong><br><br>
        Zero inspection fees! Our licensed coordinators meet you directly at the property site in Lekki, Ikoyi, Victoria Island, Ikeja, or Abuja. Diaspora clients can request live WhatsApp video tours with real-time room walkthroughs.
      `
    },
    {
      keywords: ["currency", "dollar", "usd", "exchange rate", "naira", "ngn", "foreign currency", "diaspora payment"],
      response: `
        <strong>💱 Dual Currency Support:</strong><br><br>
        You can toggle all prices between <strong>Nigerian Naira (₦ NGN)</strong> and <strong>US Dollars ($ USD)</strong> anytime using the currency switcher at the top right of any page. We use the real-time diaspora conversion rate (1 USD = ₦1,500).
      `
    },
    {
      keywords: ["corridor", "neighborhood", "lekki vs ikoyi", "best place to live", "where to invest", "investing in nigeria"],
      response: `
        <strong>🌍 Prime Nigerian Corridor Advisory:</strong><br><br>
        • <strong>Lekki Phase 1:</strong> Ideal for luxury detached duplexes, prime lifestyle, high rental yields (8-11%), and shortlets.<br>
        • <strong>Old Ikoyi & Banana Island:</strong> Ultra-luxury waterfront penthouses, ambassadorial mansions, elite security, and capital preservation.<br>
        • <strong>Maitama & Guzape (Abuja):</strong> Diplomatic mansions, scenic hilltop terraces, and federal capital stability.<br>
        • <strong>Ibeju-Lekki & Epe:</strong> Nigeria's fastest capital growth belt (Dangote Refinery, Lekki Deep Sea Port, proposed airport). Best for high-ROI titled land parcels.
      `
    },
    {
      keywords: ["google maps", "directions", "route", "traffic", "google map"],
      response: `
        <strong>🗺️ Google Maps Navigation Explorer:</strong><br><br>
        Click <strong>"Google Maps"</strong> in the top navigation to explore our real-time interactive cartography! You can inspect live traffic, measure driving times from the Lekki-Ikoyi Link Bridge to any estate, view 3D satellite imagery, and toggle turn-by-turn navigation HUD.
      `
    }
  ];

  // 2. Natural Language Property Query Parser ("Bring out what user describes")
  function parsePropertyQuery(text) {
    const q = text.toLowerCase();
    const criteria = {
      purpose: null,
      location: null,
      state: null,
      maxPrice: null,
      minPrice: null,
      bedrooms: null,
      amenities: [],
      propertyType: null,
      titleDoc: null
    };

    // A. Detect Purpose
    if (q.includes("shortlet") || q.includes("short let") || q.includes("per night") || q.includes("daily")) {
      criteria.purpose = "shortlet";
    } else if (q.includes("rent") || q.includes("to let") || q.includes("lease") || q.includes("tenant")) {
      criteria.purpose = "rent";
    } else if (q.includes("land") || q.includes("plot") || q.includes("acre") || q.includes("hectare")) {
      criteria.purpose = "land";
    } else if (q.includes("buy") || q.includes("sale") || q.includes("purchase") || q.includes("duplex")) {
      criteria.purpose = "sale";
    }

    // B. Detect Corridor / Neighborhood
    if (q.includes("banana island") || q.includes("banana")) {
      criteria.location = "Banana Island";
      criteria.state = "Lagos";
    } else if (q.includes("old ikoyi") || q.includes("ikoyi") || q.includes("bourkey")) {
      criteria.location = "Ikoyi";
      criteria.state = "Lagos";
    } else if (q.includes("lekki") || q.includes("admiralty") || q.includes("freedom way")) {
      criteria.location = "Lekki";
      criteria.state = "Lagos";
    } else if (q.includes("victoria island") || q.includes(" vi ") || q.endsWith(" vi") || q.includes("ahmadu bello")) {
      criteria.location = "Victoria Island";
      criteria.state = "Lagos";
    } else if (q.includes("ikeja") || q.includes("mainland") || q.includes("isaac john")) {
      criteria.location = "Ikeja";
      criteria.state = "Lagos";
    } else if (q.includes("maitama") || q.includes("mississippi")) {
      criteria.location = "Maitama";
      criteria.state = "Abuja";
    } else if (q.includes("guzape")) {
      criteria.location = "Guzape";
      criteria.state = "Abuja";
    } else if (q.includes("abuja") || q.includes("fct")) {
      criteria.state = "Abuja";
    } else if (q.includes("epe")) {
      criteria.location = "Epe";
      criteria.state = "Lagos";
    } else if (q.includes("ibeju") || q.includes("eleko")) {
      criteria.location = "Ibeju-Lekki";
      criteria.state = "Lagos";
    }

    // C. Detect Bedrooms count (supports digits and text numbers e.g. "5 bed", "five bedroom")
    const wordNumbers = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
    const bedMatch = q.match(/(\d+|one|two|three|four|five|six|seven|eight)\s*(?:bed|bedroom|bdr|room)/i);
    if (bedMatch) {
      const val = bedMatch[1].toLowerCase();
      criteria.bedrooms = wordNumbers[val] || parseInt(val, 10);
    }

    // D. Detect Budget / Price constraints
    // e.g. "under 400m", "below 500 million", "under 1.5b", "120k", "₦400,000,000"
    const billionMatch = q.match(/(?:under|below|less than|max|up to|budget of)?\s*(?:₦|ngn)?\s*(\d+(?:\.\d+)?)\s*(?:b|billion)\b/i);
    const millionMatch = q.match(/(?:under|below|less than|max|up to|budget of)?\s*(?:₦|ngn)?\s*(\d+(?:\.\d+)?)\s*(?:m|million)\b/i);
    const thousandMatch = q.match(/(?:under|below|less than|max|up to|budget of)?\s*(?:₦|ngn)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/i);
    const rawNumberMatch = q.match(/(?:under|below|less than|max|up to|budget of)?\s*(?:₦|ngn)?\s*(\d{1,3}(?:,\d{3}){2,}|\d{7,})\b/i);

    if (billionMatch) {
      criteria.maxPrice = parseFloat(billionMatch[1]) * 1000000000;
    } else if (millionMatch) {
      criteria.maxPrice = parseFloat(millionMatch[1]) * 1000000;
    } else if (thousandMatch) {
      criteria.maxPrice = parseFloat(thousandMatch[1]) * 1000;
    } else if (rawNumberMatch) {
      criteria.maxPrice = parseFloat(rawNumberMatch[1].replace(/,/g, ''));
    }

    // E. Detect Property Type
    if (q.includes("penthouse")) criteria.propertyType = "penthouse";
    if (q.includes("duplex")) criteria.propertyType = "duplex";
    if (q.includes("terrace")) criteria.propertyType = "terrace";
    if (q.includes("apartment") || q.includes("flat")) criteria.propertyType = "apartment";
    if (q.includes("mansion") || q.includes("villa")) criteria.propertyType = "mansion";
    if (q.includes("land") || q.includes("plot")) criteria.propertyType = "land";

    // F. Detect Amenities
    if (q.includes("pool") || q.includes("swimming")) criteria.amenities.push("pool");
    if (q.includes("bq") || q.includes("boys quarter")) criteria.amenities.push("bq");
    if (q.includes("waterfront") || q.includes("jetty")) criteria.amenities.push("waterfront");
    if (q.includes("elevator") || q.includes("lift")) criteria.amenities.push("elevator");
    if (q.includes("power") || q.includes("generator") || q.includes("24/7")) criteria.amenities.push("power");

    // G. Title docs
    if (q.includes("c of o") || q.includes("certificate of occupancy")) criteria.titleDoc = "c-of-o";
    if (q.includes("consent") || q.includes("governor")) criteria.titleDoc = "gov-consent";
    if (q.includes("gazette")) criteria.titleDoc = "gazette";

    return criteria;
  }

  // 3. Search & Score matching properties
  function findMatchingProperties(criteria, rawQuery) {
    if (typeof getAllNaijaProperties !== "function") return [];
    const all = getAllNaijaProperties();

    const scored = all.map(p => {
      let score = 0;
      const textMatch = (p.title + " " + p.location + " " + p.description + " " + p.type + " " + (p.categoryLabel || "")).toLowerCase();

      // Purpose match
      if (criteria.purpose) {
        if (p.purpose === criteria.purpose) score += 30;
        else score -= 30; // heavy penalty for wrong purpose (e.g. asking for rent, getting land)
      }

      // Location match
      if (criteria.location) {
        if (p.location.toLowerCase().includes(criteria.location.toLowerCase()) || textMatch.includes(criteria.location.toLowerCase())) {
          score += 45;
        } else {
          score -= 35; // strong penalty if corridor does not match user request
        }
      } else if (criteria.state) {
        if (p.state.toLowerCase() === criteria.state.toLowerCase()) score += 20;
        else score -= 20;
      }

      // Bedrooms match
      if (criteria.bedrooms !== null && criteria.bedrooms !== undefined) {
        if (p.bedrooms === criteria.bedrooms) {
          score += 30;
        } else if (Math.abs(p.bedrooms - criteria.bedrooms) === 1) {
          score += 5;
        } else if (p.bedrooms > 0) {
          score -= 25;
        }
      }

      // Budget check
      if (criteria.maxPrice) {
        if (p.priceNgn <= criteria.maxPrice) score += 20;
        else score -= 25;
      }

      // Property type
      if (criteria.propertyType) {
        if (p.type.toLowerCase().includes(criteria.propertyType) || textMatch.includes(criteria.propertyType)) {
          score += 25;
        }
      }

      // Amenities
      if (criteria.amenities.length > 0) {
        criteria.amenities.forEach(a => {
          if (a === "pool" && (p.hasPool || textMatch.includes("pool"))) score += 15;
          if (a === "bq" && (p.hasBq || textMatch.includes("bq"))) score += 15;
          if (a === "waterfront" && textMatch.includes("waterfront")) score += 20;
          if (a === "elevator" && (textMatch.includes("elevator") || textMatch.includes("lift"))) score += 20;
        });
      }

      // Free text relevance
      const words = rawQuery.toLowerCase().split(/\s+/);
      words.forEach(w => {
        if (w.length > 3 && textMatch.includes(w)) score += 5;
      });

      return { property: p, score };
    });

    // Filter properties that have positive relevance
    return scored
      .filter(item => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .map(item => item.property);
  }

  // 4. Generate Interactive Chat Card HTML
  function renderPropertyCardInChat(p) {
    const detailLink = `${pathPrefix}property-detail.html?id=${p.id}`;
    const mapLink = `${pathPrefix}map.html?id=${p.id}`;
    const rawPhone = p.agent && (p.agent.whatsapp || p.agent.phone) ? (p.agent.whatsapp || p.agent.phone).replace(/[^0-9]/g, '') : '';
    const waText = encodeURIComponent(`Hello, I saw this property on NaijaHomes: ${p.title} (${p.priceFormattedNgn}). I would like to schedule an inspection.`);
    const waUrl = rawPhone ? `https://wa.me/${rawPhone}?text=${waText}` : null;

    return `
      <div class="nh-ai-card">
        <div class="nh-ai-card-img">
          <img src="${p.image}" alt="${p.title}">
          <span class="nh-ai-card-badge">${p.purpose === 'sale' ? 'FOR SALE' : (p.purpose === 'rent' ? 'FOR RENT' : (p.purpose === 'shortlet' ? 'SHORT LET' : 'LAND'))}</span>
          <span class="nh-ai-card-doc">✓ ${p.titleDoc}</span>
        </div>
        <div class="nh-ai-card-body">
          <div class="nh-ai-card-price" data-price-ngn="${p.priceNgn}" data-price-period="${p.pricePeriod || ''}">
            ${p.priceFormattedNgn}
          </div>
          <h4 class="nh-ai-card-title">${p.title}</h4>
          <p class="nh-ai-card-loc">📍 ${p.location}</p>
          <div class="nh-ai-card-specs">
            ${p.bedrooms > 0 ? `<span>🛏️ ${p.bedrooms} Beds</span>` : ''}
            ${p.bathrooms > 0 ? `<span>🚿 ${p.bathrooms} Baths</span>` : ''}
            ${p.landSize ? `<span>📐 ${p.landSize}</span>` : ''}
          </div>
          <div class="nh-ai-card-actions">
            <a href="${detailLink}" class="nh-ai-btn primary">View Details &rarr;</a>
            <a href="${mapLink}" class="nh-ai-btn map" title="Inspect on Google Maps">🚗 Route</a>
            ${waUrl ? `<a href="${waUrl}" target="_blank" class="nh-ai-btn wa" title="WhatsApp Listing Contact">💬 WhatsApp</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 5. Intelligent AI Response Generator
  function generateAiResponse(userText) {
    const q = userText.toLowerCase().trim();

    // Detect property search indicators (verbs, nouns, specs)
    const searchVerbs = /(?:find|show|search|bring|look|want|need|give|recommend|options|get|display)\b/i;
    const propertyNouns = /(?:duplex|penthouse|mansion|villa|terrace|apartment|flat|shortlet|short let|land|plot|house|home|property|estate)\b/i;
    const hasSearchIntent = searchVerbs.test(q) || propertyNouns.test(q);

    // Parse property criteria
    const criteria = parsePropertyQuery(userText);
    const hasCriteria = !!(criteria.purpose || criteria.location || criteria.state || criteria.bedrooms || criteria.maxPrice || criteria.propertyType || criteria.amenities.length > 0);

    // 1. Prioritize Property Matcher if user is looking for properties
    if (hasSearchIntent || hasCriteria) {
      const matches = findMatchingProperties(criteria, userText);

      if (matches.length > 0) {
        const topMatches = matches.slice(0, 3);
        let intro = `I found <strong>${topMatches.length} verified ${topMatches.length === 1 ? 'property' : 'properties'}</strong> matching your description`;
        if (criteria.location) intro += ` in <strong>${criteria.location}</strong>`;
        if (criteria.bedrooms) intro += ` with <strong>${criteria.bedrooms} bedrooms</strong>`;
        if (criteria.maxPrice) {
          const compact = criteria.maxPrice >= 1e9 ? `₦${(criteria.maxPrice / 1e9).toFixed(1)}B` : `₦${Math.round(criteria.maxPrice / 1e6)}M`;
          intro += ` under <strong>${compact}</strong>`;
        }
        intro += `! Every home below is title-verified with Governor's Consent / C of O and eligible for 100% free physical inspection:`;

        return {
          text: intro,
          properties: topMatches
        };
      } else if (hasSearchIntent) {
        // Fallback recommendations if zero exact matches
        const all = typeof getAllNaijaProperties === "function" ? getAllNaijaProperties() : [];
        const fallbacks = all.slice(0, 2);
        return {
          text: `I couldn't find an exact match under your exact budget or parameters in that specific corridor, but here are the <strong>closest verified options</strong> in our catalog right now:`,
          properties: fallbacks
        };
      }
    }

    // 2. Check general Real Estate & Platform Q&A
    for (const item of REAL_ESTATE_KB) {
      if (item.keywords.some(kw => q.includes(kw))) {
        return { text: item.response, properties: [] };
      }
    }


    // 3. Conversational greetings
    if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("good morning") || q.includes("good evening") || q.includes("ariya")) {
      return {
        text: `
          Hello! I am <strong>Ariya</strong>, your NaijaHomes AI Real Estate Advisor. 🇳🇬✨<br><br>
          Tell me what you are looking for! For example:<br>
          • <em>"Find me a 5 bedroom duplex in Lekki under ₦400M"</em><br>
          • <em>"I want a waterfront penthouse in Ikoyi"</em><br>
          • <em>"Show me titled land in Epe with C of O"</em><br>
          • <em>"What is Governor's Consent?"</em><br><br>
          How can I assist your property search today?
        `,
        properties: []
      };
    }

    // 4. Default helpful guide
    return {
      text: `
        I can help you discover verified properties across Lagos & Abuja, understand Nigerian land titles, or schedule free inspections! Try describing your target home (e.g., <em>"5 bed duplex in Lekki with pool"</em>, <em>"shortlet in Victoria Island"</em>, or <em>"land in Epe under 50 million"</em>).
      `,
      properties: []
    };
  }

  // 6. Mount Floating AI Assistant UI to DOM
  function initAiWidget() {
    // Avoid double instantiation
    if (document.getElementById("nhAiFab")) return;

    // Inject FAB & Chat Window into DOM
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "nhAiWidgetWrapper";
    widgetContainer.innerHTML = `
      <!-- Floating AI Action Button -->
      <button type="button" class="nh-ai-fab" id="nhAiFab" title="Chat with NaijaHomes AI Advisor">
        <div class="nh-ai-fab-icon">✨</div>
        <span class="nh-ai-fab-label">Ask Ariya AI</span>
        <span class="nh-ai-fab-pulse"></span>
      </button>

      <!-- Expandable AI Chat Window -->
      <div class="nh-ai-window" id="nhAiWindow" style="display: none;">
        <!-- Header -->
        <div class="nh-ai-header">
          <div class="nh-ai-avatar">
            <span style="font-size: 1.25rem;">🤖</span>
            <span class="nh-ai-online-dot"></span>
          </div>
          <div class="nh-ai-header-info">
            <h3 class="nh-ai-title">Ariya &bull; NaijaHomes AI</h3>
            <span class="nh-ai-subtitle">Verified Real Estate Intelligence</span>
          </div>
          <div class="nh-ai-header-controls">
            <button type="button" class="nh-ai-ctrl-btn" id="nhAiClearBtn" title="Clear Chat History">🔄</button>
            <button type="button" class="nh-ai-ctrl-btn" id="nhAiCloseBtn" title="Close AI Assistant">&times;</button>
          </div>
        </div>

        <!-- Quick Prompt Starter Chips -->
        <div class="nh-ai-chips-bar" id="nhAiChipsBar">
          <button type="button" class="nh-ai-chip" data-prompt="Find 5 bed duplex in Lekki under ₦400M">🌴 5-Bed Lekki &lt; ₦400M</button>
          <button type="button" class="nh-ai-chip" data-prompt="Show me waterfront penthouses in Ikoyi">🛥️ Ikoyi Penthouse</button>
          <button type="button" class="nh-ai-chip" data-prompt="Looking for titled land in Epe with C of O">📐 Titled Land in Epe</button>
          <button type="button" class="nh-ai-chip" data-prompt="What is Governor's Consent?">📜 Title Guide</button>
          <button type="button" class="nh-ai-chip" data-prompt="Show me luxury shortlets in Lagos">✨ Luxury Shortlet</button>
        </div>

        <!-- Messages Stream -->
        <div class="nh-ai-messages" id="nhAiMessages">
          <div class="nh-ai-msg bot">
            <div class="nh-ai-msg-bubble">
              Hello! I am <strong>Ariya</strong>, your NaijaHomes AI Real Estate Consultant. 🇳🇬<br><br>
              Describe your ideal property (e.g. <em>"Find me a 4 bed duplex in Lekki with a pool under 400M"</em>) or ask any question about Nigerian titles and inspections.
            </div>
            <span class="nh-ai-msg-time">Just now</span>
          </div>
        </div>

        <!-- Typing indicator -->
        <div class="nh-ai-typing" id="nhAiTyping" style="display: none;">
          <span>Ariya is searching verified estates</span>
          <div class="nh-ai-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Input Bar -->
        <form class="nh-ai-input-bar" id="nhAiForm">
          <input type="text" id="nhAiInput" placeholder="Describe your dream home or ask a question..." autocomplete="off">
          <button type="submit" class="nh-ai-send-btn" id="nhAiSendBtn" title="Send Message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(widgetContainer);

    // Event Handlers
    const fab = document.getElementById("nhAiFab");
    const windowEl = document.getElementById("nhAiWindow");
    const closeBtn = document.getElementById("nhAiCloseBtn");
    const clearBtn = document.getElementById("nhAiClearBtn");
    const form = document.getElementById("nhAiForm");
    const input = document.getElementById("nhAiInput");
    const messagesEl = document.getElementById("nhAiMessages");
    const typingEl = document.getElementById("nhAiTyping");

    function toggleChat() {
      if (!windowEl) return;
      const isVisible = windowEl.style.display === "flex";
      windowEl.style.display = isVisible ? "none" : "flex";
      if (!isVisible) {
        if (input) input.focus();
        scrollToBottom();
      }
    }

    if (fab) fab.addEventListener("click", toggleChat);
    if (closeBtn && windowEl) {
      closeBtn.addEventListener("click", () => {
        windowEl.style.display = "none";
      });
    }

    if (clearBtn && messagesEl) {
      clearBtn.addEventListener("click", () => {
        messagesEl.innerHTML = `
          <div class="nh-ai-msg bot">
            <div class="nh-ai-msg-bubble">
              Chat cleared! What Nigerian property or corridor would you like to explore?
            </div>
            <span class="nh-ai-msg-time">Just now</span>
          </div>
        `;
      });
    }

    function scrollToBottom() {
      setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 50);
    }

    function appendUserMessage(text) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgDiv = document.createElement("div");
      msgDiv.className = "nh-ai-msg user";
      msgDiv.innerHTML = `
        <div class="nh-ai-msg-bubble">${escapeHtml(text)}</div>
        <span class="nh-ai-msg-time">${time}</span>
      `;
      messagesEl.appendChild(msgDiv);
      scrollToBottom();
    }

    function appendBotMessage(result) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgDiv = document.createElement("div");
      msgDiv.className = "nh-ai-msg bot";

      let cardsHtml = "";
      if (result.properties && result.properties.length > 0) {
        cardsHtml = `<div class="nh-ai-cards-container">` +
          result.properties.map(p => renderPropertyCardInChat(p)).join("") +
          `</div>`;
      }

      msgDiv.innerHTML = `
        <div class="nh-ai-msg-bubble">
          ${result.text}
          ${cardsHtml}
        </div>
        <span class="nh-ai-msg-time">${time}</span>
      `;
      messagesEl.appendChild(msgDiv);
      scrollToBottom();

      // Trigger currency update if applicable
      if (typeof updateCurrencyUI === "function") {
        updateCurrencyUI();
      }
    }

    function handleUserInput(userText) {
      if (!userText || !userText.trim()) return;
      const text = userText.trim();
      appendUserMessage(text);
      input.value = "";

      // Show typing indicator
      typingEl.style.display = "flex";
      scrollToBottom();

      setTimeout(() => {
        typingEl.style.display = "none";
        const result = generateAiResponse(text);
        appendBotMessage(result);
      }, 500);
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (input) handleUserInput(input.value);
      });
    }

    // Quick chips click
    const chips = document.querySelectorAll ? document.querySelectorAll(".nh-ai-chip") : [];
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt");
        if (windowEl.style.display !== "flex") {
          windowEl.style.display = "flex";
        }
        handleUserInput(prompt);
      });
    });

    function escapeHtml(string) {
      return String(string).replace(/[&<>"']/g, function (s) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[s];
      });
    }

    // Expose programmatic trigger to window
    window.nhOpenAiAssistant = function (optionalPrompt) {
      windowEl.style.display = "flex";
      if (optionalPrompt) {
        handleUserInput(optionalPrompt);
      } else {
        input.focus();
      }
    };
  }

  // Expose AI engine to other scripts (e.g. messages.js)
  window.nhGenerateAiResponse = generateAiResponse;
  window.nhRenderPropertyCard = renderPropertyCardInChat;

  // 7. Auto-initialize when DOM is ready
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAiWidget);
    } else {
      initAiWidget();
    }
  }
})();
