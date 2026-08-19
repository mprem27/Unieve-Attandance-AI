import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getProfile,
  updateProfile,
} from "../services/profileService";


// =====================================================
// PROFILE HOOK
// =====================================================

export default function useProfile() {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProfile();

      /*
       * Keep the complete object returned by the backend.
       *
       * This is important because the profile contains
       * many manually entered student fields:
       *
       * name
       * vtuNumber
       * gender
       * fatherName
       * motherName
       * dateOfBirth
       * degree
       * branch
       * community
       * religion
       * nationality
       * aadhaarNumber
       * phoneNumber
       * academicBankCreditsId
       * parentName
       * parentPhone
       * year
       * semester
       * section
       * batch
       * etc.
       */

      setProfile(data || null);

      return data;
    } catch (err) {
      console.error(
        "Unable to load profile:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        "Unable to load your profile.";

      setError(message);

      setProfile(null);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  // =====================================================
  // LOAD PROFILE WHEN HOOK MOUNTS
  // =====================================================

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);


  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const saveProfile = useCallback(
    async (profileData) => {
      setSaving(true);
      setError("");

      try {
        const data = await updateProfile(
          profileData
        );

        /*
         * Backend returns the updated complete
         * UserPublic object.
         */
        setProfile(data || null);

        return data;
      } catch (err) {
        console.error(
          "Unable to update profile:",
          err
        );

        const message =
          err?.response?.data?.detail ||
          "Unable to update profile.";

        setError(message);

        throw err;
      } finally {
        setSaving(false);
      }
    },
    []
  );


  // =====================================================
  // REFRESH PROFILE
  // =====================================================

  const refresh = useCallback(async () => {
    return await loadProfile();
  }, [loadProfile]);


  // =====================================================
  // CLEAR ERROR
  // =====================================================

  const clearError = useCallback(() => {
    setError("");
  }, []);


  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Complete profile object
    profile,

    // Loading states
    loading,
    saving,

    // Error
    error,

    // Actions
    loadProfile,
    saveProfile,
    refresh,
    clearError,
  };
}