/**
 * NaijaHomes - Real Messaging & Conversation Controller
 * Backed by Supabase database, Row Level Security (RLS) policies,
 * Realtime WebSocket subscriptions, and mobile screen switching.
 * Zero hardcoded or fake chat messages.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const dashboard = document.getElementById("hhConciergeDashboard");
  const convListEl = document.getElementById("hhConvList");
  const convCountBadge = document.getElementById("nhConvCountBadge");
  const guestCard = document.getElementById("nhMsgGuestCard");
  const emptyState = document.getElementById("nhMsgEmptyState");
  const searchInput = document.getElementById("hhSearchConv");

  // Chat Screen Elements
  const chatPane = document.getElementById("hhActiveChatPane");
  const chatHeader = document.getElementById("hhChatHeader");
  const backBtn = document.getElementById("nhChatBackBtn");
  const activeAvatar = document.getElementById("hhActiveAvatar");
  const activeName = document.getElementById("hhActiveName");
  const activeRole = document.getElementById("hhActiveRole");
  const chatWhatsappBtn = document.getElementById("hhChatWhatsappBtn");
  const btnScheduleTour = document.getElementById("hhBtnScheduleTour");
  const propBanner = document.getElementById("hhChatPropBanner");
  const activePropTitle = document.getElementById("hhActivePropTitle");
  const activePropLink = document.getElementById("hhActivePropLink");
  const placeholderDesktop = document.getElementById("nhNoConvPlaceholder");
  const chatStream = document.getElementById("hhChatStream");
  const chatForm = document.getElementById("hhChatForm");
  const chatInput = document.getElementById("hhChatInput");
  const chatAttachBtn = document.getElementById("hhChatAttachBtn");

  // Application State
  const state = {
    currentUser: null,
    conversations: [],
    activeConvId: null,
    activeMessages: [],
    realtimeSubscription: null
  };

  // Helper: Escape HTML
  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper: Format timestamp
  function formatTimestamp(isoStr) {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timePart = hours + ":" + minutes + " " + ampm;

    if (isToday) return timePart;

    const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // 1. User Session Resolution
  async function resolveUser() {
    if (typeof window.getCurrentUser === "function") {
      state.currentUser = window.getCurrentUser();
    }
    if (!state.currentUser && typeof window.fetchUserProfile === "function") {
      try {
        state.currentUser = await window.fetchUserProfile();
      } catch (e) {}
    }
    return state.currentUser;
  }

  // 2. Load Conversations from Supabase
  async function loadConversations() {
    const user = state.currentUser;
    if (!user) {
      if (guestCard) guestCard.style.display = "block";
      if (emptyState) emptyState.style.display = "none";
      if (convListEl) convListEl.innerHTML = "";
      if (convCountBadge) convCountBadge.textContent = "0";
      if (placeholderDesktop) placeholderDesktop.style.display = "flex";
      return;
    }

    if (guestCard) guestCard.style.display = "none";

    let convs = [];
    if (window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.fetchConversations === "function") {
      convs = await window.NaijaHomesSupabase.fetchConversations(user.id);
    }

    state.conversations = convs || [];
    if (convCountBadge) convCountBadge.textContent = state.conversations.length;

    renderConversationList();
  }

  // 3. Render Conversations List
  function renderConversationList() {
    if (!convListEl) return;
    convListEl.innerHTML = "";

    if (!state.conversations || state.conversations.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (placeholderDesktop) placeholderDesktop.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    state.conversations.forEach((conv) => {
      const isSelected = conv.id === state.activeConvId;
      const li = document.createElement("li");
      li.className = "hh-conv-item nh-real-conv-item " + (isSelected ? "active" : "");
      li.setAttribute("data-conv-id", conv.id);

      const otherName = conv.other_user_name || "NaijaHomes User";
      const otherAvatar = conv.other_user_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";
      const propTitle = conv.property?.title || "";
      const timeStr = formatTimestamp(conv.last_message_at || conv.created_at);
      const snippet = conv.last_message_text ? escapeHtml(conv.last_message_text) : "Conversation opened";
      const unreadCount = Number(conv.unread_count || 0);

      li.innerHTML = `
        <div class="hh-conv-avatar">
          <img src="${otherAvatar}" alt="${escapeHtml(otherName)}">
          <span class="hh-conv-online-dot"></span>
        </div>
        <div class="hh-conv-info">
          <div class="hh-conv-top">
            <span class="hh-conv-name">${escapeHtml(otherName)} <svg class="nh-verified-badge" width="13" height="13" viewBox="0 0 24 24" fill="#008751"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
            <span class="hh-conv-time">${timeStr}</span>
          </div>
          ${propTitle ? `<div class="nh-conv-prop-tag">🏡 ${escapeHtml(propTitle)}</div>` : ""}
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span class="hh-conv-snippet">${snippet}</span>
            ${unreadCount > 0 ? `<span class="nh-unread-badge">${unreadCount}</span>` : ""}
          </div>
        </div>
      `;

      li.addEventListener("click", () => {
        openConversation(conv.id);
      });

      convListEl.appendChild(li);
    });
  }

  // 4. Open Dedicated Chat Screen
  async function openConversation(convId) {
    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;

    state.activeConvId = convId;

    // Update active highlight in conversation list
    document.querySelectorAll(".hh-conv-item").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-conv-id") === convId);
    });

    // Mobile: switch to Chat Screen
    if (dashboard) {
      dashboard.classList.remove("nh-show-list");
      dashboard.classList.add("nh-show-chat");
    }

    if (placeholderDesktop) {
      placeholderDesktop.style.display = "none";
    }

    // Populate Chat Header
    const otherName = conv.other_user_name || "NaijaHomes User";
    const otherAvatar = conv.other_user_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";
    const otherRole = conv.other_user_role || "Verified Partner";

    if (activeAvatar) activeAvatar.src = otherAvatar;
    if (activeName) {
      activeName.innerHTML = `
        ${escapeHtml(otherName)}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#008751"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
      `;
    }
    if (activeRole) activeRole.textContent = otherRole;

    // Property Context
    if (conv.property) {
      if (propBanner) propBanner.style.display = "flex";
      if (activePropTitle) activePropTitle.textContent = conv.property.title;
      if (activePropLink) {
        activePropLink.href = "property-detail.html?id=" + conv.property.id;
        activePropLink.style.display = "inline-block";
      }
      if (btnScheduleTour) {
        btnScheduleTour.style.display = "inline-flex";
        btnScheduleTour.onclick = () => {
          if (typeof window.openInspectionModal === "function") {
            window.openInspectionModal(conv.property.title);
          } else {
            sendMessage("I would like to schedule a physical inspection for " + conv.property.title);
          }
        };
      }
    } else {
      if (propBanner) propBanner.style.display = "none";
      if (btnScheduleTour) btnScheduleTour.style.display = "none";
    }

    // Load Messages for this Conversation
    if (chatStream) chatStream.innerHTML = "<div style='text-align: center; color: #94a3b8; padding: 24px;'>Loading messages...</div>";

    if (window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.fetchMessages === "function") {
      state.activeMessages = await window.NaijaHomesSupabase.fetchMessages(convId);
    } else {
      state.activeMessages = [];
    }

    renderMessagesStream();

    // Mark messages as read
    if (state.currentUser && window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.markMessagesAsRead === "function") {
      await window.NaijaHomesSupabase.markMessagesAsRead(convId, state.currentUser.id);
      conv.unread_count = 0;
      // Remove unread badge in DOM
      const targetItem = document.querySelector(`.hh-conv-item[data-conv-id="${convId}"] .nh-unread-badge`);
      if (targetItem) targetItem.remove();
    }

    // Setup Supabase Realtime Subscription
    if (state.realtimeSubscription && typeof state.realtimeSubscription.unsubscribe === "function") {
      state.realtimeSubscription.unsubscribe();
    }
    if (window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.subscribeToMessages === "function") {
      state.realtimeSubscription = window.NaijaHomesSupabase.subscribeToMessages(convId, (newMsg) => {
        if (newMsg && newMsg.conversation_id === state.activeConvId) {
          // Avoid duplicate insertion if already rendered
          if (!state.activeMessages.some(m => m.id === newMsg.id)) {
            state.activeMessages.push(newMsg);
            appendMessageBubble(newMsg, true);
          }
        }
      });
    }

    scrollToBottom();
  }

  // 5. Render Message Bubbles in Stream
  function renderMessagesStream() {
    if (!chatStream) return;
    chatStream.innerHTML = "";

    if (!state.activeMessages || state.activeMessages.length === 0) {
      chatStream.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 40px 20px;">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">👋</div>
          <div style="font-weight: 700; color: #475569; margin-bottom: 4px;">Start of Conversation</div>
          <div style="font-size: 0.85rem;">Send a message to inquire about pricing, title documents, or schedule an inspection.</div>
        </div>
      `;
      return;
    }

    state.activeMessages.forEach((msg) => {
      appendMessageBubble(msg, false);
    });

    scrollToBottom();
  }

  function appendMessageBubble(msg, doScroll = true) {
    if (!chatStream) return;

    const myId = state.currentUser?.id;
    const isOutgoing = msg.sender_id === myId;
    const type = isOutgoing ? "outgoing" : "incoming";
    const author = isOutgoing ? "You" : (state.conversations.find(c => c.id === state.activeConvId)?.other_user_name || "Realtor");
    const timeStr = formatTimestamp(msg.created_at);

    const msgDiv = document.createElement("div");
    msgDiv.className = "hh-chat-msg " + type;
    msgDiv.setAttribute("data-msg-id", msg.id || "");

    let statusHtml = "";
    if (isOutgoing) {
      if (msg.read_at) {
        statusHtml = '<span class="hh-msg-status read" title="Read">&#10003;&#10003; Read</span>';
      } else {
        statusHtml = '<span class="hh-msg-status" title="Sent">&#10003; Sent</span>';
      }
    }

    msgDiv.innerHTML = `
      <div class="hh-chat-bubble">${escapeHtml(msg.content)}</div>
      <div class="hh-chat-meta">
        ${escapeHtml(author)} &bull; ${timeStr} ${statusHtml}
      </div>
    `;

    chatStream.appendChild(msgDiv);

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

  // 6. Send Message Handler
  async function sendMessage(text) {
    if (!text || !text.trim() || !state.activeConvId || !state.currentUser) return;
    const cleanText = text.trim();

    const activeConv = state.conversations.find((c) => c.id === state.activeConvId);
    if (!activeConv) return;

    if (chatInput) chatInput.value = "";

    // Optimistic UI bubble
    const tempMsg = {
      id: "temp_" + Date.now(),
      conversation_id: state.activeConvId,
      sender_id: state.currentUser.id,
      recipient_id: activeConv.other_user_id,
      content: cleanText,
      read_at: null,
      created_at: new Date().toISOString()
    };
    state.activeMessages.push(tempMsg);
    appendMessageBubble(tempMsg, true);

    // Update conversation item preview in sidebar
    activeConv.last_message_text = cleanText;
    activeConv.last_message_at = tempMsg.created_at;
    const targetItem = document.querySelector(`.hh-conv-item[data-conv-id="${state.activeConvId}"] .hh-conv-snippet`);
    if (targetItem) targetItem.textContent = cleanText;
    const targetTime = document.querySelector(`.hh-conv-item[data-conv-id="${state.activeConvId}"] .hh-conv-time`);
    if (targetTime) targetTime.textContent = formatTimestamp(tempMsg.created_at);

    // Call Supabase API
    if (window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.sendMessage === "function") {
      const res = await window.NaijaHomesSupabase.sendMessage(state.activeConvId, activeConv.other_user_id, cleanText);
      if (res && res.success && res.message) {
        tempMsg.id = res.message.id;
      }
    }
  }

  // Form submit listener
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (chatInput) {
        sendMessage(chatInput.value);
      }
    });
  }

  // 7. Mobile Back Button
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (dashboard) {
        dashboard.classList.remove("nh-show-chat");
        dashboard.classList.add("nh-show-list");
      }
    });
  }

  // 8. Search Filter
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".hh-conv-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? "flex" : "none";
      });
    });
  }

  // 9. Attachment Button
  if (chatAttachBtn) {
    chatAttachBtn.addEventListener("click", () => {
      if (typeof window.showNaijaToast === "function") {
        window.showNaijaToast("Attach title doc, survey plan, or photo", "📎");
      } else {
        alert("Attach title doc, survey plan, or photo");
      }
    });
  }

  
  // 11. New Conversation Modal & Directory
  const btnNewMessage = document.getElementById("btnNewMessage");
  const btnEmptyStartChat = document.getElementById("btnEmptyStartChat");
  const modalNewChat = document.getElementById("nhNewChatModal");
  const closeNewChatModal = document.getElementById("closeNewChatModal");
  const newChatDirectory = document.getElementById("nhNewChatDirectory");

  const VERIFIED_REALTORS = [
    {
      id: "agent_babatunde",
      name: "Engr. Babatunde Adeleke",
      role: "Verified Partner Realtor • Lekki Phase 1 Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      propId: "nh-lekki-5bed",
      propTitle: "5-Bedroom Detached Luxury Duplex with Pool, Lekki Phase 1"
    },
    {
      id: "agent_chioma",
      name: "Barr. Chioma Okonkwo",
      role: "Verified Property Attorney • Epe Land & Title Specialist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
      propId: "nh-epe-land",
      propTitle: "Commercial & Residential Plots with C of O, Epe Expressway"
    },
    {
      id: "agent_musa",
      name: "Malam Musa Danladi",
      role: "Verified Partner Realtor • Maitama Abuja Specialist",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      propId: "nh-abuja-villa",
      propTitle: "Diplomatic 6-Bedroom Villa with Smart Automation, Maitama FCT"
    }
  ];

  function openNewChatModal() {
    if (!state.currentUser) {
      if (typeof window.openAuthModal === "function") {
        window.openAuthModal("login");
      }
      return;
    }
    if (newChatDirectory) {
      newChatDirectory.innerHTML = VERIFIED_REALTORS.map(r => `
        <div class="nh-new-chat-item" data-agent-id="${r.id}" data-prop-id="${r.propId}" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 8px; cursor: pointer; transition: background 0.15s;">
          <img src="${r.avatar}" alt="${r.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a;">${r.name}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${r.role}</div>
            <div style="font-size: 0.72rem; color: #008751; font-weight: 600; margin-top: 2px;">🏡 ${r.propTitle}</div>
          </div>
          <button type="button" class="nh-market-chat-btn" style="flex-shrink: 0;">Chat</button>
        </div>
      `).join("");

      newChatDirectory.querySelectorAll(".nh-new-chat-item").forEach(item => {
        item.addEventListener("click", async () => {
          const agentId = item.getAttribute("data-agent-id");
          const propId = item.getAttribute("data-prop-id");
          if (modalNewChat) modalNewChat.style.display = "none";
          if (window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.getOrCreateConversation === "function") {
            const res = await window.NaijaHomesSupabase.getOrCreateConversation(agentId, propId);
            if (res && res.success && res.conversation) {
              await loadConversations();
              openConversation(res.conversation.id);
            }
          }
        });
      });
    }
    if (modalNewChat) modalNewChat.style.display = "flex";
  }

  if (btnNewMessage) btnNewMessage.addEventListener("click", openNewChatModal);
  if (btnEmptyStartChat) btnEmptyStartChat.addEventListener("click", openNewChatModal);
  if (closeNewChatModal && modalNewChat) {
    closeNewChatModal.addEventListener("click", () => {
      modalNewChat.style.display = "none";
    });
  }

  // Hook for homehaven.js login notification
  window.reloadMessagesPage = async () => {
    await resolveUser();
    await loadConversations();
    if (window.innerWidth >= 769 && state.conversations.length > 0 && !state.activeConvId) {
      openConversation(state.conversations[0].id);
    }
  };

  // 10. Initialization & URL Parameter Routing
  await resolveUser();
  await loadConversations();

  // Check URL parameters for direct property or agent messaging
  const urlParams = new URLSearchParams(window.location.search);
  const paramPropId = urlParams.get("id") || urlParams.get("propId");
  const paramAgentId = urlParams.get("agentId") || urlParams.get("userId");
  const paramConvId = urlParams.get("convId");

  if (paramConvId && state.conversations.some((c) => c.id === paramConvId)) {
    openConversation(paramConvId);
  } else if (state.currentUser && (paramPropId || paramAgentId)) {
    // If coming from a property page or agent profile
    let recipientId = paramAgentId;
    let propTitle = null;

    if (paramPropId && typeof window.getAllNaijaProperties === "function") {
      const allProps = window.getAllNaijaProperties();
      const matched = allProps.find((p) => p.id === paramPropId);
      if (matched) {
        recipientId = matched.agent?.id || matched.user_id || "agent-demo-id";
        propTitle = matched.title;
      }
    }

    if (recipientId && window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.getOrCreateConversation === "function") {
      const res = await window.NaijaHomesSupabase.getOrCreateConversation(recipientId, paramPropId || null);
      if (res && res.success && res.conversation) {
        await loadConversations();
        openConversation(res.conversation.id);
      }
    }
  } else if (window.innerWidth >= 769 && state.conversations.length > 0) {
    // On desktop, auto-open first conversation
    openConversation(state.conversations[0].id);
  }
});
