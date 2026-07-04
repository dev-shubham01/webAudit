import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "webhealth:googleUser";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function decodeIdToken(token) {
  const payload = token.split(".")[1];
  const json = decodeURIComponent(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  return JSON.parse(json);
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [ready, setReady] = useState(false);

  const handleCredential = useCallback((response) => {
    const payload = decodeIdToken(response.credential);
    const nextUser = { name: payload.name, email: payload.email, picture: payload.picture };
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set — Google Sign-In is disabled.");
      return undefined;
    }
    let cancelled = false;
    function tryInit() {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
          auto_select: false,
        });
        setReady(true);
      } else {
        setTimeout(tryInit, 100);
      }
    }
    tryInit();
    return () => {
      cancelled = true;
    };
  }, [handleCredential]);

  const renderButton = useCallback((el) => {
    if (!el || !window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(el, {
      theme: "filled_black",
      size: "medium",
      shape: "pill",
      text: "signin",
      width: 208,
    });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, renderButton, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
