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

  return {
    config: DEFAULT_CONFIG,
    isConfigured: isConfigured,
    getClient: getClient,
    validateFrontendKey: validateFrontendKey,
    withTimeout: withTimeout,
    signUp: supabaseSignUp,
    signIn: supabaseSignIn,
    signOut: supabaseSignOut,
    fetchProfile: supabaseFetchProfile,
    updateProfile: supabaseUpdateProfile,
    uploadAvatar: supabaseUploadAvatar,
    fetchProperties: supabaseFetchProperties,
    insertProperty: supabaseInsertProperty
  };
});
