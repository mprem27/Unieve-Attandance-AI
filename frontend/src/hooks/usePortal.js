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
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
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
      String(username || "")
        .trim()
        .toUpperCase();

    const cleanPassword =
      String(password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      const message =
        "AMS VTU number and password are required.";

      setError(message);
      throw new Error(message);
    }

    if (!/^VTU\d+$/i.test(cleanUsername)) {
      const message =
        "AMS username must be your VTU number, for example VTU26381.";

      setError(message);
      throw new Error(message);
    }

    setSaving(true);
    setError("");

    try {
      const data =
        await updatePortalCredentials({
          portalUsername: cleanUsername,
          portalPassword: cleanPassword,
        });

      setPortalUsername(
        data?.portalUsername ||
          cleanUsername
      );

      setConfigured(
        Boolean(
          data?.configured ?? true
        )
      );

      return data;
    } catch (err) {
      const detail =
        err?.response?.data?.detail;

      let message =
        err?.response?.data?.message ||
        "Unable to save AMS credentials.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.msg ||
                item?.message ||
                ""
          )
          .filter(Boolean)
          .join(", ");
      }

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