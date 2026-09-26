/**
 * NaijaHomes - Inspection Desk & Verified Realtor Advisory Controller
 * Manages physical inspection scheduling, Nigerian title searches,
 * WhatsApp quick transfers, and real-time advisor chat.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Conversation Store (Ariya AI Assistant & Real Listing Inquiries)
  const CONVERSATIONS = {
    ariya: {
      id: "ariya",
      name: "Ariya AI Advisor",
      role: "NaijaHomes AI Real Estate Consultant &bull; Online 24/7",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
      phone: "",
      whatsapp: "",
      propertyId: "",
      propertyTitle: "Natural Language Property Search &amp; Nigerian Real Estate Consultation",
      propertyLink: "explore.html",
      messages: [
        {
          sender: "incoming",
          author: "Ariya AI",
          text: "Hello! I am <strong>Ariya</strong>, your NaijaHomes AI Real Estate Advisor. 🇳🇬✨<br><br>Describe what kind of home, apartment, or land you want (e.g. <em>'Find me a 4 bed duplex in Lekki'</em> or <em>'Titled land in Abuja'</em>), or ask any question about Governor's Consent, C of O, and title documents.",
          time: "Just now"
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
  const activeAvatar = document.getElementById("hhActiveAvatar");
  const activeName = document.getElementById("hhActiveName");
  const activeRole = document.getElementById("hhActiveRole");
  const activePropTitle = document.getElementById("hhActivePropTitle");
  const activePropLink = document.getElementById("hhActivePropLink");
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
      const propConvId = `prop_${matchedProp.id}`;
      CONVERSATIONS[propConvId] = {
        id: propConvId,
        name: matchedProp.agent && matchedProp.agent.name ? matchedProp.agent.name : "Property Contact",
        role: matchedProp.agent && matchedProp.agent.company ? matchedProp.agent.company : "Listing Representative",
        avatar: matchedProp.image,
        phone: matchedProp.agent ? matchedProp.agent.phone : "",
        whatsapp: matchedProp.agent ? matchedProp.agent.whatsapp : "",
        propertyId: matchedProp.id,
        propertyTitle: `${matchedProp.title} • ${matchedProp.priceFormattedNgn} • ${matchedProp.location}`,
        propertyLink: `property-detail.html?id=${matchedProp.id}`,
        messages: [
          {
            sender: "incoming",
            author: matchedProp.agent && matchedProp.agent.name ? matchedProp.agent.name : "Property Contact",
            text: `Hello! Inquiring about <strong>${matchedProp.title}</strong> in ${matchedProp.location}. Feel free to ask any questions or schedule an inspection.`,
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
    msgDiv.className = `hh-chat-msg ${type}`;

    const bubble = document.createElement("div");
    bubble.className = "hh-chat-bubble";
    bubble.innerHTML = htmlContent;

    const meta = document.createElement("div");
    meta.className = "hh-chat-meta";
    meta.textContent = `${author} • ${timeStr || getCurrentTimeStr()}`;

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
    return `${hours}:${minutes} ${ampm}`;
  }

  // 3. Render Conversations List
  function renderConvList() {
    const listEl = document.getElementById("hhConvList");
    if (!listEl) return;
    listEl.innerHTML = "";

    const keys = Object.keys(CONVERSATIONS);
    keys.forEach(k => {
      const conv = CONVERSATIONS[k];
      const isAriya = k === "ariya";
      const li = document.createElement("li");
      li.className = `hh-conv-item ${k === activeConvId ? 'active' : ''}`;
      li.setAttribute("data-conv-id", k);
      if (isAriya) {
        li.style.borderLeft = "3px solid #10b981";
      }

      li.innerHTML = `
        <div class="hh-conv-avatar" ${isAriya ? 'style="background: linear-gradient(135deg, #054f30, #008751); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; color: #ffffff;"' : ''}>
          ${isAriya ? '🤖' : `<img src="${conv.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%230f172a\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' fill=\'%23ffffff\' font-size=\'40\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3E🏠%3C/text%3E%3C/svg%3E'}" alt="${conv.name}">`}
          <span class="hh-conv-online-dot" style="${isAriya ? 'background: #10b981;' : ''}"></span>
        </div>
        <div class="hh-conv-info">
          <div class="hh-conv-top">
            <span class="hh-conv-name" ${isAriya ? 'style="color: #008751; font-weight: 800;"' : ''}>${conv.name} ${isAriya ? '✨' : ''}</span>
            <span class="hh-conv-time">${isAriya ? '24/7 AI' : 'Active'}</span>
          </div>
          <div class="hh-conv-snippet">${conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text.replace(/<[^>]*>?/gm, '').substring(0, 36) + '...' : 'Conversation'}</div>
        </div>
      `;

      li.addEventListener("click", () => {
        switchConversation(k);
      });

      listEl.appendChild(li);
    });

    if (keys.length === 1) {
      const notice = document.createElement("li");
      notice.style.cssText = "padding: 16px 12px; font-size: 0.78rem; color: #94a3b8; text-align: center; line-height: 1.4; border-top: 1px dashed #e2e8f0; margin-top: 6px;";
      notice.innerHTML = `No other seller inquiries yet.<br>When you inquire about a property listing, your chat will appear here.`;
      listEl.appendChild(notice);
    }
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
        activeAvatar.src = conv.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E🏠%3C/text%3E%3C/svg%3E";
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
    if (typingAuthor) typingAuthor.textContent = conv.name.split(" ")[0];

    if (chatWhatsappBtn) {
      if (conv.whatsapp) {
        chatWhatsappBtn.style.display = "inline-flex";
        chatWhatsappBtn.onclick = () => {
          if (typeof chatWhatsApp === "function") {
            chatWhatsApp(conv.whatsapp, conv.propertyTitle);
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

    // If active conversation is Ariya AI Assistant
    if (activeConvId === "ariya") {
      if (typeof window.nhGenerateAiResponse === "function") {
        const aiRes = window.nhGenerateAiResponse(userText);
        let output = aiRes.text;
        if (aiRes.properties && aiRes.properties.length > 0 && typeof window.nhRenderPropertyCard === "function") {
          output += `<div class="nh-ai-cards-container">` +
            aiRes.properties.map(p => window.nhRenderPropertyCard(p)).join("") +
            `</div>`;
        }
        return output;
      }
      return `I received your request: "${userText}". Let me check our verified catalog for matching properties!`;
    }

    // If chatting with a property listing contact
    return `Thank you for your message regarding <strong>${conv.propertyTitle}</strong>. Your inquiry has been sent to the property owner.`;
  }

  // 5. Send User Message
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
        showNaijaToast(`${conv.name} sent a reply`, "💬");
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

  // 6. Quick Chips
  inquiryChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        handleSendMessage(prompt);
      }
    });
  });

  // 7. Schedule Tour Button
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

  // 8. Search Conversations
  if (searchConvInput) {
    searchConvInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".hh-conv-item").forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? "flex" : "none";
      });
    });
  }

  // Initial setup for the selected conversation
  renderConvList();
  switchConversation(activeConvId);
});
