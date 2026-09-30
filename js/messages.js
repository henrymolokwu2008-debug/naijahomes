/**
 * NaijaHomes - Chat & Verified Realtor Advisory Controller
 * Manages physical inspection scheduling, Nigerian title searches,
 * WhatsApp quick transfers, and real-time advisor chat.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Conversation Store (Ariya AI Assistant & Verified Partner Realtors)
  const CONVERSATIONS = {
    ariya: {
      id: "ariya",
      name: "Ariya AI Advisor",
      role: "NaijaHomes AI Real Estate Consultant &bull; Online 24/7",
      specialty: "Instant AI Search & Title Guidance",
      rating: "★ 5.0 (2,400+ chats)",
      responseTime: "⚡ Instant 24/7",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
      previewThumb: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=240&q=80",
      previewName: "Ariya AI Real Estate Advisor",
      previewDesc: "Instant Nigerian real estate intelligence, title guidance & verified property matches across all corridors.",
      phone: "",
      whatsapp: "",
      propertyId: "",
      propertyTitle: "Natural Language Property Search & Nigerian Real Estate Consultation",
      propertyLink: "explore.html",
      messages: [
        {
          sender: "incoming",
          author: "Ariya AI",
          text: "Hello! I am <strong>Ariya</strong>, your NaijaHomes AI Real Estate Advisor. 🇳🇬✨<br><br>Describe what kind of home, apartment, or land you want (e.g. <em>'Find me a 4 bed duplex in Lekki under ₦350M'</em> or <em>'Titled land in Abuja'</em>), or ask any question about Governor's Consent, C of O, and title documents.",
          time: "Just now"
        }
      ]
    },
    babatunde: {
      id: "babatunde",
      name: "Engr. Babatunde Adeleke",
      role: "Verified Partner Realtor &bull; Lekki & Ikoyi Specialist",
      specialty: "Lekki Luxury & Waterfront Duplexes",
      rating: "★ 4.9 (54 reviews)",
      responseTime: "⚡ Replies in ~5m",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      previewThumb: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=240&q=80",
      previewName: "5-Bed Detached Waterfront Duplex",
      previewDesc: "Lekki Phase 1 • Governor's Consent verified • Private jetty and pool.",
      phone: "+2348012345678",
      whatsapp: "2348012345678",
      propertyId: "nh-lekki-5bed",
      propertyTitle: "5-Bedroom Detached Luxury Duplex with Pool, Lekki Phase 1",
      propertyLink: "explore.html?purpose=sale",
      messages: [
        {
          sender: "incoming",
          author: "Engr. Babatunde",
          text: "Good day! I am <strong>Engr. Babatunde</strong>, verified partner realtor for prime Lekki Phase 1 and Ikoyi properties.<br><br>Governor's Consent on all our listings is 100% verified. When would you like to schedule an inspection?",
          time: "10:15 AM"
        }
      ]
    },
    chioma: {
      id: "chioma",
      name: "Barr. Chioma Okonkwo",
      role: "Verified Property Attorney &bull; Epe & Ibeju-Lekki Specialist",
      specialty: "Title Verification & Land Acquisition",
      rating: "★ 5.0 (38 reviews)",
      responseTime: "⚡ Replies in ~8m",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
      previewThumb: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=240&q=80",
      previewName: "Commercial & Residential Plots",
      previewDesc: "Epe Expressway • Registered C of O • Verified with Lagos Lands Bureau.",
      phone: "+2348023456789",
      whatsapp: "2348023456789",
      propertyId: "nh-epe-land",
      propertyTitle: "Commercial & Residential Plots with C of O, Epe Expressway",
      propertyLink: "explore.html?purpose=land",
      messages: [
        {
          sender: "incoming",
          author: "Barr. Chioma",
          text: "Hello! I am <strong>Barr. Chioma</strong>. I handle verified titled acreage and commercial plots along Epe and Ibeju-Lekki corridors.<br><br>All lands come with verifiable C of O or Gazette with registered survey. Let me know what acreage you require.",
          time: "9:42 AM"
        }
      ]
    },
    musa: {
      id: "musa",
      name: "Malam Musa Danladi",
      role: "Verified Partner Realtor &bull; Maitama & Guzape Abuja Specialist",
      specialty: "Abuja Diplomatic Residences",
      rating: "★ 4.8 (31 reviews)",
      responseTime: "⚡ Replies in ~12m",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      previewThumb: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&q=80",
      previewName: "Diplomatic 6-Bedroom Villa",
      previewDesc: "Maitama FCT • FCDA C of O • Perimeter security, elevator & 50kVA generator.",
      phone: "+2348034567890",
      whatsapp: "2348034567890",
      propertyId: "nh-abuja-villa",
      propertyTitle: "Diplomatic 6-Bedroom Villa with Smart Automation, Maitama FCT",
      propertyLink: "explore.html?purpose=sale",
      messages: [
        {
          sender: "incoming",
          author: "Malam Musa",
          text: "Salam and welcome! I represent premium diplomatic properties across Maitama, Asokoro, and Guzape in Abuja.<br><br>All titles are verified at AGIS (Abuja Geographic Information Systems). Would you like a WhatsApp video walkthrough?",
          time: "Yesterday"
        }
      ]
    }
  };

  let activeConvId = "ariya";

  // DOM Elements
  const chatStream = document.getElementById("hhChatStream");
  const typingIndicator = document.getElementById("hhTypingIndicator");
  const typingAuthor = document.getElementById("hhTypingAuthor");
  const chatForm = document.getElementById("hhChatForm");
  const chatInput = document.getElementById("hhChatInput");
  const chatAttachBtn = document.getElementById("hhChatAttachBtn");
  const activeAvatar = document.getElementById("hhActiveAvatar");
  const activeName = document.getElementById("hhActiveName");
  const activeRole = document.getElementById("hhActiveRole");
  const activePropTitle = document.getElementById("hhActivePropTitle");
  const activePropLink = document.getElementById("hhActivePropLink");
  const previewThumb = document.getElementById("hhPreviewThumb");
  const previewName = document.getElementById("hhPreviewName");
  const previewDesc = document.getElementById("hhPreviewDesc");
  const btnChatWithAriya = document.getElementById("btnChatWithAriya");
  const btnStartChatPreview = document.getElementById("btnStartChatPreview");
  const viewAllRealtors = document.getElementById("nhViewAllRealtors");
  const chatWhatsappBtn = document.getElementById("hhChatWhatsappBtn");
  const searchConvInput = document.getElementById("hhSearchConv");
  const btnScheduleTour = document.getElementById("hhBtnScheduleTour");
  const inquiryChips = document.querySelectorAll(".hh-inquiry-chip");

  // Check URL query parameters for real property inquiry routing
  const urlParams = new URLSearchParams(window.location.search);
  const paramPropId = urlParams.get("id") || urlParams.get("propId");

  if (paramPropId && typeof getAllNaijaProperties === "function") {
    const allProps = getAllNaijaProperties();
    const matchedProp = allProps.find(p => p.id === paramPropId);
    if (matchedProp) {
      const propConvId = "prop_" + matchedProp.id;
      CONVERSATIONS[propConvId] = {
        id: propConvId,
        name: matchedProp.agent && matchedProp.agent.name ? matchedProp.agent.name : "Property Contact",
        role: matchedProp.agent && matchedProp.agent.company ? matchedProp.agent.company : "Listing Representative",
        specialty: matchedProp.location + " Specialist",
        rating: "★ 4.9 (Verified Listing)",
        responseTime: "⚡ Direct Listing",
        avatar: matchedProp.image,
        previewThumb: matchedProp.image,
        previewName: matchedProp.title,
        previewDesc: matchedProp.location + " • " + matchedProp.priceFormattedNgn + " • " + matchedProp.purpose.toUpperCase(),
        phone: matchedProp.agent ? matchedProp.agent.phone : "",
        whatsapp: matchedProp.agent ? matchedProp.agent.whatsapp : "",
        propertyId: matchedProp.id,
        propertyTitle: matchedProp.title + " • " + matchedProp.priceFormattedNgn + " • " + matchedProp.location,
        propertyLink: "property-detail.html?id=" + matchedProp.id,
        messages: [
          {
            sender: "incoming",
            author: matchedProp.agent && matchedProp.agent.name ? matchedProp.agent.name : "Property Contact",
            text: "Hello! Inquiring about <strong>" + matchedProp.title + "</strong> in " + matchedProp.location + ". Feel free to ask any questions or schedule an inspection.",
            time: "Just now"
          }
        ]
      };
      activeConvId = propConvId;
    }
  }

  // 2. Render Stream
  function renderActiveStream() {
    if (!chatStream) return;
    const conv = CONVERSATIONS[activeConvId];
    if (!conv) return;

    chatStream.innerHTML = "";

    conv.messages.forEach(msg => {
      appendMessageBubble(msg.sender, msg.author, msg.text, msg.time, false);
    });

    if (typingIndicator) {
      chatStream.appendChild(typingIndicator);
      typingIndicator.style.display = "none";
    }

    scrollToBottom();
  }

  function appendMessageBubble(type, author, htmlContent, timeStr, doScroll = true) {
    if (!chatStream) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "hh-chat-msg " + type;

    const bubble = document.createElement("div");
    bubble.className = "hh-chat-bubble";
    bubble.innerHTML = htmlContent;

    const meta = document.createElement("div");
    meta.className = "hh-chat-meta";
    meta.textContent = author + " • " + (timeStr || getCurrentTimeStr());

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(meta);

    if (typingIndicator && typingIndicator.parentNode === chatStream) {
      chatStream.insertBefore(msgDiv, typingIndicator);
    } else {
      chatStream.appendChild(msgDiv);
    }

    if (doScroll) {
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    if (!chatStream) return;
    requestAnimationFrame(() => {
      chatStream.scrollTop = chatStream.scrollHeight;
    });
  }

  function getCurrentTimeStr() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return hours + ":" + minutes + " " + ampm;
  }

  // 3. Render Conversations / Marketplace List
  function renderConvList() {
    const listEl = document.getElementById("hhConvList");
    if (!listEl) return;
    listEl.innerHTML = "";

    const keys = Object.keys(CONVERSATIONS);
    keys.forEach(k => {
      const conv = CONVERSATIONS[k];
      const isAriya = k === "ariya";
      const li = document.createElement("li");
      li.className = "hh-conv-item nh-realtor-market-card " + (k === activeConvId ? "active" : "");
      li.setAttribute("data-conv-id", k);
      if (isAriya) {
        li.style.borderLeft = "3px solid #10b981";
      }

      const latestSnippet = conv.messages && conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1].text.replace(/<[^>]*>?/gm, '') 
        : 'Active consultation';

      li.innerHTML = `
        <div class="nh-conv-card-body">
          <div class="hh-conv-avatar nh-market-avatar">
            ${isAriya 
              ? '<div class="nh-avatar-emoji">🤖</div>' 
              : '<img src="' + (conv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80') + '" alt="' + conv.name + '">'
            }
            <span class="hh-conv-online-dot"></span>
          </div>
          <div class="hh-conv-info nh-market-info">
            <div class="hh-conv-top">
              <span class="hh-conv-name">${conv.name} <svg class="nh-verified-badge" width="13" height="13" viewBox="0 0 24 24" fill="#008751"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
              <span class="nh-market-rating">${conv.rating || '★ 4.9'}</span>
            </div>
            <div class="nh-market-specialty">${conv.specialty || conv.role}</div>
            <div class="nh-market-footer">
              <span class="nh-market-response">${conv.responseTime || '⚡ Replies in ~5m'}</span>
              <button type="button" class="nh-market-chat-btn" data-chat-id="${k}">Chat</button>
            </div>
            <div class="hh-conv-snippet">${latestSnippet}</div>
          </div>
        </div>
      `;

      li.addEventListener("click", () => {
        switchConversation(k);
        if (window.innerWidth <= 768) {
          const chatPane = document.getElementById("hhActiveChatPane");
          if (chatPane) {
            chatPane.scrollIntoView({ behavior: "smooth" });
          }
        }
      });

      const chatBtn = li.querySelector(".nh-market-chat-btn");
      if (chatBtn) {
        chatBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          switchConversation(k);
          if (window.innerWidth <= 768) {
            const chatPane = document.getElementById("hhActiveChatPane");
            if (chatPane) {
              chatPane.scrollIntoView({ behavior: "smooth" });
            }
          }
          if (chatInput) chatInput.focus();
        });
      }

      listEl.appendChild(li);
    });
  }

  // 4. Switch Conversation
  function switchConversation(convId) {
    if (!CONVERSATIONS[convId]) convId = "ariya";
    activeConvId = convId;
    const conv = CONVERSATIONS[convId];

    document.querySelectorAll(".hh-conv-item").forEach(item => {
      item.classList.toggle("active", item.getAttribute("data-conv-id") === convId);
    });

    if (activeAvatar) {
      if (convId === "ariya") {
        activeAvatar.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80";
      } else {
        activeAvatar.src = conv.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80";
      }
    }
    if (activeName) {
      activeName.innerHTML = `
        ${conv.name}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#008751"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
      `;
    }
    if (activeRole) activeRole.innerHTML = conv.role;
    if (activePropTitle) activePropTitle.innerHTML = conv.propertyTitle || "Property Consultation";
    if (activePropLink) {
      if (conv.propertyLink) {
        activePropLink.style.display = "inline-block";
        activePropLink.href = conv.propertyLink;
      } else {
        activePropLink.style.display = "none";
      }
    }

    // Update Property Preview Card
    if (previewThumb) {
      previewThumb.src = conv.previewThumb || conv.avatar || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=160&q=80";
    }
    if (previewName) {
      previewName.textContent = conv.previewName || conv.name;
    }
    if (previewDesc) {
      previewDesc.textContent = conv.previewDesc || conv.specialty || "Instant Nigerian real estate intelligence, title guidance & verified property matches.";
    }

    if (typingAuthor) typingAuthor.textContent = conv.name.split(" ")[0];

    if (chatWhatsappBtn) {
      if (conv.whatsapp) {
        chatWhatsappBtn.style.display = "inline-flex";
        chatWhatsappBtn.onclick = () => {
          if (typeof chatWhatsApp === "function") {
            chatWhatsApp(conv.whatsapp, conv.propertyTitle);
          } else {
            window.open("https://wa.me/" + conv.whatsapp + "?text=" + encodeURIComponent("Hello, I am inquiring about " + conv.propertyTitle), "_blank");
          }
        };
      } else {
        chatWhatsappBtn.style.display = "none";
      }
    }

    renderActiveStream();
  }

  // 5. Advisor Reply Generator
  function generateAdvisorReply(userText) {
    const conv = CONVERSATIONS[activeConvId];
    const lower = userText.toLowerCase();

    // If active conversation is Ariya AI Assistant
    if (activeConvId === "ariya") {
      if (typeof window.nhGenerateAiResponse === "function") {
        const aiRes = window.nhGenerateAiResponse(userText);
        let output = aiRes.text;
        if (aiRes.properties && aiRes.properties.length > 0 && typeof window.nhRenderPropertyCard === "function") {
          output += '<div class="nh-ai-cards-container">' +
            aiRes.properties.map(p => window.nhRenderPropertyCard(p)).join("") +
            '</div>';
        }
        return output;
      }
      return 'I received your request: "' + userText + '". Let me check our verified catalog for matching Nigerian properties!';
    }

    // If chatting with Babatunde (Lekki / Ikoyi Specialist)
    if (activeConvId === "babatunde") {
      if (lower.includes("inspection") || lower.includes("tour") || lower.includes("thursday") || lower.includes("view")) {
        return "Certainly! I have noted your physical inspection request for this property in Lekki. Our site engineer will meet you on site with the architectural drawings and verified Governor's Consent deed. Please confirm if WhatsApp or Phone is best for the location pin.";
      }
      if (lower.includes("title") || lower.includes("consent") || lower.includes("c of o") || lower.includes("report")) {
        return "The title document for this property is a valid <strong>Governor's Consent</strong> duly registered at the Lagos State Lands Bureau in Alausa (File No. 24/24/2018). We provide full legal search verification documents prior to closing.";
      }
      if (lower.includes("price") || lower.includes("payment") || lower.includes("deposit") || lower.includes("plan")) {
        return "We offer structured milestone payment plans: 30% initial commitment deposit upon signing the Contract of Sale, 40% at second milestone, and the balance spread over 6 to 12 months. Would you like a payment breakdown schedule?";
      }
      return "Thank you for your message regarding <strong>" + conv.propertyTitle + "</strong>. I am reviewing the site availability and will share the verified survey and video walkthrough shortly.";
    }

    // If chatting with Chioma (Epe / Land Title Attorney)
    if (activeConvId === "chioma") {
      if (lower.includes("title") || lower.includes("c of o") || lower.includes("gazette") || lower.includes("search")) {
        return "All our parcels along Epe and Ibeju-Lekki corridors carry unencumbered <strong>Certificate of Occupancy (C of O)</strong> or government gazette with registered survey pillars. We conduct official searches with the Surveyor General's office so you have 100% peace of mind against encroachers.";
      }
      if (lower.includes("inspection") || lower.includes("visit")) {
        return "Physical land inspections run Tuesdays, Thursdays, and Saturdays. We take clients from our Lekki office directly to the estate layout in Epe. When would you prefer to join the convoy?";
      }
      return "Thank you for reaching out. Land title security in Lagos is our top priority. Let me know the exact size in square meters (SQM) or acreage you are looking for.";
    }

    // If chatting with Musa (Abuja Diplomatic Specialist)
    if (activeConvId === "musa") {
      if (lower.includes("inspection") || lower.includes("visit")) {
        return "Physical inspections for our Maitama and Guzape mansions are arranged with VIP security protocol. We can schedule a private walkthrough at your convenience.";
      }
      if (lower.includes("title") || lower.includes("agis") || lower.includes("c of o")) {
        return "This residence holds an authentic <strong>FCDA Certificate of Occupancy</strong> verified directly at the Abuja Geographic Information Systems (AGIS). Clear title with zero encumbrance.";
      }
      return "Good day! I have received your inquiry regarding <strong>" + conv.propertyTitle + "</strong>. I will be glad to share the high-resolution video walkthrough and specification sheet.";
    }

    // Property listing representative fallback
    return "Thank you for your message regarding <strong>" + conv.propertyTitle + "</strong>. Your inquiry has been sent to our verified partner team.";
  }

  // 6. Send User Message
  function handleSendMessage(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    const conv = CONVERSATIONS[activeConvId];
    const userMsgObj = {
      sender: "outgoing",
      author: "You",
      text: cleanText,
      time: getCurrentTimeStr()
    };
    conv.messages.push(userMsgObj);
    appendMessageBubble("outgoing", "You", cleanText, userMsgObj.time, true);

    if (chatInput) chatInput.value = "";

    if (typingIndicator) {
      if (typingAuthor) typingAuthor.textContent = conv.name.split(" ")[0];
      typingIndicator.style.display = "flex";
      scrollToBottom();
    }

    setTimeout(() => {
      if (typingIndicator) typingIndicator.style.display = "none";
      const replyText = generateAdvisorReply(cleanText);
      const replyMsgObj = {
        sender: "incoming",
        author: conv.name,
        text: replyText,
        time: getCurrentTimeStr()
      };
      conv.messages.push(replyMsgObj);
      appendMessageBubble("incoming", conv.name, replyText, replyMsgObj.time, true);

      if (typeof showNaijaToast === "function") {
        showNaijaToast(conv.name + " replied", "💬");
      }
    }, 1100);
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (chatInput) {
        handleSendMessage(chatInput.value);
      }
    });
  }

  // 7. Quick Chips
  inquiryChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        handleSendMessage(prompt);
      }
    });
  });

  // 8. Schedule Tour Button
  if (btnScheduleTour) {
    btnScheduleTour.addEventListener("click", () => {
      const conv = CONVERSATIONS[activeConvId];
      if (typeof openInspectionModal === "function") {
        openInspectionModal(conv.propertyTitle);
      } else {
        handleSendMessage("I would like to book a physical inspection for this property.");
      }
    });
  }

  // 9. Search Conversations / Realtors
  if (searchConvInput) {
    searchConvInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".hh-conv-item").forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? "block" : "none";
      });
    });
  }

  // 10. Featured Ariya Card Action
  if (btnChatWithAriya) {
    btnChatWithAriya.addEventListener("click", () => {
      switchConversation("ariya");
      if (window.innerWidth <= 768) {
        const chatPane = document.getElementById("hhActiveChatPane");
        if (chatPane) {
          chatPane.scrollIntoView({ behavior: "smooth" });
        }
      }
      if (chatInput) chatInput.focus();
    });
  }

  // 11. Property Preview Start Chat Button
  if (btnStartChatPreview) {
    btnStartChatPreview.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        const chatPane = document.getElementById("hhActiveChatPane");
        if (chatPane) {
          chatPane.scrollIntoView({ behavior: "smooth" });
        }
      }
      if (chatInput) chatInput.focus();
    });
  }

  // 12. Chat Attach Button
  if (chatAttachBtn) {
    chatAttachBtn.addEventListener("click", () => {
      if (typeof showNaijaToast === "function") {
        showNaijaToast("Attach title doc, survey plan, or photo", "📎");
      } else {
        alert("Attach title doc, survey plan, or photo");
      }
    });
  }

  // 13. View All Realtors link
  if (viewAllRealtors) {
    viewAllRealtors.addEventListener("click", (e) => {
      e.preventDefault();
      const listEl = document.getElementById("hhConvList");
      if (listEl) {
        listEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Initial setup for the selected conversation
  renderConvList();
  switchConversation(activeConvId);
});
