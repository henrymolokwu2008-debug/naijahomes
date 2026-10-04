/**
 * NaijaHomes - Premier Nigerian Real Estate Platform Controller
 * Manages currency switching (₦ NGN / $ USD), property search & filtering,
 * interactive listing creation (Post a Property), inspection scheduling,
 * WhatsApp realtor connections, and interactive corridor map markers.
 */

function initNaijaHomesEngine() {
  // Path prefix detection
  const isSubfolder = window.location.pathname.includes("/pages/");
  const pathPrefix = isSubfolder ? "../" : "";

  // 1. Currency Management
  let currentCurrency = localStorage.getItem("nh_currency") || "NGN";
  const USD_RATE = 1500;

  function formatPrice(priceNgn, period = "") {
    if (!priceNgn && priceNgn !== 0) return "";
    if (currentCurrency === "USD") {
      const usdVal = Math.round(priceNgn / USD_RATE);
      return `$${usdVal.toLocaleString()}${period}`;
    } else {
      return `₦${Number(priceNgn).toLocaleString()}${period}`;
    }
  }
  window.formatPrice = formatPrice;

  function updateCurrencyUI() {
    const btnNgn = document.getElementById("btnNgn");
    const btnUsd = document.getElementById("btnUsd");
    if (btnNgn && btnUsd) {
      btnNgn.classList.toggle("active", currentCurrency === "NGN");
      btnUsd.classList.toggle("active", currentCurrency === "USD");
    }

    // Update all dynamic price elements with data-price-ngn
    document.querySelectorAll("[data-price-ngn]").forEach(el => {
      const ngnVal = parseFloat(el.getAttribute("data-price-ngn"));
      const period = el.getAttribute("data-price-period") || "";
      el.textContent = formatPrice(ngnVal, period);
    });
  }

  // Currency switcher events
  const btnNgn = document.getElementById("btnNgn");
  const btnUsd = document.getElementById("btnUsd");
  if (btnNgn) {
    btnNgn.addEventListener("click", () => {
      currentCurrency = "NGN";
      localStorage.setItem("nh_currency", "NGN");
      updateCurrencyUI();
      showNaijaToast("Currency switched to Nigerian Naira (₦)", "🇳🇬");
    });
  }
  if (btnUsd) {
    btnUsd.addEventListener("click", () => {
      currentCurrency = "USD";
      localStorage.setItem("nh_currency", "USD");
      updateCurrencyUI();
      showNaijaToast("Currency switched to US Dollars ($)", "💵");
    });
  }

  // 2. Toast Notification Helper
  function showNaijaToast(message, icon = "🏡") {
    let container = document.getElementById("nhToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "nhToastContainer";
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 24px;
      font-size: 0.85rem;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      border: 1px solid rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px)";
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
  window.showNaijaToast = showNaijaToast;

  // 3. Saved Properties Counter & Sync
  let savedProperties = JSON.parse(localStorage.getItem("nh_saved_properties") || "[]");

  function updateSavedCounter() {
    const badges = document.querySelectorAll(".hh-saved-counter-badge, .nh-saved-badge");
    badges.forEach(b => {
      b.textContent = savedProperties.length;
    });
  }

  function toggleSaveProperty(propId, btnElement) {
    const idx = savedProperties.indexOf(propId);
    if (idx > -1) {
      savedProperties.splice(idx, 1);
      if (btnElement) btnElement.classList.remove("active");
      showNaijaToast("Listing removed from your saved properties", "🗑️");
    } else {
      savedProperties.push(propId);
      if (btnElement) btnElement.classList.add("active");
      showNaijaToast("Listing saved to your portfolio", "❤️");
    }
    localStorage.setItem("nh_saved_properties", JSON.stringify(savedProperties));
    updateSavedCounter();
  }
  window.toggleSaveProperty = toggleSaveProperty;

  // 4. Client-Side Authentication Engine (Log In / Sign Up / Profile Session Management)
  function getNaijaUsers() {
    let users = [];

    // Helper to safely parse an array from localStorage
    function readStorageArray(key) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];
        return [];
      } catch (e) {
        return [];
      }
    }

    // 1. Read from primary storage key
    const primary = readStorageArray("naijahomes_users");
    users = users.concat(primary);

    // 2. Read from alternate/legacy keys if present
    const altKeys = ["nh_users", "users", "accounts", "naijahomes_accounts"];
    for (const k of altKeys) {
      const altUsers = readStorageArray(k);
      for (const u of altUsers) {
        if (u && typeof u === "object") {
          const uId = u.id;
          const uEmail = String(u.email || u.userEmail || u.user_email || "").trim().toLowerCase();
          const uUser = String(u.username || u.userName || u.user_name || "").trim().toLowerCase();
          const already = users.some(existing => {
            const exEmail = String(existing.email || existing.userEmail || existing.user_email || "").trim().toLowerCase();
            const exUser = String(existing.username || existing.userName || existing.user_name || "").trim().toLowerCase();
            return (uId && existing.id === uId) || (uEmail && exEmail === uEmail) || (uUser && exUser === uUser);
          });
          if (!already) users.push(u);
        }
      }
    }

    // 3. Check active session (naijahomes_current_user)
    try {
      const curRaw = localStorage.getItem("naijahomes_current_user");
      if (curRaw) {
        const curUser = JSON.parse(curRaw);
        if (curUser && typeof curUser === "object") {
          const cEmail = String(curUser.email || curUser.userEmail || curUser.user_email || "").trim().toLowerCase();
          const cUser = String(curUser.username || curUser.userName || curUser.user_name || "").trim().toLowerCase();
          const exists = users.some(existing => {
            const exEmail = String(existing.email || existing.userEmail || existing.user_email || "").trim().toLowerCase();
            const exUser = String(existing.username || existing.userName || existing.user_name || "").trim().toLowerCase();
            return (curUser.id && existing.id === curUser.id) || (cEmail && exEmail === cEmail) || (cUser && exUser === cUser);
          });
          if (!exists) {
            users.push(curUser);
          }
        }
      }
    } catch (e) {}

    // 4. Standardize all user objects with both canonical fields and aliases
    users = users.map(u => {
      if (!u || typeof u !== "object") return u;
      const email = String(u.email || u.userEmail || u.user_email || "").trim().toLowerCase();
      const username = String(u.username || u.userName || u.user_name || "").trim().toLowerCase();
      const phone = String(u.phone || u.phoneNumber || u.phone_number || u.userPhone || "").trim();
      const name = String(u.name || u.fullName || u.full_name || username || "User").trim();
      const password = u.password || u.userPassword || "";

      return {
        ...u,
        email: email || u.email || "",
        userEmail: email || u.userEmail || "",
        username: username || u.username || "",
        userName: username || u.userName || "",
        phone: phone || u.phone || "",
        phoneNumber: phone || u.phoneNumber || "",
        name: name,
        fullName: name,
        password: password,
        userPassword: password
      };
    });

    return users;
  }
  window.getNaijaUsers = getNaijaUsers;

  function saveNaijaUsers(users) {
    if (!Array.isArray(users)) return;
    try {
      localStorage.setItem("naijahomes_users", JSON.stringify(users));
      localStorage.setItem("nh_users", JSON.stringify(users));
    } catch (e) {
      console.error("Error saving users to localStorage:", e);
    }
  }
  window.saveNaijaUsers = saveNaijaUsers;

  function findUserAccount(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim().toLowerCase();
    if (!cleanId) return null;

    const users = getNaijaUsers();

    // 1. Check Email (case-insensitive, trimmed)
    let found = users.find(u => {
      const email = String(u.email || u.userEmail || u.user_email || "").trim().toLowerCase();
      return email && email === cleanId;
    });
    if (found) return found;

    // 2. Check Username (case-insensitive, trimmed)
    found = users.find(u => {
      const username = String(u.username || u.userName || u.user_name || "").trim().toLowerCase();
      return username && username === cleanId;
    });
    if (found) return found;

    // 3. Check Phone (normalized digits & Nigerian 234/0 country code compatibility)
    const idDigits = cleanId.replace(/\D/g, "");
    if (idDigits.length >= 7) {
      found = users.find(u => {
        const uPhoneDigits = String(u.phone || u.phoneNumber || u.phone_number || u.userPhone || "").replace(/\D/g, "");
        if (!uPhoneDigits || uPhoneDigits.length < 7) return false;
        if (uPhoneDigits === idDigits) return true;
        const d1 = uPhoneDigits.startsWith("234") ? uPhoneDigits.slice(3) : (uPhoneDigits.startsWith("0") ? uPhoneDigits.slice(1) : uPhoneDigits);
        const d2 = idDigits.startsWith("234") ? idDigits.slice(3) : (idDigits.startsWith("0") ? idDigits.slice(1) : idDigits);
        return d1 === d2;
      });
      if (found) return found;
    }

    // 4. Check ID (usr-...)
    found = users.find(u => u.id && String(u.id).trim().toLowerCase() === cleanId);
    if (found) return found;

    // 5. Fallback: check active session if available
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      const sEmail = String(sessionUser.email || sessionUser.userEmail || sessionUser.user_email || "").trim().toLowerCase();
      const sUser = String(sessionUser.username || sessionUser.userName || sessionUser.user_name || "").trim().toLowerCase();
      const sPhoneDigits = String(sessionUser.phone || sessionUser.phoneNumber || "").replace(/\D/g, "");
      if (sEmail && sEmail === cleanId) return sessionUser;
      if (sUser && sUser === cleanId) return sessionUser;
      if (idDigits.length >= 7 && sPhoneDigits) {
        const d1 = sPhoneDigits.startsWith("234") ? sPhoneDigits.slice(3) : (sPhoneDigits.startsWith("0") ? sPhoneDigits.slice(1) : sPhoneDigits);
        const d2 = idDigits.startsWith("234") ? idDigits.slice(3) : (idDigits.startsWith("0") ? idDigits.slice(1) : idDigits);
        if (d1 === d2) return sessionUser;
      }
    }

    return null;
  }
  window.findUserAccount = findUserAccount;

  function getCurrentUser() {
    if (window.__currentUser) return window.__currentUser;
    try {
      const raw = localStorage.getItem("naijahomes_current_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      window.__currentUser = parsed;
      return parsed;
    } catch (e) {
      console.error("Error retrieving current user from localStorage:", e);
      return null;
    }
  }
  window.getCurrentUser = getCurrentUser;

  function setCurrentUser(user) {
    window.__currentUser = user || null;
    try {
      if (user) {
        localStorage.setItem("naijahomes_current_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("naijahomes_current_user");
      }
    } catch (e) {
      console.error("Error persisting user session to localStorage:", e);
    }
    updateAuthUI();
    if (typeof window.loadUserProfile === "function") {
      window.loadUserProfile();
    } else if (typeof window.renderProfilePage === "function") {
      window.renderProfilePage();
    }
    if (typeof window.reloadMessagesPage === "function") {
      window.reloadMessagesPage();
    }
  }
  window.setCurrentUser = setCurrentUser;

  // Asynchronous Profile Query & Resolution API (Supabase RLS with Local Fallback)
  async function fetchUserProfile(identifier) {
    let targetId = identifier;
    if (!targetId) {
      const sessionUser = getCurrentUser();
      if (sessionUser) {
        targetId = sessionUser.id || sessionUser.email || sessionUser.username;
      }
    }

    // If unauthenticated guest session, cleanly resolve null
    if (!targetId) {
      return null;
    }

    // 1. If Supabase is configured, fetch verified profile from Supabase
    if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured()) {
      try {
        const sbProfile = await window.NaijaHomesSupabase.fetchProfile(targetId);
        if (sbProfile) {
          window.__currentUser = sbProfile;
          try {
            localStorage.setItem("naijahomes_current_user", JSON.stringify(sbProfile));
          } catch (e) {}
          return sbProfile;
        }
      } catch (sbErr) {
        console.error("Supabase Profile Fetch Error:", sbErr);
        // Propagate RLS access denied or critical database errors
        throw sbErr;
      }
    }

    // 2. Local fallback resolution
    const users = getNaijaUsers();
    const cleanTarget = String(targetId).trim().toLowerCase();
    let matched = users.find(u =>
      (u.id && String(u.id).toLowerCase() === cleanTarget) ||
      (u.email && u.email.toLowerCase() === cleanTarget) ||
      (u.username && u.username.toLowerCase() === cleanTarget)
    );

    if (!matched) {
      const sessionUser = getCurrentUser();
      if (sessionUser && (
        (sessionUser.id && String(sessionUser.id).toLowerCase() === cleanTarget) ||
        (sessionUser.email && sessionUser.email.toLowerCase() === cleanTarget) ||
        (sessionUser.username && sessionUser.username.toLowerCase() === cleanTarget)
      )) {
        matched = sessionUser;
      }
    }

    if (matched) {
      return matched;
    } else {
      throw new Error(`Profile not found for user "${targetId}". The account may have been removed or the session expired.`);
    }
  }
  window.fetchUserProfile = fetchUserProfile;

  function registerUser(data) {
    const users = getNaijaUsers();

    // 1. Full Name Validation
    const cleanName = (data.name || data.fullName || "").trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: "Please enter your full name." };
    }

    // 2. Username Validation
    const cleanUsername = (data.username || data.userName || "").trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: "Username must be at least 3 characters." };
    }
    if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
      return { success: false, message: "Username can only contain letters, numbers, underscores, and periods." };
    }

    // 3. Email Validation (case-insensitive & trimmed)
    const cleanEmail = (data.email || data.userEmail || "").trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: "Please provide a valid email address." };
    }

    // 4. Phone Validation
    const cleanPhone = (data.phone || data.phoneNumber || data.userPhone || "").trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      return { success: false, message: "Please provide a valid phone number." };
    }

    // 5. Password & Confirmation Validation
    const pass = data.password || data.userPassword || "";
    const confirmPass = data.confirmPassword || pass;
    if (!pass || pass.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long." };
    }
    if (pass !== confirmPass) {
      return { success: false, message: "Passwords do not match. Please verify both password fields." };
    }

    // 6. Account Type Validation
    const validAccountTypes = ["Buyer", "Tenant", "Agent", "Property Owner"];
    const accountType = validAccountTypes.includes(data.accountType) ? data.accountType : "Buyer";

    // 7. City and State Validation
    const cleanCity = (data.city || "").trim() || "Lagos";
    const cleanState = (data.state || "").trim() || "Lagos State";

    // 8. Check Uniqueness (Safe case-insensitive & trimmed)
    if (users.some(u => {
      const em = String(u.email || u.userEmail || u.user_email || "").trim().toLowerCase();
      return em && em === cleanEmail;
    })) {
      return { success: false, message: "An account with this email address already exists. Please log in." };
    }
    if (users.some(u => {
      const un = String(u.username || u.userName || u.user_name || "").trim().toLowerCase();
      return un && un === cleanUsername;
    })) {
      return { success: false, message: "This username is already taken. Please choose another username." };
    }

    // 9. Terms and Conditions validation
    if (data.agreeTerms === false) {
      return { success: false, message: "You must agree to the Terms & Conditions and Privacy Policy to create an account." };
    }

    const isAgentOrOwner = accountType === "Agent" || accountType === "Property Owner";

    const newUser = {
      id: "usr-" + Date.now(),
      name: cleanName,
      fullName: cleanName,
      username: cleanUsername,
      userName: cleanUsername,
      email: cleanEmail,
      userEmail: cleanEmail,
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      password: pass,
      userPassword: pass,
      accountType: accountType,
      role: accountType,
      city: cleanCity,
      state: cleanState,
      photo: data.photo || "",
      agencyName: isAgentOrOwner && data.agencyName ? data.agencyName.trim() : "",
      yearsExperience: isAgentOrOwner && data.yearsExperience ? data.yearsExperience.toString().trim() : "",
      whatsappNumber: isAgentOrOwner && data.whatsappNumber ? data.whatsappNumber.trim() : (data.whatsappNumber ? data.whatsappNumber.trim() : cleanPhone),
      bio: isAgentOrOwner && data.bio ? data.bio.trim() : "",
      agreeTerms: true,
      agreedTermsAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 10. Supabase Registration Integration (if configured)
    if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured()) {
      return (async () => {
        try {
          const sbRes = await window.NaijaHomesSupabase.signUp(data);
          if (sbRes.success && sbRes.user) {
            const mergedUser = { ...newUser, ...sbRes.user, password: pass, userPassword: pass };
            users.push(mergedUser);
            saveNaijaUsers(users);
            setCurrentUser(mergedUser);
            return { success: true, user: mergedUser };
          }
          if (!sbRes.fallback) {
            return { success: false, message: sbRes.message || "Registration failed." };
          }
        } catch (err) {
          console.warn("Supabase registration warning, falling back:", err);
        }
        users.push(newUser);
        saveNaijaUsers(users);
        setCurrentUser(newUser);
        return { success: true, user: newUser };
      })();
    }

    users.push(newUser);
    saveNaijaUsers(users);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  }
  window.registerUser = registerUser;

  function loginUser(identifier, password) {
    const cleanId = (identifier || "").trim().toLowerCase();

    if (!cleanId || !password) {
      return { success: false, message: "Please enter your email, phone, or username and password." };
    }

    // 1. Supabase Authentication Integration (if configured)
    if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured()) {
      return (async () => {
        try {
          const sbRes = await window.NaijaHomesSupabase.signIn(identifier, password);
          if (sbRes.success && sbRes.user) {
            const users = getNaijaUsers();
            const existsIdx = users.findIndex(u => u.id === sbRes.user.id || (u.email && u.email.toLowerCase() === sbRes.user.email.toLowerCase()));
            if (existsIdx > -1) {
              users[existsIdx] = { ...users[existsIdx], ...sbRes.user };
            } else {
              users.push(sbRes.user);
            }
            saveNaijaUsers(users);
            setCurrentUser(sbRes.user);
            return { success: true, user: sbRes.user };
          }
          if (!sbRes.fallback) {
            return { success: false, message: sbRes.message || "Invalid credentials." };
          }
        } catch (err) {
          console.warn("Supabase login warning, falling back:", err);
        }

        const matched = findUserAccount(cleanId);
        if (!matched) {
          return { success: false, message: "No account found with this email, phone, or username. Please sign up." };
        }
        if (matched.password !== password && matched.userPassword !== password) {
          return { success: false, message: "Incorrect password. Please verify and try again." };
        }
        setCurrentUser(matched);
        return { success: true, user: matched };
      })();
    }

    // 2. Local Fallback Authentication
    const matched = findUserAccount(cleanId);
    if (!matched) {
      return { success: false, message: "No account found with this email, phone, or username. Please sign up." };
    }
    if (matched.password !== password && matched.userPassword !== password) {
      return { success: false, message: "Incorrect password. Please verify and try again." };
    }

    setCurrentUser(matched);
    return { success: true, user: matched };
  }
  window.loginUser = loginUser;

  function resetUserPassword(identifier, newPassword) {
    if (!identifier) {
      return { success: false, message: "Please provide your email address, phone number, or username." };
    }
    const cleanId = String(identifier).trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: "Please provide your email address, phone number, or username." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const matched = findUserAccount(cleanId);
    if (!matched) {
      return { success: false, message: "No registered account found matching that email, phone, or username." };
    }

    const users = getNaijaUsers();
    const index = users.findIndex(u =>
      (matched.id && u.id === matched.id) ||
      (matched.email && String(u.email || u.userEmail || "").trim().toLowerCase() === String(matched.email).trim().toLowerCase())
    );

    if (index === -1) {
      matched.password = newPassword;
      matched.userPassword = newPassword;
      matched.updatedAt = new Date().toISOString();
      users.push(matched);
      saveNaijaUsers(users);
    } else {
      users[index].password = newPassword;
      users[index].userPassword = newPassword;
      users[index].updatedAt = new Date().toISOString();
      saveNaijaUsers(users);
    }

    // Also notify Supabase if configured and user has email
    if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured() && matched.email) {
      window.NaijaHomesSupabase.resetPassword(matched.email).catch(e => {
        console.warn("Supabase password reset notice:", e);
      });
    }

    const currentUser = getCurrentUser();
    if (currentUser && (
      (matched.id && currentUser.id === matched.id) ||
      (matched.email && String(currentUser.email || currentUser.userEmail || "").trim().toLowerCase() === String(matched.email).trim().toLowerCase())
    )) {
      currentUser.password = newPassword;
      currentUser.userPassword = newPassword;
      setCurrentUser(currentUser);
    }

    try {
      const remId = localStorage.getItem("naijahomes_remembered_identifier");
      if (remId && String(remId).trim().toLowerCase() === cleanId) {
        localStorage.setItem("naijahomes_remembered_password", newPassword);
      }
    } catch (e) {}

    return { success: true, user: matched, message: "Password updated successfully! You are now logged in." };
  }
  window.resetUserPassword = resetUserPassword;


  function logoutUser() {
    if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured()) {
      return (async () => {
        try {
          await window.NaijaHomesSupabase.signOut();
        } catch (e) {
          console.warn("Supabase signout notice:", e);
        }
        setCurrentUser(null);
        showNaijaToast("You have been logged out.", "👋");
        return { success: true };
      })();
    }
    setCurrentUser(null);
    showNaijaToast("You have been logged out.", "👋");
    return { success: true };
  }
  window.logoutUser = logoutUser;

  function applyLocalProfileUpdate(currentUser, updates) {
    const users = getNaijaUsers();
    const index = users.findIndex(u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (index === -1) {
      return { success: false, message: "User account not found." };
    }

    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (cleanUsername !== (currentUser.username || "").toLowerCase()) {
        if (!/^[a-z0-9_.]+$/.test(cleanUsername) || cleanUsername.length < 3) {
          return { success: false, message: "Username must be at least 3 characters and contain only letters, numbers, underscores, or periods." };
        }
        if (users.some((u, i) => i !== index && u.username && u.username.toLowerCase() === cleanUsername)) {
          return { success: false, message: "This username is already taken by another account." };
        }
        currentUser.username = cleanUsername;
      }
    }

    if (updates.name && updates.name.trim()) currentUser.name = updates.name.trim();
    if (updates.phone && updates.phone.trim()) currentUser.phone = updates.phone.trim();
    if (updates.city && updates.city.trim()) currentUser.city = updates.city.trim();
    if (updates.state && updates.state.trim()) currentUser.state = updates.state.trim();
    if (updates.photo !== undefined) currentUser.photo = updates.photo;
    if (updates.agencyName !== undefined) currentUser.agencyName = updates.agencyName.trim();
    if (updates.yearsExperience !== undefined) currentUser.yearsExperience = updates.yearsExperience.toString().trim();
    if (updates.whatsappNumber !== undefined) currentUser.whatsappNumber = updates.whatsappNumber.trim();
    if (updates.bio !== undefined) currentUser.bio = updates.bio.trim();
    currentUser.updatedAt = new Date().toISOString();

    users[index] = currentUser;
    saveNaijaUsers(users);
    setCurrentUser(currentUser);
    return { success: true, user: currentUser };
  }

  function updateUserProfile(updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile." };
    }

    // 1. Supabase Profile Update Integration (if configured)
    if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured()) {
      return (async () => {
        try {
          const sbRes = await window.NaijaHomesSupabase.updateProfile(updates);
          if (sbRes.success && sbRes.user) {
            setCurrentUser(sbRes.user);
            return { success: true, user: sbRes.user };
          }
          if (!sbRes.fallback) {
            return { success: false, message: sbRes.message || "Failed to update profile." };
          }
        } catch (e) {
          console.warn("Supabase update profile notice:", e);
        }
        return applyLocalProfileUpdate(currentUser, updates);
      })();
    }

    // 2. Local Fallback Profile Update
    return applyLocalProfileUpdate(currentUser, updates);
  }
  window.updateUserProfile = updateUserProfile;

  // Dynamically build and inject Auth Modal if not already on the page
  function ensureAuthModal() {
    if (document.getElementById("nhAuthModal")) return;

    const modal = document.createElement("div");
    modal.className = "nh-modal-overlay";
    modal.id = "nhAuthModal";
    modal.style.display = "none";

    let signupPhotoDataUrl = "";

    modal.innerHTML = `
      <div class="nh-auth-modal-card">
        <button type="button" class="nh-modal-close" id="closeAuthModal" style="position: absolute; top: 16px; right: 18px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;" aria-label="Close modal">&times;</button>
        
        <div style="text-align: center; margin-bottom: 18px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.25rem; color: #0f172a; margin-bottom: 4px;">
            <span>🏡</span> <span>NaijaHomes</span>
          </div>
          <p id="nhAuthSubtitle" style="font-size: 0.85rem; color: #64748b; margin: 0;">Access your verified Nigerian properties and profile dashboard</p>
        </div>

        <div class="nh-auth-tabs">
          <button type="button" class="nh-auth-tab-btn active" id="nhAuthTabLogin">Log In</button>
          <button type="button" class="nh-auth-tab-btn" id="nhAuthTabSignup">Sign Up</button>
        </div>

        <div id="nhAuthAlert" style="display: none; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 14px; line-height: 1.4;"></div>

        <!-- Log In Form -->
        <form id="nhLoginForm">
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div class="nh-form-group">
              <label class="nh-form-label" for="loginIdentifier">Email Address or Username *</label>
              <input type="text" id="loginIdentifier" class="nh-form-input" placeholder="Enter your email or username" required autocomplete="username">
            </div>
            <div class="nh-form-group">
              <label class="nh-form-label" for="loginPassword" style="margin-bottom: 4px;">Password *</label>
              <input type="password" id="loginPassword" class="nh-form-input" placeholder="Enter your password" required autocomplete="current-password">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -2px;">
              <label style="display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: #475569; cursor: pointer; user-select: none;">
                <input type="checkbox" id="loginRememberMe" checked style="width: 16px; height: 16px; accent-color: #008751; cursor: pointer; border-radius: 4px;">
                <span>Remember me</span>
              </label>
              <a href="javascript:void(0)" id="linkForgotPassword" class="nh-forgot-password-link" style="color: #008751; font-size: 0.8rem; font-weight: 700; text-decoration: none; cursor: pointer;">Forgot Password?</a>
            </div>
            <button type="submit" class="nh-form-submit" style="margin-top: 6px;">Log In to Account &rarr;</button>
          </div>
        </form>

        <!-- Forgot Password Form -->
        <form id="nhForgotForm" style="display: none;">
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="text-align: left; margin-bottom: 4px;">
              <a href="javascript:void(0)" id="linkBackToLoginFromForgot" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 700; color: #008751; text-decoration: none; margin-bottom: 10px; cursor: pointer;">
                &larr; Back to Log In
              </a>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Reset Your Password</h3>
              <p style="font-size: 0.82rem; color: #64748b; margin: 0; line-height: 1.45;">Enter your registered Nigerian email, phone number, or username to recover your account.</p>
            </div>

            <div id="nhForgotStep1">
              <div class="nh-form-group">
                <label class="nh-form-label" for="forgotIdentifier">Email, Phone, or Username *</label>
                <input type="text" id="forgotIdentifier" class="nh-form-input" placeholder="e.g. name@example.com or username" autocomplete="username">
              </div>
              <button type="button" id="btnForgotVerifyAccount" class="nh-form-submit" style="margin-top: 10px;">Find Account &rarr;</button>
            </div>

            <div id="nhForgotStep2" style="display: none;">
              <div id="nhForgotUserInfo" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 12px; font-size: 0.82rem; color: #166534; margin-bottom: 12px;">
                Account verified: <strong id="nhForgotFoundName">User</strong>
              </div>
              <div class="nh-form-group" style="margin-bottom: 12px;">
                <label class="nh-form-label" for="forgotNewPassword">New Password *</label>
                <input type="password" id="forgotNewPassword" class="nh-form-input" placeholder="Min 6 characters" minlength="6" autocomplete="new-password">
              </div>
              <div class="nh-form-group" style="margin-bottom: 12px;">
                <label class="nh-form-label" for="forgotConfirmPassword">Confirm New Password *</label>
                <input type="password" id="forgotConfirmPassword" class="nh-form-input" placeholder="Repeat new password" minlength="6" autocomplete="new-password">
              </div>
              <button type="submit" id="btnForgotSubmitReset" class="nh-form-submit" style="margin-top: 6px;">Reset Password &amp; Log In &rarr;</button>
            </div>
          </div>
        </form>

        <!-- Sign Up Form -->
        <form id="nhSignupForm" style="display: none;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            
            <div class="nh-auth-grid-2">
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupFullName">Full Name *</label>
                <input type="text" id="signupFullName" class="nh-form-input" placeholder="e.g. Babatunde Adeleke" required>
              </div>
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupUsername">Username *</label>
                <input type="text" id="signupUsername" class="nh-form-input" placeholder="e.g. tunde_homes" required autocomplete="username">
              </div>
            </div>

            <div class="nh-auth-grid-2">
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupEmail">Email Address *</label>
                <input type="email" id="signupEmail" class="nh-form-input" placeholder="name@example.com" required autocomplete="email">
              </div>
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupPhone">Phone Number *</label>
                <input type="tel" id="signupPhone" class="nh-form-input" placeholder="e.g. +234 803 123 4567" required autocomplete="tel">
              </div>
            </div>

            <div class="nh-form-group">
              <label class="nh-form-label" for="signupAccountType">Account Type *</label>
              <select id="signupAccountType" class="nh-form-select" required>
                <option value="Buyer">Buyer</option>
                <option value="Tenant">Tenant</option>
                <option value="Agent">Agent</option>
                <option value="Property Owner">Property Owner</option>
              </select>
            </div>

            <div class="nh-auth-grid-2">
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupCity">City *</label>
                <input type="text" id="signupCity" class="nh-form-input" placeholder="e.g. Lekki / Ikeja" required>
              </div>
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupState">State *</label>
                <select id="signupState" class="nh-form-select" required>
                  <option value="Lagos State" selected>Lagos State</option>
                  <option value="Abuja FCT">Abuja FCT</option>
                  <option value="Rivers State">Rivers State (Port Harcourt)</option>
                  <option value="Oyo State">Oyo State (Ibadan)</option>
                  <option value="Ogun State">Ogun State (Abeokuta)</option>
                  <option value="Enugu State">Enugu State</option>
                  <option value="Delta State">Delta State (Warri/Asaba)</option>
                  <option value="Edo State">Edo State (Benin City)</option>
                  <option value="Anambra State">Anambra State</option>
                  <option value="Kano State">Kano State</option>
                  <option value="Kaduna State">Kaduna State</option>
                  <option value="Akwa Ibom State">Akwa Ibom State</option>
                  <option value="Imo State">Imo State</option>
                  <option value="Kwara State">Kwara State</option>
                  <option value="Plateau State">Plateau State</option>
                  <option value="Other State">Other Nigerian State</option>
                </select>
              </div>
            </div>

            <div class="nh-auth-grid-2">
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupPassword">Password *</label>
                <input type="password" id="signupPassword" class="nh-form-input" placeholder="Min 6 characters" minlength="6" required autocomplete="new-password">
              </div>
              <div class="nh-form-group">
                <label class="nh-form-label" for="signupConfirmPassword">Confirm Password *</label>
                <input type="password" id="signupConfirmPassword" class="nh-form-input" placeholder="Repeat password" minlength="6" required autocomplete="new-password">
              </div>
            </div>

            <!-- Profile Picture (Optional) -->
            <div class="nh-form-group">
              <div class="nh-avatar-uploader-box">
                <img id="signupPhotoPreview" class="nh-avatar-preview-img" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e2e8f0'/><circle cx='50' cy='40' r='18' fill='%2394a3b8'/><path d='M22 84 C26 62 40 60 50 60 C60 60 74 62 78 84 Z' fill='%2394a3b8'/></svg>" alt="Avatar Preview">
                <div style="flex: 1; min-width: 0;">
                  <label class="nh-form-label" for="signupPhotoFile" style="margin-bottom: 2px;">Profile Picture (Optional)</label>
                  <input type="file" id="signupPhotoFile" accept="image/*" class="nh-form-input" style="padding: 4px 8px; font-size: 0.8rem;">
                  <button type="button" id="btnRemoveSignupPhoto" style="display: none; background: none; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; font-weight: 700; margin-top: 4px; padding: 0;">✕ Remove Photo</button>
                </div>
              </div>
            </div>

            <!-- Conditional Agent & Property Owner Fields -->
            <div id="signupAgentFieldsContainer" style="display: none;" class="nh-conditional-fields-card">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
                <span style="font-size: 1.1rem;">💼</span>
                <span style="font-size: 0.82rem; font-weight: 800; color: #008751; text-transform: uppercase; letter-spacing: 0.5px;">Agent &amp; Property Owner Profile Details</span>
              </div>

              <div class="nh-auth-grid-2">
                <div class="nh-form-group">
                  <label class="nh-form-label" for="signupAgencyName">Agency / Business Name</label>
                  <input type="text" id="signupAgencyName" class="nh-form-input" placeholder="e.g. Prime Vantage Realty">
                </div>
                <div class="nh-form-group">
                  <label class="nh-form-label" for="signupExperience">Years of Experience</label>
                  <input type="number" id="signupExperience" class="nh-form-input" placeholder="e.g. 5" min="0" max="60">
                </div>
              </div>

              <div class="nh-form-group" style="margin-top: 10px;">
                <label class="nh-form-label" for="signupWhatsapp">WhatsApp Business Number</label>
                <input type="tel" id="signupWhatsapp" class="nh-form-input" placeholder="e.g. +234 802 345 6789">
              </div>

              <div class="nh-form-group" style="margin-top: 10px;">
                <label class="nh-form-label" for="signupBio">Professional Bio</label>
                <textarea id="signupBio" class="nh-form-input" rows="2" style="resize: vertical; font-family: inherit;" placeholder="Brief overview of your property portfolio, corridor specialties, and experience..."></textarea>
              </div>
            </div>

            <!-- Terms & Conditions Checkbox -->
            <div class="nh-form-group" style="margin: 12px 0 6px;">
              <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.82rem; color: #475569; cursor: pointer; line-height: 1.45;">
                <input type="checkbox" id="signupAgreeTerms" required style="margin-top: 2px; accent-color: #008751; cursor: pointer; width: 17px; height: 17px; flex-shrink: 0;">
                <span>I agree to the <a href="javascript:void(0)" id="linkViewTerms" style="color: #008751; font-weight: 700; text-decoration: underline;">Terms &amp; Conditions</a> and <a href="javascript:void(0)" id="linkViewPrivacy" style="color: #008751; font-weight: 700; text-decoration: underline;">Privacy Policy</a> of NaijaHomes.</span>
              </label>
            </div>

            <button type="submit" class="nh-form-submit" style="margin-top: 6px;">Create Free Account &rarr;</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup modal event listeners
    const closeBtn = document.getElementById("closeAuthModal");
    const tabLogin = document.getElementById("nhAuthTabLogin");
    const tabSignup = document.getElementById("nhAuthTabSignup");
    const formLogin = document.getElementById("nhLoginForm");
    const formSignup = document.getElementById("nhSignupForm");
    const authAlert = document.getElementById("nhAuthAlert");
    const signupAccountType = document.getElementById("signupAccountType");
    const signupAgentFieldsContainer = document.getElementById("signupAgentFieldsContainer");
    const signupPhotoFile = document.getElementById("signupPhotoFile");
    const signupPhotoPreview = document.getElementById("signupPhotoPreview");
    const btnRemoveSignupPhoto = document.getElementById("btnRemoveSignupPhoto");
    const linkViewTerms = document.getElementById("linkViewTerms");
    const linkViewPrivacy = document.getElementById("linkViewPrivacy");

    const defaultAvatarSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e2e8f0'/><circle cx='50' cy='40' r='18' fill='%2394a3b8'/><path d='M22 84 C26 62 40 60 50 60 C60 60 74 62 78 84 Z' fill='%2394a3b8'/></svg>";

    function showAlert(msg, isSuccess = false) {
      if (!authAlert) return;
      authAlert.style.display = "block";
      authAlert.style.background = isSuccess ? "#ecfdf5" : "#fef2f2";
      authAlert.style.color = isSuccess ? "#065f46" : "#991b1b";
      authAlert.style.border = `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`;
      authAlert.textContent = msg;
    }

    function clearAlert() {
      if (!authAlert) return;
      authAlert.style.display = "none";
      authAlert.textContent = "";
    }

    // Toggle conditional fields for Agent / Property Owner
    if (signupAccountType && signupAgentFieldsContainer) {
      signupAccountType.addEventListener("change", () => {
        const val = signupAccountType.value;
        if (val === "Agent" || val === "Property Owner") {
          signupAgentFieldsContainer.style.display = "block";
        } else {
          signupAgentFieldsContainer.style.display = "none";
        }
      });
    }

    // Photo file upload preview
    if (signupPhotoFile && signupPhotoPreview) {
      signupPhotoFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            showAlert("Photo size is too large (maximum 2MB). Please select a smaller photo.");
            signupPhotoFile.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = (evt) => {
            signupPhotoDataUrl = evt.target.result;
            signupPhotoPreview.src = signupPhotoDataUrl;
            if (btnRemoveSignupPhoto) btnRemoveSignupPhoto.style.display = "inline-block";
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (btnRemoveSignupPhoto && signupPhotoPreview && signupPhotoFile) {
      btnRemoveSignupPhoto.addEventListener("click", () => {
        signupPhotoDataUrl = "";
        signupPhotoFile.value = "";
        signupPhotoPreview.src = defaultAvatarSvg;
        btnRemoveSignupPhoto.style.display = "none";
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        clearAlert();
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        clearAlert();
      }
    });

    
    const linkForgot = document.getElementById("linkForgotPassword");
    const linkBackForgot = document.getElementById("linkBackToLoginFromForgot");
    const formForgot = document.getElementById("nhForgotForm");
    const btnForgotVerify = document.getElementById("btnForgotVerifyAccount");
    const forgotIdentifier = document.getElementById("forgotIdentifier");
    const forgotStep1 = document.getElementById("nhForgotStep1");
    const forgotStep2 = document.getElementById("nhForgotStep2");
    const forgotFoundName = document.getElementById("nhForgotFoundName");

    if (linkForgot) {
      linkForgot.addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal("forgot");
      });
    }

    if (linkBackForgot) {
      linkBackForgot.addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal("login");
      });
    }

    if (forgotIdentifier) {
      forgotIdentifier.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (btnForgotVerify) btnForgotVerify.click();
        }
      });
    }

    if (btnForgotVerify) {
      btnForgotVerify.addEventListener("click", () => {
        clearAlert();
        const idVal = forgotIdentifier ? forgotIdentifier.value.trim().toLowerCase() : "";
        if (!idVal) {
          showAlert("Please enter your registered email address, phone number, or username.");
          if (forgotIdentifier) forgotIdentifier.focus();
          return;
        }

        const matched = findUserAccount(idVal);

        if (!matched) {
          if (typeof window !== "undefined" && window.NaijaHomesSupabase && window.NaijaHomesSupabase.isConfigured() && idVal.includes("@")) {
            btnForgotVerify.disabled = true;
            btnForgotVerify.textContent = "Sending Reset Link...";
            window.NaijaHomesSupabase.resetPassword(idVal).then(res => {
              btnForgotVerify.disabled = false;
              btnForgotVerify.textContent = "Find Account →";
              if (res.success) {
                showAlert("Password reset email sent to " + idVal + "! Check your inbox.", true);
              } else {
                showAlert(res.message || "No account found with this email. Please check spelling or sign up.", false);
              }
            });
            return;
          }
          showAlert("No registered account found with that email, phone, or username. Please check your spelling or sign up for a free account.", false);
          return;
        }

        if (forgotFoundName) {
          forgotFoundName.textContent = (matched.name || matched.fullName || "User") + " (" + (matched.email || matched.userEmail || matched.username || matched.userName) + ")";
        }
        if (forgotStep1) forgotStep1.style.display = "none";
        if (forgotStep2) forgotStep2.style.display = "block";
        const newPassInput = document.getElementById("forgotNewPassword");
        if (newPassInput) newPassInput.focus();
      });
    }

    if (formForgot) {
      formForgot.addEventListener("submit", (e) => {
        e.preventDefault();
        clearAlert();

        // If on step 1, trigger account verification
        if (forgotStep1 && forgotStep1.style.display !== "none") {
          if (btnForgotVerify) btnForgotVerify.click();
          return;
        }

        const idVal = forgotIdentifier ? forgotIdentifier.value.trim() : "";
        const newPass = document.getElementById("forgotNewPassword") ? document.getElementById("forgotNewPassword").value : "";
        const confirmPass = document.getElementById("forgotConfirmPassword") ? document.getElementById("forgotConfirmPassword").value : "";

        if (!newPass || newPass.length < 6) {
          showAlert("New password must be at least 6 characters long.");
          return;
        }
        if (newPass !== confirmPass) {
          showAlert("Passwords do not match. Please ensure both passwords match.");
          return;
        }

        const res = resetUserPassword(idVal, newPass);
        if (res.success) {
          formForgot.reset();
          if (forgotStep1) forgotStep1.style.display = "block";
          if (forgotStep2) forgotStep2.style.display = "none";
          modal.style.display = "none";
          showNaijaToast("Password updated successfully! Welcome back!", "🎉");
          updateAuthUI();

          const currentPath = (window.location.pathname || "").toLowerCase();
          const isOnProfilePage = currentPath.endsWith("profile.html") || currentPath.endsWith("profile");
          if (isOnProfilePage) {
            if (typeof window.loadUserProfile === "function") {
              window.loadUserProfile();
            } else if (typeof window.renderProfilePage === "function") {
              window.renderProfilePage();
            }
          }
        } else {
          showAlert(res.message, false);
        }
      });
    }
  
    if (tabLogin && tabSignup && formLogin && formSignup) {
      tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("active");
        tabSignup.classList.remove("active");
        formLogin.style.display = "block";
        formSignup.style.display = "none";
        clearAlert();

        // If login identifier is blank, populate with what user entered in signup or remembered credentials
        const loginIdInput = document.getElementById("loginIdentifier");
        const loginPassInput = document.getElementById("loginPassword");
        const signupEmailVal = document.getElementById("signupEmail") ? document.getElementById("signupEmail").value.trim() : "";
        const signupUserVal = document.getElementById("signupUsername") ? document.getElementById("signupUsername").value.trim() : "";
        const signupPassVal = document.getElementById("signupPassword") ? document.getElementById("signupPassword").value : "";

        if (loginIdInput && !loginIdInput.value) {
          loginIdInput.value = signupEmailVal || signupUserVal || localStorage.getItem("naijahomes_remembered_identifier") || "";
        }
        if (loginPassInput && !loginPassInput.value) {
          loginPassInput.value = signupPassVal || localStorage.getItem("naijahomes_remembered_password") || "";
        }
      });

      tabSignup.addEventListener("click", () => {
        tabSignup.classList.add("active");
        tabLogin.classList.remove("active");
        formSignup.style.display = "block";
        formLogin.style.display = "none";
        clearAlert();
      });
    }

    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();
        const submitBtn = formLogin.querySelector("button[type='submit']");
        const origBtnText = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Signing In...";
        }

        try {
          const identifier = document.getElementById("loginIdentifier").value.trim();
          const pass = document.getElementById("loginPassword").value;
          const rememberCheck = document.getElementById("loginRememberMe");
          const shouldRemember = rememberCheck ? rememberCheck.checked : true;

          const result = await loginUser(identifier, pass);
          if (result.success) {
            if (shouldRemember) {
              try {
                localStorage.setItem("naijahomes_remembered_identifier", identifier);
                localStorage.setItem("naijahomes_remembered_password", pass);
                localStorage.setItem("naijahomes_remember_me", "true");
              } catch (e) {}
            } else {
              try {
                localStorage.removeItem("naijahomes_remembered_identifier");
                localStorage.removeItem("naijahomes_remembered_password");
                localStorage.setItem("naijahomes_remember_me", "false");
              } catch (e) {}
            }
            formLogin.reset();
            modal.style.display = "none";
            showNaijaToast(`Welcome back, ${result.user.name}!`, "👋");
            
            const currentPath = (window.location.pathname || "").toLowerCase();
            const isOnProfilePage = currentPath.endsWith("profile.html") || currentPath.endsWith("profile");

            if (isOnProfilePage) {
              updateAuthUI();
              if (typeof window.loadUserProfile === "function") {
                window.loadUserProfile();
              } else if (typeof window.renderProfilePage === "function") {
                window.renderProfilePage();
              }
            } else {
              setTimeout(() => {
                window.location.href = `${pathPrefix}profile.html`;
              }, 300);
            }
          } else {
            showAlert(result.message, false);
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origBtnText;
          }
        }
      });
    }

    if (linkViewTerms) {
      linkViewTerms.addEventListener("click", (e) => {
        e.preventDefault();
        openTermsModal();
      });
    }

    if (linkViewPrivacy) {
      linkViewPrivacy.addEventListener("click", (e) => {
        e.preventDefault();
        openTermsModal();
      });
    }

    if (formSignup) {
      formSignup.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();

        const agreeCheckbox = document.getElementById("signupAgreeTerms");
        if (agreeCheckbox && !agreeCheckbox.checked) {
          showAlert("You must agree to the Terms & Conditions and Privacy Policy to create an account.");
          return;
        }

        const submitBtn = formSignup.querySelector("button[type='submit']");
        const origBtnText = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Creating Account...";
        }

        try {
          const signupData = {
            name: document.getElementById("signupFullName").value,
            username: document.getElementById("signupUsername").value,
            email: document.getElementById("signupEmail").value,
            phone: document.getElementById("signupPhone").value,
            accountType: document.getElementById("signupAccountType").value,
            city: document.getElementById("signupCity").value,
            state: document.getElementById("signupState").value,
            password: document.getElementById("signupPassword").value,
            confirmPassword: document.getElementById("signupConfirmPassword").value,
            photo: signupPhotoDataUrl,
            agencyName: document.getElementById("signupAgencyName") ? document.getElementById("signupAgencyName").value : "",
            yearsExperience: document.getElementById("signupExperience") ? document.getElementById("signupExperience").value : "",
            whatsappNumber: document.getElementById("signupWhatsapp") ? document.getElementById("signupWhatsapp").value : "",
            bio: document.getElementById("signupBio") ? document.getElementById("signupBio").value : "",
            agreeTerms: agreeCheckbox ? agreeCheckbox.checked : false
          };

          const result = await registerUser(signupData);
          if (result.success) {
            // Remember user login details upon sign up
            const registeredIdentifier = signupData.email || signupData.username || signupData.phone;
            try {
              localStorage.setItem("naijahomes_remembered_identifier", registeredIdentifier);
              if (signupData.password) {
                localStorage.setItem("naijahomes_remembered_password", signupData.password);
              }
              localStorage.setItem("naijahomes_remember_me", "true");

              // Immediately pre-fill login inputs
              const loginIdEl = document.getElementById("loginIdentifier");
              const loginPassEl = document.getElementById("loginPassword");
              if (loginIdEl) loginIdEl.value = registeredIdentifier;
              if (loginPassEl && signupData.password) loginPassEl.value = signupData.password;

              const pageLoginIdEl = document.getElementById("pageLoginIdentifier");
              const pageLoginPassEl = document.getElementById("pageLoginPassword");
              if (pageLoginIdEl) pageLoginIdEl.value = registeredIdentifier;
              if (pageLoginPassEl && signupData.password) pageLoginPassEl.value = signupData.password;
            } catch (e) {
              console.warn("Could not save remembered credentials:", e);
            }

            formSignup.reset();
            if (agreeCheckbox) agreeCheckbox.checked = false;
            signupPhotoDataUrl = "";
            if (signupPhotoPreview) signupPhotoPreview.src = defaultAvatarSvg;
            if (btnRemoveSignupPhoto) btnRemoveSignupPhoto.style.display = "none";
            modal.style.display = "none";
            showNaijaToast(`Account created! Welcome to NaijaHomes, ${result.user.name}!`, "🎉");

            const currentPath = (window.location.pathname || "").toLowerCase();
            const isOnProfilePage = currentPath.endsWith("profile.html") || currentPath.endsWith("profile");

            if (isOnProfilePage) {
              updateAuthUI();
              if (typeof window.loadUserProfile === "function") {
                window.loadUserProfile();
              } else if (typeof window.renderProfilePage === "function") {
                window.renderProfilePage();
              }
            } else {
              setTimeout(() => {
                window.location.href = `${pathPrefix}profile.html`;
              }, 300);
            }
          } else {
            showAlert(result.message, false);
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origBtnText;
          }
        }
      });
    }
  }

  // Dynamically build and inject Terms & Conditions Modal
  function ensureTermsModal() {
    let modal = document.getElementById("nhTermsModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "nh-modal-overlay";
    modal.id = "nhTermsModal";
    modal.style.display = "none";
    modal.style.zIndex = "100010";

    modal.innerHTML = `
      <div class="nh-terms-modal-card">
        <button type="button" class="nh-modal-close" id="closeTermsModal" style="position: absolute; top: 16px; right: 18px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;" aria-label="Close terms modal">&times;</button>
        
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 1.8rem;">📜</span>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">NaijaHomes Terms &amp; Conditions</h2>
            <p style="font-size: 0.82rem; color: #64748b; margin: 2px 0 0;">Platform rules, Nigerian property compliance &amp; user privacy</p>
          </div>
        </div>

        <div class="nh-terms-body">
          <h3>1. Nigerian Land Use Act &amp; Title Verification</h3>
          <p>All property listings on NaijaHomes are subject to the Land Use Act of 1978. Agents and property owners certify that land and housing listings possess genuine documentation, including but not limited to Certificate of Occupancy (C of O), Governor's Consent, Gazette, or registered Deed of Assignment.</p>

          <h3>2. Free Physical Inspections &amp; Anti-Fraud Guarantee</h3>
          <p>NaijaHomes strictly prohibits upfront inspection fees without verified appointments. Users must never make deposits or payments prior to physically inspecting the property and conducting legal title searches at the relevant State Ministry of Lands.</p>

          <h3>3. Accurate Listing Data &amp; Agent Representation</h3>
          <p>Agents and property owners agree to provide true, current pricing in Nigerian Naira (₦), accurate room specifications, and authentic photos of properties located within Nigeria. Misleading listings will be removed immediately and accounts terminated.</p>

          <h3>4. User Safety &amp; Fair Communications</h3>
          <p>NaijaHomes provides direct WhatsApp and phone channels to facilitate legitimate transactions. Users agree to communicate respectfully and report any suspicious behavior, extortion, or fraudulent representations immediately.</p>

          <h3>5. Privacy Policy &amp; Data Protection (NDPA)</h3>
          <p>We respect your privacy in accordance with the Nigeria Data Protection Act (NDPA). Your personal contact details (phone, email, WhatsApp) are stored securely and utilized solely for authentication, notifications, and connecting verified buyers, tenants, and real estate professionals.</p>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px;">
          <button type="button" id="btnAcceptTerms" class="nh-form-submit" style="width: auto; padding: 10px 22px; margin: 0; font-size: 0.9rem;">I Understand &amp; Agree to Terms</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById("closeTermsModal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });

    const acceptBtn = document.getElementById("btnAcceptTerms");
    if (acceptBtn) {
      acceptBtn.addEventListener("click", () => {
        const agreeCheckbox = document.getElementById("signupAgreeTerms");
        if (agreeCheckbox) {
          agreeCheckbox.checked = true;
        }
        const authAlert = document.getElementById("nhAuthAlert");
        if (authAlert && authAlert.textContent.includes("Terms & Conditions")) {
          authAlert.style.display = "none";
          authAlert.textContent = "";
        }
        modal.style.display = "none";
      });
    }

    return modal;
  }

  function openTermsModal() {
    const modal = ensureTermsModal();
    if (modal) modal.style.display = "flex";
  }
  window.openTermsModal = openTermsModal;

  function openAuthModal(defaultTab = "login") {
    ensureAuthModal();
    const modal = document.getElementById("nhAuthModal");
    const tabsContainer = modal ? modal.querySelector(".nh-auth-tabs") : null;
    const tabLogin = document.getElementById("nhAuthTabLogin");
    const tabSignup = document.getElementById("nhAuthTabSignup");
    const formLogin = document.getElementById("nhLoginForm");
    const formSignup = document.getElementById("nhSignupForm");
    const formForgot = document.getElementById("nhForgotForm");
    const authAlert = document.getElementById("nhAuthAlert");
    const authSubtitle = document.getElementById("nhAuthSubtitle");

    if (authAlert) authAlert.style.display = "none";

    // Auto-populate remembered user details in login form
    try {
      const savedLoginId = localStorage.getItem("naijahomes_remembered_identifier") || "";
      const savedLoginPass = localStorage.getItem("naijahomes_remembered_password") || "";
      const savedRememberMe = localStorage.getItem("naijahomes_remember_me") !== "false";
      const loginIdEl = document.getElementById("loginIdentifier");
      const loginPassEl = document.getElementById("loginPassword");
      const rememberMeEl = document.getElementById("loginRememberMe");
      if (loginIdEl && savedLoginId && !loginIdEl.value) loginIdEl.value = savedLoginId;
      if (loginPassEl && savedLoginPass && !loginPassEl.value) loginPassEl.value = savedLoginPass;
      if (rememberMeEl) rememberMeEl.checked = savedRememberMe;
    } catch (e) {}

    if (defaultTab === "signup") {
      if (tabsContainer) tabsContainer.style.display = "grid";
      if (tabSignup) tabSignup.classList.add("active");
      if (tabLogin) tabLogin.classList.remove("active");
      if (formSignup) formSignup.style.display = "block";
      if (formLogin) formLogin.style.display = "none";
      if (formForgot) formForgot.style.display = "none";
      if (authSubtitle) authSubtitle.textContent = "Create your free verified Nigerian account";
    } else if (defaultTab === "forgot") {
      if (tabsContainer) tabsContainer.style.display = "none";
      if (formSignup) formSignup.style.display = "none";
      if (formLogin) formLogin.style.display = "none";
      if (formForgot) formForgot.style.display = "block";
      const step1 = document.getElementById("nhForgotStep1");
      const step2 = document.getElementById("nhForgotStep2");
      if (step1) step1.style.display = "block";
      if (step2) step2.style.display = "none";
      if (authSubtitle) authSubtitle.textContent = "Recover your NaijaHomes account credentials";

      // Pre-fill forgot identifier if available
      try {
        const forgotInput = document.getElementById("forgotIdentifier");
        const loginIdInput = document.getElementById("loginIdentifier");
        const signupEmailInput = document.getElementById("signupEmail");
        const rememberedId = localStorage.getItem("naijahomes_remembered_identifier") || "";
        if (forgotInput && !forgotInput.value) {
          forgotInput.value = (loginIdInput && loginIdInput.value) || 
                              (signupEmailInput && signupEmailInput.value) || 
                              rememberedId || "";
        }
      } catch (e) {}
    } else {
      if (tabsContainer) tabsContainer.style.display = "grid";
      if (tabLogin) tabLogin.classList.add("active");
      if (tabSignup) tabSignup.classList.remove("active");
      if (formLogin) formLogin.style.display = "block";
      if (formSignup) formSignup.style.display = "none";
      if (formForgot) formForgot.style.display = "none";
      if (authSubtitle) authSubtitle.textContent = "Access your verified Nigerian properties and profile dashboard";
    }

    if (modal) modal.style.display = "flex";
  }
  window.openAuthModal = openAuthModal;

  function updateAuthUI() {
    const containers = document.querySelectorAll(".nh-auth-container, #nhAuthContainer");
    if (!containers || containers.length === 0) return;

    const user = getCurrentUser();
    const profileHref = `${pathPrefix}profile.html`;

    containers.forEach(container => {
      if (user) {
        const initial = (user.name || "U").charAt(0).toUpperCase();
        const firstName = user.name.split(" ")[0];
        const avatarHtml = user.photo
          ? `<span class="nh-user-avatar-badge" style="overflow: hidden; padding: 0;"><img src="${user.photo}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;"></span>`
          : `<span class="nh-user-avatar-badge">${initial}</span>`;

        container.innerHTML = `
          <div class="nh-user-session-pill">
            <a href="${profileHref}" class="nh-user-profile-link" title="My Profile (${user.name})">
              ${avatarHtml}
              <span class="nh-user-name">${firstName}</span>
            </a>
            <button type="button" class="nh-btn-logout-mini" id="nhBtnLogout" title="Log Out">Log Out</button>
          </div>
        `;

        const logoutBtn = container.querySelector("#nhBtnLogout");
        if (logoutBtn) {
          logoutBtn.onclick = (e) => {
            e.preventDefault();
            logoutUser();
          };
        }
      } else {
        container.innerHTML = `
          <button type="button" class="nh-btn-login" id="nhBtnLoginTrigger">Log In</button>
          <button type="button" class="nh-btn-signup" id="nhBtnSignupTrigger">Sign Up</button>
        `;

        const btnLogin = container.querySelector("#nhBtnLoginTrigger");
        const btnSignup = container.querySelector("#nhBtnSignupTrigger");
        if (btnLogin) {
          btnLogin.onclick = (e) => {
            e.preventDefault();
            openAuthModal("login");
          };
        }
        if (btnSignup) {
          btnSignup.onclick = (e) => {
            e.preventDefault();
            openAuthModal("signup");
          };
        }
      }
    });
  }
  window.updateAuthUI = updateAuthUI;

  // 5. Interactive "Post a Property / Sell" Modal Engine
  const btnOpenSell = document.getElementById("btnOpenSell");
  const sellModal = document.getElementById("nhSellModal");
  const closeSellModal = document.getElementById("closeSellModal");
  const sellForm = document.getElementById("nhSellForm");
  const sellImageFile = document.getElementById("sellImageFile");
  const sellImagePreview = document.getElementById("sellImagePreview");
  const sellImagePreviewWrap = document.getElementById("sellImagePreviewWrap");
  const sellImageFileName = document.getElementById("sellImageFileName");
  const btnRemoveSellImage = document.getElementById("btnRemoveSellImage");
  const sellImageUrlInput = document.getElementById("sellImageUrl");

  let uploadedPropertyDataUrl = "";

  if (sellImageFile) {
    sellImageFile.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 8 * 1024 * 1024) {
          showNaijaToast("Image size is too large (maximum 8MB). Please choose a smaller photo.", "⚠️");
          sellImageFile.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          uploadedPropertyDataUrl = evt.target.result;
          if (sellImageUrlInput) sellImageUrlInput.value = uploadedPropertyDataUrl;
          if (sellImagePreview) sellImagePreview.src = uploadedPropertyDataUrl;
          if (sellImageFileName) sellImageFileName.textContent = file.name;
          if (sellImagePreviewWrap) sellImagePreviewWrap.style.display = "flex";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnRemoveSellImage) {
    btnRemoveSellImage.addEventListener("click", () => {
      uploadedPropertyDataUrl = "";
      if (sellImageFile) sellImageFile.value = "";
      if (sellImageUrlInput) sellImageUrlInput.value = "";
      if (sellImagePreview) sellImagePreview.src = "";
      if (sellImagePreviewWrap) sellImagePreviewWrap.style.display = "none";
    });
  }

  if (btnOpenSell && sellModal) {
    btnOpenSell.addEventListener("click", () => {
      sellModal.style.display = "flex";
    });
  }

  if (closeSellModal && sellModal) {
    closeSellModal.addEventListener("click", () => {
      sellModal.style.display = "none";
    });
  }

  // Close modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === sellModal) {
      sellModal.style.display = "none";
    }
    const inspModal = document.getElementById("nhInspectionModal");
    if (e.target === inspModal) {
      inspModal.style.display = "none";
    }
  });

  if (sellForm) {
    sellForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("sellTitle").value;
      const purpose = document.getElementById("sellPurpose").value;
      const type = document.getElementById("sellType").value;
      const location = document.getElementById("sellLocation").value;
      const state = document.getElementById("sellState").value;
      const priceNgn = parseFloat(document.getElementById("sellPrice").value) || 0;
      const bedrooms = parseInt(document.getElementById("sellBeds").value) || 0;
      const bathrooms = parseInt(document.getElementById("sellBaths").value) || 0;
      const titleDoc = document.getElementById("sellTitleDoc").value;
      let uploadedCloudUrl = null;
      const fileToUpload = sellImageFile && sellImageFile.files && sellImageFile.files[0];
      const currentUser = getCurrentUser();
      if (fileToUpload && currentUser && currentUser.id && window.NaijaHomesSupabase && typeof window.NaijaHomesSupabase.uploadPropertyImage === "function" && window.NaijaHomesSupabase.isConfigured()) {
        try {
          uploadedCloudUrl = await window.NaijaHomesSupabase.uploadPropertyImage(fileToUpload, currentUser.id);
        } catch (ue) {
          console.warn("Cloud upload deferred, using data URL:", ue);
        }
      }
      const rawImageUrl = uploadedCloudUrl || uploadedPropertyDataUrl || (document.getElementById("sellImageUrl") ? document.getElementById("sellImageUrl").value.trim() : "");

      // Clean SVG placeholder if no image URL provided
      const defaultPlaceholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%2394a3b8' font-size='22' font-family='system-ui,sans-serif' text-anchor='middle' dominant-baseline='middle'%3EProperty Photo Pending%3C/text%3E%3C/svg%3E";
      const imageUrl = rawImageUrl || defaultPlaceholderSvg;

      const newListing = {
        id: `nh-user-${Date.now()}`,
        userId: currentUser ? currentUser.id : null,
        title,
        purpose,
        type,
        categoryLabel: type.charAt(0).toUpperCase() + type.slice(1),
        priceNgn,
        priceFormattedNgn: `₦${priceNgn.toLocaleString()}`,
        pricePeriod: purpose === "rent" ? "/yr" : (purpose === "shortlet" ? "/night" : ""),
        state,
        location,
        landmark: location,
        bedrooms,
        bathrooms,
        parking: 2,
        landSize: "Standard Plot",
        hasBq: false,
        powerSupply: "Estate Power",
        verified: false,
        titleDoc,
        titleDocType: "gov-consent",
        featured: false,
        badge: "USER LISTING",
        image: imageUrl,
        gallery: [imageUrl],
        features: [
          `Title: ${titleDoc}`,
          "Direct Listing",
          "Inspection on Request"
        ],
        description: `Property situated in ${location}, ${state}. Documentation: ${titleDoc}.`,
        agent: {
          name: currentUser ? currentUser.name : "Property Owner",
          company: currentUser && currentUser.role ? currentUser.role : "Direct Owner",
          phone: currentUser && currentUser.phone ? currentUser.phone : "Contact available on inquiry",
          whatsapp: currentUser && currentUser.phone ? currentUser.phone.replace(/[^0-9]/g, "") : "",
          email: currentUser ? currentUser.email : "",
          avatar: "",
          verified: false
        }
      };

      // Save to localStorage
      const userListings = JSON.parse(localStorage.getItem("naijahomes_user_listings") || "[]");
      userListings.unshift(newListing);
      localStorage.setItem("naijahomes_user_listings", JSON.stringify(userListings));

      // Reset form and close modal
      sellForm.reset();
      uploadedPropertyDataUrl = "";
      if (sellImagePreviewWrap) sellImagePreviewWrap.style.display = "none";
      if (sellImagePreview) sellImagePreview.src = "";
      sellModal.style.display = "none";

      showNaijaToast("Listing published successfully! It is now live on NaijaHomes.", "🎉");

      // Re-render properties grid if present on page
      if (typeof renderNaijaGrid === "function") {
        renderNaijaGrid();
      }
      if (typeof window.renderProfilePage === "function") {
        window.renderProfilePage();
      }
    });
  }

  // 6. Physical Inspection Booking Modal
  const inspModal = document.getElementById("nhInspectionModal");
  const closeInspModal = document.getElementById("closeInspModal");
  const inspForm = document.getElementById("nhInspectionForm");

  if (closeInspModal && inspModal) {
    closeInspModal.addEventListener("click", () => {
      inspModal.style.display = "none";
    });
  }

  if (inspForm && inspModal) {
    inspForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("inspName").value;
      const phone = document.getElementById("inspPhone").value;
      const date = document.getElementById("inspDate").value;
      const propTitle = document.getElementById("inspPropertyTitle") ? document.getElementById("inspPropertyTitle").textContent : "Selected Nigerian Property";

      try {
        const inspections = JSON.parse(localStorage.getItem("naijahomes_inspections") || "[]");
        inspections.unshift({
          id: `insp-${Date.now()}`,
          name,
          phone,
          date,
          property: propTitle,
          status: "Confirmed",
          coordinator: "Engr. Babatunde Alabi (Lead Inspection Coordinator)",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("naijahomes_inspections", JSON.stringify(inspections));
      } catch (err) {
        console.warn("Storage error for inspection:", err);
      }

      inspModal.style.display = "none";
      inspForm.reset();

      showNaijaToast(`Free inspection confirmed for ${name} on ${date}! Coordinator assigned.`, "📅");
    });
  }

  function openInspectionModal(propertyTitle) {
    if (inspModal) {
      const titleSpan = document.getElementById("inspPropertyTitle");
      if (titleSpan) titleSpan.textContent = propertyTitle || "Selected Property";
      inspModal.style.display = "flex";
    }
  }
  window.openInspectionModal = openInspectionModal;

  // 7. WhatsApp Launcher
  function chatWhatsApp(phone, propTitle) {
    if (!phone) {
      showNaijaToast("No WhatsApp contact available for this listing.", "ℹ️");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      showNaijaToast("No valid WhatsApp number provided.", "ℹ️");
      return;
    }
    const msg = encodeURIComponent(`Hello! I am inquiring about "${propTitle}" on NaijaHomes. Is it available for physical inspection?`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  }
  window.chatWhatsApp = chatWhatsApp;

  // 8. Authentic Nigerian Land & Property Title Verification Guide Engine
  const TITLE_GUIDES = {
    "consent": {
      title: "Governor's Consent Verification Guide",
      docName: "Governor's Consent",
      badge: "SECTION 22, NIGERIAN LAND USE ACT 1978",
      legalSummary: "Under Section 22 of the Land Use Act of 1978, whenever a property with an existing Certificate of Occupancy or recognized root title is assigned, sold, or transferred to a new buyer, the formal consent of the State Governor is legally mandatory to validate the transaction.",
      whyItMatters: "Without Governor's Consent, the transfer remains inchoate in law. A verified Governor's Consent confers indisputable legal title, allows clean registration at the Lands Registry, and makes the property 100% eligible for commercial bank mortgages and institutional financing.",
      checklist: [
        "Deed of Assignment Review: Confirms the assignor has valid root title and legal capacity to convey.",
        "Charting at Lagos Lands Bureau (Alausa): GPS beacons are charted to confirm the parcel is outside committed government acquisition.",
        "Directorate of Land Services Assessment: Official stamp duties and capital gains taxes assessed and paid into state treasury.",
        "Official Registry Endorsement: Endorsement stamp, volume number, and page archived in the state land records."
      ],
      filterQuery: "Governor's Consent"
    },
    "c-of-o": {
      title: "Certificate of Occupancy (C of O) Guide",
      docName: "Certificate of Occupancy",
      badge: "PRIMARY 99-YEAR STATUTORY TITLE",
      legalSummary: "A Certificate of Occupancy (C of O) is the primary root title issued directly by a State Governor (or the Minister of the FCT in Abuja), granting statutory right of occupancy for a 99-year term to the named individual, family, or corporation.",
      whyItMatters: "A C of O is one of the highest and cleanest land documents in Nigeria. It supersedes traditional customary claims, preventing disputes with original landowners ('Omo-Onile').",
      checklist: [
        "Docket Registry Search: Pulling the physical and electronic land docket at Alausa (Lagos) or AGIS (Abuja).",
        "Survey Beacon Validation: Matching beacon coordinates on the survey against the master cadastral grid to prevent overlapping allocations.",
        "Gazette Publication Cross-Check: Confirming that the original acquisition and excision were legally gazetted.",
        "Non-Revocation Certification: Verifying that the C of O has never been revoked for public overriding interest or non-compliance."
      ],
      filterQuery: "C of O"
    },
    "charting": {
      title: "Lagos Lands Bureau (Alausa) Charting Guide",
      docName: "Land Charting & Cadastral Verification",
      badge: "SURVEYOR GENERAL'S OFFICE • GEOSPATIAL VALIDATION",
      legalSummary: "Land Charting is the technical verification process where a registered surveyor's GPS coordinates are plotted onto the official Lagos State Cadastral Composite Map at the Surveyor General's Office in Alausa, Ikeja.",
      whyItMatters: "Charting determines whether land is 'Free' or 'Committed Acquisition' (earmarked for expressways, drainage canals, high-tension right-of-way, or agricultural reserves). Buying unchartered land carries high risk of government demolition.",
      checklist: [
        "High-Precision GNSS Coordinates: Capturing 4-point GPS beacon coordinates on-site with certified surveying instruments.",
        "Alausa LIS Database Plotting: Plotting coordinates into the Lagos Information System database.",
        "Information Certificate: Issuance of an official charting report confirming excision, scheme approval, or free status.",
        "Red Line Buffer Checks: Confirming required setbacks from coastal routes, water bodies, and state infrastructure corridors."
      ],
      filterQuery: "all"
    },
    "agis": {
      title: "AGIS Abuja (FCDA) Cadastral Verification Guide",
      docName: "AGIS Abuja Search",
      badge: "FEDERAL CAPITAL TERRITORY CADASTRAL ARCHIVE",
      legalSummary: "Abuja Geographic Information Systems (AGIS) is the centralized computerized repository for all spatial, legal, and title records pertaining to real estate in the Federal Capital Territory (Abuja FCT).",
      whyItMatters: "In Abuja, transactions without an AGIS legal search expose buyers to counterfeit allocation letters or irregular area council papers. A certified AGIS search guarantees the FCDA file is authentic, active, and free from litigation.",
      checklist: [
        "Formal Legal Search: Submitting an attorney-backed search application at AGIS Peace House, Cadastral Zone, Abuja.",
        "File & Allocation Audit: Inspecting the original allocation file, Right of Occupancy (R of O), and ministerial consent.",
        "Statutory Dues Verification: Confirming all ground rents, development levies, and AGIS processing charges are fully up to date.",
        "Encumbrance Status: Ensuring no registered mortgages, lis pendens (court lawsuits), or caveats exist on the plot."
      ],
      filterQuery: "C of O"
    },
    "gazette": {
      title: "Excision & Official Gazette Verification Guide",
      docName: "Excision & Official Gazette",
      badge: "COMMUNITY LAND EXCISION • 100% FREE FROM OMO-ONILE HASSLES",
      legalSummary: "An Excision is an official government proclamation releasing a portion of customary land back to an indigenous host community. When approved by the state executive council, it is legally published in the State Government Official Gazette.",
      whyItMatters: "Gazetted land is 100% legal, documented by the state government, and permanently immune from family ownership disputes ('Omo-Onile'). Buyers of gazetted land can safely proceed to obtain Governor's Consent directly.",
      checklist: [
        "Gazette Publication Audit: Verifying the specific Gazette Volume, Number, and Page in the government archives.",
        "Perimeter Survey Reconciliation: Confirming the exact plot boundary falls squarely inside the excised coordinates.",
        "Accredited Family Signatures: Verifying the executing community leaders (Baale, accredited elders) have registered power of attorney.",
        "Physical Beacon Allocation: Ensuring immediate physical allocation with numbered, registered survey beacons."
      ],
      filterQuery: "Gazette"
    }
  };

  function openTitleGuide(guideKey) {
    const key = guideKey || "consent";
    const data = TITLE_GUIDES[key] || TITLE_GUIDES["consent"];

    let modal = document.getElementById("nhTitleGuideModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "nhTitleGuideModal";
      modal.className = "nh-modal-overlay";
      modal.style.cssText = "display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); z-index: 99999; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px);";
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    }

    const isSub = window.location.pathname.includes("/pages/");
    const expUrl = isSub ? "explore.html" : "explore.html";

    modal.innerHTML = `
      <div class="nh-modal-card" style="max-width: 680px; width: 100%; max-height: 90vh; overflow-y: auto; background: #ffffff; border-radius: 24px; padding: 32px 28px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); position: relative; border: 1px solid #e2e8f0;">
        <button type="button" class="nh-modal-close" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569;" onclick="document.getElementById('nhTitleGuideModal').style.display='none';">&times;</button>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 1.4rem;">📜</span>
          <span style="background: #ecfdf5; color: #008751; font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;">${data.badge}</span>
        </div>

        <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 16px;">${data.title}</h2>

        <!-- Interactive Tabs -->
        <div style="display: flex; gap: 6px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
          <button type="button" onclick="openTitleGuide('consent')" style="padding: 6px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; ${key === 'consent' ? 'background: #008751; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}">Governor's Consent</button>
          <button type="button" onclick="openTitleGuide('c-of-o')" style="padding: 6px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; ${key === 'c-of-o' ? 'background: #008751; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}">C of O</button>
          <button type="button" onclick="openTitleGuide('charting')" style="padding: 6px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; ${key === 'charting' ? 'background: #008751; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}">Alausa Charting</button>
          <button type="button" onclick="openTitleGuide('agis')" style="padding: 6px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; ${key === 'agis' ? 'background: #008751; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}">AGIS Abuja</button>
          <button type="button" onclick="openTitleGuide('gazette')" style="padding: 6px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; ${key === 'gazette' ? 'background: #008751; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}">Excision & Gazette</button>
        </div>

        <!-- Guide Body -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.9rem; font-weight: 800; color: #008751; text-transform: uppercase; margin: 0 0 6px;">Legal Framework & Background</h4>
          <p style="font-size: 0.9rem; color: #334155; line-height: 1.6; margin: 0 0 14px;">${data.legalSummary}</p>

          <h4 style="font-size: 0.9rem; font-weight: 800; color: #008751; text-transform: uppercase; margin: 0 0 6px;">Why This Title Matters to Buyers & Diaspora</h4>
          <p style="font-size: 0.9rem; color: #334155; line-height: 1.6; margin: 0 0 18px;">${data.whyItMatters}</p>

          <h4 style="font-size: 0.9rem; font-weight: 800; color: #0f172a; margin: 0 0 10px;">NaijaHomes 4-Step Verification Checklist:</h4>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; margin-bottom: 24px;">
            ${data.checklist.map(item => `
              <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 0.85rem; color: #475569; line-height: 1.5;">
                <span style="color: #008751; font-weight: 800; flex-shrink: 0;">✓</span>
                <span>${item}</span>
              </div>
            `).join('')}
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="${expUrl}?titleDoc=${encodeURIComponent(data.filterQuery)}" style="flex: 1; text-align: center; background: #008751; color: #ffffff; padding: 12px 20px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 0.88rem; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <span>Browse ${data.docName} Listings</span> &rarr;
            </a>
            <button type="button" onclick="chatWhatsApp('2348032458891', 'Legal Verification Inquiry regarding ' + '${data.docName}')" style="background: #25d366; color: #ffffff; border: none; padding: 12px 18px; border-radius: 12px; font-weight: 800; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <span>💬 Free Legal Consultation</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.style.display = "flex";
  }
  window.openTitleGuide = openTitleGuide;


  // 7. Interactive Corridor Map Logic
  const mapMarkers = document.querySelectorAll(".hh-map-pin");
  const mapCardTitle = document.getElementById("hhMapCardTitle");
  const mapCardPrice = document.getElementById("hhMapCardPrice");
  const mapCardLoc = document.getElementById("hhMapCardLoc");
  const mapCardImg = document.getElementById("hhMapCardImg");
  const mapCardLink = document.getElementById("hhMapCardLink");

  mapMarkers.forEach(pin => {
    pin.addEventListener("click", () => {
      mapMarkers.forEach(p => p.classList.remove("active"));
      pin.classList.add("active");

      const title = pin.getAttribute("data-title");
      const priceNgn = pin.getAttribute("data-price");
      const loc = pin.getAttribute("data-location");
      const img = pin.getAttribute("data-img");
      const link = pin.getAttribute("data-link");

      if (mapCardTitle) mapCardTitle.textContent = title;
      if (mapCardLoc) mapCardLoc.textContent = loc;
      if (mapCardImg) mapCardImg.src = img;
      if (mapCardLink) mapCardLink.href = link;
      if (mapCardPrice) {
        mapCardPrice.setAttribute("data-price-ngn", priceNgn);
        mapCardPrice.textContent = formatPrice(parseFloat(priceNgn));
      }
    });
  });

  // 8. Responsive Mobile Navigation Hamburger Controller
  const mobileMenuBtn = document.getElementById("nhMobileMenuBtn");
  const headerBanner = document.querySelector(".hh-global-banner, .nh-header");

  if (mobileMenuBtn && headerBanner) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = headerBanner.classList.toggle("mobile-menu-open");
      mobileMenuBtn.classList.toggle("active", isOpen);
      mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!headerBanner.contains(e.target)) {
        headerBanner.classList.remove("mobile-menu-open");
        mobileMenuBtn.classList.remove("active");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Close when clicking any nav link
    const navLinks = headerBanner.querySelectorAll(".hh-nav-link, .nh-nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        headerBanner.classList.remove("mobile-menu-open");
        mobileMenuBtn.classList.remove("active");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 9. Mobile Bottom Tab Bar Sync
  function syncBottomTabBar() {
    const tabbar = document.querySelector(".hh-bottom-tabbar");
    if (!tabbar) return;

    const path = window.location.pathname.toLowerCase();
    const tabLinks = tabbar.querySelectorAll(".hh-tab-item");
    tabLinks.forEach(item => {
      const href = item.getAttribute("href") || "";
      const cleanHref = href.replace("../", "").split("?")[0].toLowerCase();
      
      const isHome = (cleanHref === "index.html" || cleanHref === "") && (path.endsWith("index.html") || path.endsWith("/") || !path.includes(".html"));
      const isExplore = cleanHref === "explore.html" && path.includes("explore.html");
      const isSaved = cleanHref === "saved.html" && path.includes("saved.html");
      const isMessages = cleanHref === "messages.html" && path.includes("messages.html");
      const isProfile = cleanHref === "profile.html" && path.includes("profile.html");

      if (isHome || isExplore || isSaved || isMessages || isProfile) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
  syncBottomTabBar();

  // Initial runs
  updateCurrencyUI();
  updateSavedCounter();
  ensureAuthModal();
  updateAuthUI();
}

// Resilient initialization: execute immediately if DOM is ready, or on DOMContentLoaded
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNaijaHomesEngine);
  } else {
    initNaijaHomesEngine();
  }
}
