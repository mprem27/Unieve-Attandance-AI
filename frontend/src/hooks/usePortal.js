import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPortalCredentials,
  updatePortalCredentials,
} from "../services/profileService";

// =====================================================
// PORTAL HOOK
// =====================================================

export default function usePortal() {
  const [portalUsername, setPortalUsername] =
    useState("");

  const [configured, setConfigured] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadPortalStatus = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getPortalCredentials();

        setPortalUsername(
          data?.portalUsername || ""
        );

        setConfigured(
          Boolean(data?.configured)
        );
      } catch (err) {
        console.error(
          "Unable to load portal credentials:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load portal settings."
        );

        setPortalUsername("");
        setConfigured(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPortalStatus();
  }, [loadPortalStatus]);

  const saveCredentials = async (
    username,
    password
  ) => {
    const cleanUsername =
      username?.trim();

    if (!cleanUsername || !password) {
      const message =
        "Portal username and password are required.";

      setError(message);

      throw new Error(message);
    }

    setSaving(true);
    setError("");

    try {
      const data =
        await updatePortalCredentials({
          portalUsername: cleanUsername,
          portalPassword: password,
        });

      setPortalUsername(
        data?.portalUsername ||
          cleanUsername
      );

      setConfigured(
        Boolean(data?.configured)
      );

      return data;
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to save portal credentials.";

      setError(message);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    portalUsername,
    configured,
    loading,
    saving,
    error,
    saveCredentials,
    refresh: loadPortalStatus,
  };
}