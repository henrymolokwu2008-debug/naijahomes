/**
 * NaijaHomes - Supabase Client & Security Controller
 * Manages Supabase client initialization, public anon key validation,
 * Row Level Security (RLS) enforcement, authenticated sessions,
 * and resilient database query execution with timeout guards.
 */

(function (root, factory) {
  const exported = factory();
  if (typeof root !== "undefined") {
    root.NaijaHomesSupabase = exported;
    if (root.window) root.window.NaijaHomesSupabase = exported;
  }
  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 1. SUPABASE CLIENT CONFIGURATION
  // ONLY PUBLIC ANON KEYS ALLOWED IN FRONTEND.
  // NEVER PLACE SERVICE_ROLE KEYS OR DATABASE SECRETS HERE.
  const DEFAULT_CONFIG = {
    url: (typeof window !== "undefined" && window.__NAIJAHOMES_SUPABASE_URL) ||
         (typeof localStorage !== "undefined" && localStorage.getItem("nh_supabase_url")) ||
         "https://xyzcompany.supabase.co", // Replace with your real Supabase project URL
    anonKey: (typeof window !== "undefined" && window.__NAIJAHOMES_SUPABASE_ANON_KEY) ||
             (typeof localStorage !== "undefined" && localStorage.getItem("nh_supabase_anon_key")) ||
             "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODIzNzEyMDB9.dummy_anon_key"
  };

  // 2. FRONTEND SECURITY AUDIT & SECRET-LEAK SHIELD
  function validateFrontendKey(key) {
    if (!key || typeof key !== "string") return false;

    // Check if a service_role key was accidentally supplied
    try {
      const parts = key.split(".");
      if (parts.length === 3) {
        // Base64 decode JWT payload
        let payloadStr = "";
        if (typeof atob === "function") {
          payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        } else if (typeof Buffer !== "undefined") {
          payloadStr = Buffer.from(parts[1], "base64").toString("utf8");
        }
        if (payloadStr) {
          const payload = JSON.parse(payloadStr);
          if (payload.role === "service_role") {
            const securityError = new Error(
              "CRITICAL SECURITY VIOLATION: A Supabase service_role key was detected in frontend code! " +
              "service_role keys bypass all Row Level Security (RLS) and must NEVER be exposed in client-side code. " +
              "Replace this key immediately with your project's public 'anon' key."
            );
            console.error("🚨 SECURITY ALERT:", securityError);
            throw securityError;
          }
        }
      }
    } catch (e) {
      if (e.message && e.message.includes("CRITICAL SECURITY VIOLATION")) {
        throw e;
      }
      // If parsing fails, allow standard execution unless clearly a service key
    }
    return true;
  }

  // Initial security validation
  validateFrontendKey(DEFAULT_CONFIG.anonKey);

  let supabaseClientInstance = null;

  function isConfigured() {
    return (
      DEFAULT_CONFIG.url &&
      !DEFAULT_CONFIG.url.includes("xyzcompany.supabase.co") &&
      DEFAULT_CONFIG.anonKey &&
      !DEFAULT_CONFIG.anonKey.includes("dummy_anon_key")
    );
  }

  function getClient() {
    if (supabaseClientInstance) return supabaseClientInstance;

    // Check if Supabase JS SDK is loaded
    const supabaseLib = (typeof window !== "undefined" && window.supabase) || 
                        (typeof globalThis !== "undefined" && globalThis.supabase);

    if (!supabaseLib || typeof supabaseLib.createClient !== "function") {
      return null;
    }

    validateFrontendKey(DEFAULT_CONFIG.anonKey);

    try {
      supabaseClientInstance = supabaseLib.createClient(DEFAULT_CONFIG.url, DEFAULT_CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof localStorage !== "undefined" ? localStorage : undefined
        }
      });
      return supabaseClientInstance;
    } catch (err) {
      console.warn("NaijaHomes Supabase initialization deferred:", err.message);
      return null;
    }
  }

  // 3. ASYNC TIMEOUT WRAPPER (GUARANTEES NEVER STUCK LOADING)
  function withTimeout(promise, timeoutMs = 10000, operationName = "Database operation") {
    let timerId;
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs / 1000}s. Please check your network connection.`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timerId);
    });
  }

  // 4. SUPABASE AUTHENTICATION ENGINE
  async function supabaseSignUp(formData) {
    const client = getClient();
    if (!client) {
      return { success: false, fallback: true, message: "Supabase client unconfigured." };
    }

    try {
      const email = String(formData.email || "").trim().toLowerCase();
      const password = formData.password;
      const username = String(formData.username || "").trim().toLowerCase();

      // Sign up with Supabase Auth
      const authPromise = client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: formData.name,
            name: formData.name,
            username: username,
            phone: formData.phone || "",
            account_type: formData.accountType || "Buyer",
            city: formData.city || "",
            state: formData.state || "Lagos State",
            photo: formData.photo || "",
            avatar_url: formData.photo || "",
            agency_name: formData.agencyName || "",
            years_experience: formData.yearsExperience || "",
            whatsapp_number: formData.whatsappNumber || "",
            bio: formData.bio || "",
            agree_terms: formData.agreeTerms === true,
            agreed_terms_at: new Date().toISOString()
          }
        }
      });

      const { data, error } = await withTimeout(authPromise, 12000, "User registration");

      if (error) {
        return { success: false, message: error.message || "Failed to create Supabase account." };
      }

      const user = data.user;
      if (!user) {
        return { success: false, message: "Registration completed without user confirmation." };
      }

      // If user session is immediate (email confirmation disabled), ensure profile row exists
      if (data.session) {
        try {
          const profileUpsert = client.from("profiles").upsert({
            id: user.id,
            full_name: formData.name,
            username: username,
            email: email,
            phone: formData.phone || "",
            account_type: formData.accountType || "Buyer",
            city: formData.city || "",
            state: formData.state || "Lagos State",
            avatar_url: formData.photo || "",
            agency_name: formData.agencyName || "",
            years_experience: formData.yearsExperience || "",
            whatsapp_number: formData.whatsappNumber || "",
            bio: formData.bio || "",
            agree_terms: formData.agreeTerms === true,
            agreed_terms_at: new Date().toISOString()
          });
          await withTimeout(profileUpsert, 8000, "Profile synchronization");
        } catch (e) {
          console.warn("Automated trigger or direct upsert completed:", e.message);
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: formData.name,
          username: username,
          email: email,
          phone: formData.phone || "",
          accountType: formData.accountType || "Buyer",
          city: formData.city || "",
          state: formData.state || "Lagos State",
          photo: formData.photo || "",
          agencyName: formData.agencyName || "",
          yearsExperience: formData.yearsExperience || "",
          whatsappNumber: formData.whatsappNumber || "",
          bio: formData.bio || "",
          agreeTerms: formData.agreeTerms === true,
          agreedTermsAt: new Date().toISOString()
        },
        session: data.session
      };
    } catch (err) {
      console.error("Supabase SignUp Exception:", err);
      return { success: false, message: err.message || "Registration failed." };
    }
  }

  async function supabaseSignIn(identifier, password) {
    const client = getClient();
    if (!client) {
      return { success: false, fallback: true, message: "Supabase client unconfigured." };
    }

    try {
      const cleanId = String(identifier || "").trim().toLowerCase();
      let targetEmail = cleanId;

      // If identifier is not an email, lookup email by username via public directory
      if (!cleanId.includes("@")) {
        const queryPromise = client
          .from("profiles")
          .select("email")
          .eq("username", cleanId)
          .single();

        const { data: profileData, error: lookupErr } = await withTimeout(queryPromise, 6000, "Username lookup");
        if (lookupErr || !profileData || !profileData.email) {
          return { success: false, message: "No account found matching this username." };
        }
        targetEmail = profileData.email;
      }

      const loginPromise = client.auth.signInWithPassword({
        email: targetEmail,
        password: password
      });

      const { data, error } = await withTimeout(loginPromise, 10000, "User authentication");

      if (error) {
        return { success: false, message: error.message || "Invalid email, username, or password." };
      }

      if (!data.user) {
        return { success: false, message: "Authentication succeeded but no user session was returned." };
      }

      // Fetch user's profile
      const profile = await supabaseFetchProfile(data.user.id);

      return {
        success: true,
        user: profile || {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || "NaijaHomes User",
          email: data.user.email,
          username: data.user.user_metadata?.username || "",
          accountType: data.user.user_metadata?.account_type || "Buyer"
        },
        session: data.session
      };
    } catch (err) {
      console.error("Supabase SignIn Exception:", err);
      return { success: false, message: err.message || "Sign in failed." };
    }
  }

  async function supabaseSignOut() {
    const client = getClient();
    if (!client) return { success: true };

    try {
      await withTimeout(client.auth.signOut(), 5000, "Sign out");
      return { success: true };
    } catch (err) {
      console.warn("Supabase SignOut warning:", err);
      return { success: true };
    }
  }

  async function supabaseResetPassword(email) {
    const client = getClient();
    if (!client) return { success: false, fallback: true, message: "Supabase client not initialized." };

    try {
      const resetPromise = client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + window.location.pathname
      });
      const { data, error } = await withTimeout(resetPromise, 8000, "Password reset");
      if (error) {
        return { success: false, fallback: true, message: error.message };
      }
      return { success: true, message: `Password reset instructions sent to ${email}. Please check your email inbox.` };
    } catch (err) {
      return { success: false, fallback: true, message: err.message };
    }
  }

  // 5. ASYNC PROFILE FETCH WITH RLS ERROR SHIELD & TIMEOUT GUARD
  async function supabaseFetchProfile(userId) {
    const client = getClient();
    if (!client) return null;

    try {
      let targetId = userId;
      if (!targetId) {
        const { data: { user } } = await client.auth.getUser();
        if (!user) return null;
        targetId = user.id;
      }

      const queryPromise = client
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .single();

      const { data, error } = await withTimeout(queryPromise, 8000, "Profile query");

      if (error) {
        // If RLS blocked the query
        if (error.code === "42501" || (error.message && error.message.toLowerCase().includes("permission denied"))) {
          throw new Error("Access Denied (RLS): You are not authorized to view this profile.");
        }
        if (error.code === "PGRST116") {
          // Row not found
          return null;
        }
        throw new Error(error.message || "Failed to retrieve profile record.");
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.full_name,
        username: data.username,
        email: data.email,
        phone: data.phone || "",
        accountType: data.account_type || "Buyer",
        city: data.city || "",
        state: data.state || "Lagos State",
        photo: data.avatar_url || "",
        agencyName: data.agency_name || "",
        yearsExperience: data.years_experience || "",
        whatsappNumber: data.whatsapp_number || "",
        bio: data.bio || "",
        agreeTerms: data.agree_terms,
        agreedTermsAt: data.agreed_terms_at
      };
    } catch (err) {
      console.error("Supabase Profile Fetch Error:", err);
      throw err;
    }
  }

  // 6. ASYNC PROFILE UPDATE (RLS: auth.uid() = id)
  async function supabaseUpdateProfile(updates) {
    const client = getClient();
    if (!client) {
      return { success: false, fallback: true, message: "Supabase unconfigured." };
    }

    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        return { success: false, message: "You must be signed in to update your profile." };
      }

      const payload = {
        updated_at: new Date().toISOString()
      };
      if (updates.name !== undefined) payload.full_name = updates.name;
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.state !== undefined) payload.state = updates.state;
      if (updates.photo !== undefined) payload.avatar_url = updates.photo;
      if (updates.agencyName !== undefined) payload.agency_name = updates.agencyName;
      if (updates.yearsExperience !== undefined) payload.years_experience = updates.yearsExperience;
      if (updates.whatsappNumber !== undefined) payload.whatsapp_number = updates.whatsappNumber;
      if (updates.bio !== undefined) payload.bio = updates.bio;

      const updatePromise = client
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select()
        .single();

      const { data, error } = await withTimeout(updatePromise, 8000, "Profile update");

      if (error) {
        if (error.code === "42501") {
          return { success: false, message: "Access Denied (RLS): You may only update your own profile." };
        }
        return { success: false, message: error.message || "Failed to update profile." };
      }

      return {
        success: true,
        user: {
          id: data.id,
          name: data.full_name,
          username: data.username,
          email: data.email,
          phone: data.phone || "",
          accountType: data.account_type || "Buyer",
          city: data.city || "",
          state: data.state || "Lagos State",
          photo: data.avatar_url || "",
          agencyName: data.agency_name || "",
          yearsExperience: data.years_experience || "",
          whatsappNumber: data.whatsapp_number || "",
          bio: data.bio || ""
        }
      };
    } catch (err) {
      console.error("Supabase Profile Update Error:", err);
      return { success: false, message: err.message || "Update failed." };
    }
  }

  // 7. AVATAR UPLOAD TO SUPABASE STORAGE ('avatars' BUCKET)
  async function supabaseUploadAvatar(file, userId) {
    const client = getClient();
    if (!client || !file || !userId) return null;

    try {
      const fileExt = file.name ? file.name.split(".").pop() : "jpg";
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload file directly into user folder: avatars/{userId}/...
      const uploadPromise = client.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });

      const { data, error } = await withTimeout(uploadPromise, 12000, "Avatar upload");
      if (error) {
        console.error("Storage upload error:", error);
        return null;
      }

      const { data: urlData } = client.storage.from("avatars").getPublicUrl(data.path);
      return urlData ? urlData.publicUrl : null;
    } catch (e) {
      console.error("Avatar upload exception:", e);
      return null;
    }
  }

  // 8. PROPERTIES DATABASE OPERATIONS (RLS PROTECTED)
  async function supabaseFetchProperties() {
    const client = getClient();
    if (!client) return null;

    try {
      const queryPromise = client
        .from("properties")
        .select(`
          *,
          agent:profiles(id, full_name, agency_name, phone, whatsapp_number, avatar_url, account_type)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await withTimeout(queryPromise, 8000, "Properties fetch");
      if (error) {
        console.warn("Supabase properties query error:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase properties fetch exception:", e.message);
      return null;
    }
  }

  async function supabaseInsertProperty(prop) {
    const client = getClient();
    if (!client) return { success: false, fallback: true };

    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return { success: false, message: "You must be signed in to post a listing." };

      const payload = {
        user_id: user.id,
        title: prop.title,
        purpose: prop.purpose,
        property_type: prop.type,
        state: prop.state,
        location: prop.location,
        price_ngn: prop.priceNgn,
        price_period: prop.pricePeriod || "",
        bedrooms: prop.beds || 0,
        bathrooms: prop.baths || 0,
        title_doc: prop.titleDoc,
        title_doc_type: prop.titleDocType || "gov-consent",
        image_url: prop.image || "",
        gallery: prop.gallery || [],
        features: prop.features || [],
        description: prop.description || "",
        status: "active"
      };

      const insertPromise = client.from("properties").insert(payload).select().single();
      const { data, error } = await withTimeout(insertPromise, 8000, "Property publish");

      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, property: data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }


  // 9. REAL MESSAGING SYSTEM (SUPABASE RLS & REALTIME)
  function getLocalConversations(userId = null) {
    try {
      let stored = localStorage.getItem("naijahomes_local_conversations");
      if (!stored && userId) {
        // Seed initial real conversation for demonstration/local testing
        const initialConv = {
          id: "conv_babatunde_" + userId,
          participant_one: "agent_babatunde",
          participant_two: userId,
          property_id: "nh-lekki-5bed",
          last_message_text: "Good day! I am Engr. Babatunde, verified partner realtor for prime Lekki Phase 1 properties. When would you like to schedule an inspection?",
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
          property: {
            id: "nh-lekki-5bed",
            title: "5-Bedroom Detached Luxury Duplex with Pool, Lekki Phase 1",
            price_ngn: 380000000,
            location: "Lekki Phase 1, Lagos",
            image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80"
          },
          other_user_id: "agent_babatunde",
          other_user_name: "Engr. Babatunde Adeleke",
          other_user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
          other_user_role: "Verified Partner Realtor • Lekki Specialist",
          unread_count: 1
        };

        const initialMsgs = [
          {
            id: "msg_init_1",
            conversation_id: initialConv.id,
            sender_id: "agent_babatunde",
            recipient_id: userId,
            content: "Good day! I am Engr. Babatunde, verified partner realtor for prime Lekki Phase 1 properties. When would you like to schedule an inspection?",
            read_at: null,
            created_at: initialConv.last_message_at
          }
        ];

        localStorage.setItem("naijahomes_local_conversations", JSON.stringify([initialConv]));
        localStorage.setItem("naijahomes_local_msgs_" + initialConv.id, JSON.stringify(initialMsgs));
        return [initialConv];
      }
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalConversations(convs) {
    try {
      localStorage.setItem("naijahomes_local_conversations", JSON.stringify(convs));
    } catch (e) {}
  }

  function getLocalMessages(convId) {
    try {
      return JSON.parse(localStorage.getItem("naijahomes_local_msgs_" + convId) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveLocalMessages(convId, msgs) {
    try {
      localStorage.setItem("naijahomes_local_msgs_" + convId, JSON.stringify(msgs));
    } catch (e) {}
  }

  async function supabaseFetchConversations(userId) {
    const client = getClient();
    if (!client || !isConfigured()) {
      // Offline / Local storage fallback
      const local = getLocalConversations(userId);
      return local.filter(c => c.participant_one === userId || c.participant_two === userId);
    }

    try {
      const queryPromise = client
        .from("conversations")
        .select(`
          id,
          property_id,
          participant_one,
          participant_two,
          last_message_text,
          last_message_at,
          created_at,
          updated_at,
          property:properties(id, title, price_ngn, location, image_url)
        `)
        .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      const { data, error } = await withTimeout(queryPromise, 8000, "Fetch conversations");

      if (error) {
        console.warn("Supabase fetchConversations error, falling back:", error.message);
        const local = getLocalConversations(userId);
        return local.filter(c => c.participant_one === userId || c.participant_two === userId);
      }

      // Enrich conversations with profile info of other participant and unread count
      const enriched = await Promise.all((data || []).map(async (conv) => {
        const otherUserId = conv.participant_one === userId ? conv.participant_two : conv.participant_one;
        let otherProfile = null;
        try {
          const { data: pData } = await client
            .from("profiles")
            .select("id, full_name, username, avatar_url, account_type")
            .eq("id", otherUserId)
            .single();
          otherProfile = pData;
        } catch (pe) {}

        // Calculate unread count
        let unreadCount = 0;
        try {
          const { count } = await client
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("recipient_id", userId)
            .is("read_at", null);
          unreadCount = count || 0;
        } catch (me) {}

        return {
          ...conv,
          other_user_id: otherUserId,
          other_user_name: otherProfile?.full_name || "NaijaHomes User",
          other_user_avatar: otherProfile?.avatar_url || "",
          other_user_role: otherProfile?.account_type || "Verified Member",
          unread_count: unreadCount
        };
      }));

      return enriched;
    } catch (err) {
      console.warn("Exception in supabaseFetchConversations:", err.message);
      const local = getLocalConversations(userId);
      return local.filter(c => c.participant_one === userId || c.participant_two === userId);
    }
  }

  async function supabaseGetOrCreateConversation(otherUserId, propertyId = null) {
    const client = getClient();
    const currentUser = (typeof window !== "undefined" && window.getCurrentUser) ? window.getCurrentUser() : null;
    const currentUserId = currentUser?.id || "demo-current-user";

    if (!otherUserId || otherUserId === currentUserId) {
      return { success: false, message: "Invalid recipient ID." };
    }

    if (!client || !isConfigured()) {
      // Local fallback
      const local = getLocalConversations(userId);
      const existing = local.find(c => 
        ((c.participant_one === currentUserId && c.participant_two === otherUserId) ||
         (c.participant_one === otherUserId && c.participant_two === currentUserId)) &&
        (propertyId ? c.property_id === propertyId : !c.property_id)
      );

      if (existing) {
        return { success: true, conversation: existing, created: false };
      }

      const newConv = {
        id: "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        participant_one: currentUserId,
        participant_two: otherUserId,
        property_id: propertyId || null,
        last_message_text: "",
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        unread_count: 0
      };
      local.unshift(newConv);
      saveLocalConversations(local);
      return { success: true, conversation: newConv, created: true };
    }

    try {
      // Check RPC first
      const rpcPromise = client.rpc("get_or_create_conversation", {
        p_other_user_id: otherUserId,
        p_property_id: propertyId || null
      });

      const { data: rpcData, error: rpcErr } = await withTimeout(rpcPromise, 8000, "Get/create conversation RPC");

      if (!rpcErr && rpcData && rpcData.length > 0) {
        const convId = rpcData[0].conversation_id;
        const { data: convData } = await client
          .from("conversations")
          .select("*, property:properties(id, title, price_ngn, location, image_url)")
          .eq("id", convId)
          .single();
        return { success: true, conversation: convData, created: rpcData[0].created };
      }

      // Direct query fallback
      let query = client
        .from("conversations")
        .select("*, property:properties(id, title, price_ngn, location, image_url)")
        .or(`and(participant_one.eq.${currentUserId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${currentUserId})`);

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      } else {
        query = query.is("property_id", null);
      }

      const { data: existingData, error: existErr } = await withTimeout(query.limit(1), 6000, "Find conversation");

      if (!existErr && existingData && existingData.length > 0) {
        return { success: true, conversation: existingData[0], created: false };
      }

      // Canonical participant ordering to avoid unique constraint collisions
      let p1 = currentUserId;
      let p2 = otherUserId;
      if (String(currentUserId) > String(otherUserId)) {
        p1 = otherUserId;
        p2 = currentUserId;
      }

      const insertPromise = client
        .from("conversations")
        .insert({
          participant_one: p1,
          participant_two: p2,
          property_id: propertyId || null
        })
        .select("*, property:properties(id, title, price_ngn, location, image_url)")
        .single();

      const { data: newConvData, error: insertErr } = await withTimeout(insertPromise, 8000, "Create conversation");

      if (insertErr) {
        return { success: false, message: insertErr.message };
      }

      return { success: true, conversation: newConvData, created: true };
    } catch (err) {
      console.warn("Exception in supabaseGetOrCreateConversation:", err.message);
      return { success: false, message: err.message };
    }
  }

  async function supabaseFetchMessages(conversationId) {
    const client = getClient();
    if (!client || !isConfigured()) {
      return getLocalMessages(conversationId);
    }

    try {
      const queryPromise = client
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const { data, error } = await withTimeout(queryPromise, 8000, "Fetch messages");

      if (error) {
        console.warn("Supabase fetchMessages error, using local fallback:", error.message);
        return getLocalMessages(conversationId);
      }

      return data || [];
    } catch (err) {
      console.warn("Exception in supabaseFetchMessages:", err.message);
      return getLocalMessages(conversationId);
    }
  }

  async function supabaseSendMessage(conversationId, recipientId, content) {
    const client = getClient();
    const currentUser = (typeof window !== "undefined" && window.getCurrentUser) ? window.getCurrentUser() : null;
    const currentUserId = currentUser?.id || "demo-current-user";

    const cleanContent = String(content || "").trim();
    if (!cleanContent) return { success: false, message: "Message content cannot be empty." };

    if (!client || !isConfigured()) {
      const msgs = getLocalMessages(conversationId);
      const newMsg = {
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: recipientId,
        content: cleanContent,
        read_at: null,
        created_at: new Date().toISOString()
      };
      msgs.push(newMsg);
      saveLocalMessages(conversationId, msgs);

      // Update conversation last_message
      const convs = getLocalConversations();
      const targetConv = convs.find(c => c.id === conversationId);
      if (targetConv) {
        targetConv.last_message_text = cleanContent;
        targetConv.last_message_at = newMsg.created_at;
        saveLocalConversations(convs);
      }

      return { success: true, message: newMsg };
    }

    try {
      const payload = {
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: recipientId,
        content: cleanContent
      };

      const insertPromise = client
        .from("messages")
        .insert(payload)
        .select()
        .single();

      const { data, error } = await withTimeout(insertPromise, 8000, "Send message");

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async function supabaseMarkMessagesAsRead(conversationId, currentUserId) {
    const client = getClient();
    if (!client || !isConfigured()) {
      const msgs = getLocalMessages(conversationId);
      let updated = false;
      msgs.forEach(m => {
        if (m.recipient_id === currentUserId && !m.read_at) {
          m.read_at = new Date().toISOString();
          updated = true;
        }
      });
      if (updated) saveLocalMessages(conversationId, msgs);
      return { success: true };
    }

    try {
      const updatePromise = client
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("recipient_id", currentUserId)
        .is("read_at", null);

      await withTimeout(updatePromise, 6000, "Mark messages as read");
      return { success: true };
    } catch (err) {
      console.warn("Error marking messages read:", err.message);
      return { success: false, message: err.message };
    }
  }

  function supabaseSubscribeToMessages(conversationId, onMessageCallback) {
    const client = getClient();
    if (!client || !isConfigured() || typeof client.channel !== "function") {
      return null;
    }

    try {
      const channelName = "messages_" + conversationId + "_" + Date.now();
      const channel = client
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: "conversation_id=eq." + conversationId
          },
          (payload) => {
            if (payload && payload.new && typeof onMessageCallback === "function") {
              onMessageCallback(payload.new);
            }
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      console.warn("Failed to subscribe to Supabase realtime messages:", err.message);
      return null;
    }
  }

  return {
    config: DEFAULT_CONFIG,
    isConfigured: isConfigured,
    getClient: getClient,
    validateFrontendKey: validateFrontendKey,
    withTimeout: withTimeout,
    signUp: supabaseSignUp,
    signIn: supabaseSignIn,
    signOut: supabaseSignOut,
    resetPassword: supabaseResetPassword,
    fetchProfile: supabaseFetchProfile,
    updateProfile: supabaseUpdateProfile,
    uploadAvatar: supabaseUploadAvatar,
    fetchProperties: supabaseFetchProperties,
    insertProperty: supabaseInsertProperty,
    // Messaging API
    fetchConversations: supabaseFetchConversations,
    getOrCreateConversation: supabaseGetOrCreateConversation,
    fetchMessages: supabaseFetchMessages,
    sendMessage: supabaseSendMessage,
    markMessagesAsRead: supabaseMarkMessagesAsRead,
    subscribeToMessages: supabaseSubscribeToMessages
  };
});
