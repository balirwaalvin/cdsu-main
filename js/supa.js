/* Connection to the CDSU backend (Supabase): payments, messages, member accounts and the online book.
   The publishable key below is meant to be public — every table is protected by row-level security,
   and anything sensitive happens inside permission-checked database functions. */
(function () {
  "use strict";
  const URL = "https://kmkankeawivfduiumtnb.supabase.co";
  const KEY = "sb_publishable_6WDhBYqop97ODi_iJCvRnQ_pJTx29V7";

  // A page can keep its own sign-in apart from the rest of the site with <html data-auth-key="…">.
  // CDSU Mail does this, so a mailbox session and a staff or member session never replace each other.
  const storageKey = document.documentElement.dataset.authKey;
  window.CDSU_DB = window.supabase
    ? window.supabase.createClient(URL, KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !storageKey, ...(storageKey ? { storageKey } : {}) }
      })
    : null;
  window.CDSU_FUNCTIONS = `${URL}/functions/v1`;

  // Turn database and sign-in errors into sentences people can act on
  window.CDSU_ERR = (err) => {
    const m = String((err && (err.message || err.error_description)) || err || "");
    if (/failed to fetch|network|load failed/i.test(m)) return "We couldn't reach the server. Check your internet connection and try again.";
    if (/invalid login credentials/i.test(m)) return "That email and password don't match. Please try again.";
    if (/email not confirmed/i.test(m)) return "Please confirm your email address first — check your inbox for the link we sent.";
    if (/user already registered/i.test(m)) return "An account already uses this email. Sign in instead, or reset your password.";
    if (/password should be at least/i.test(m)) return "Please choose a password of at least 8 characters.";
    if (/rate limit|too many requests/i.test(m)) return "Too many attempts. Please wait a few minutes and try again.";
    if (/jwt|not allowed|permission denied/i.test(m)) return "Your session has expired or you don't have access. Please sign in again.";
    return m || "Something went wrong. Please try again.";
  };

  // Payment methods offered on the site (values match the database)
  window.CDSU_METHODS = {
    mtn: "MTN MoMo",
    airtel: "Airtel Money",
    bank_ugx: "Bank transfer (UGX)",
    bank_usd: "Bank transfer (USD)"
  };
})();
