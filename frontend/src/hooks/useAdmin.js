import { useCallback, useEffect, useState } from "react";

import {
  getUsers,
  getUser,
  getUserAttendance,
  createUser,
  updateUser,
  deleteUser,
} from "../services/adminService";

export default function useAdmin() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError("");

      const data = await getUser(userId);

      setUser(data);

      return data;
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load student."
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserAttendance = useCallback(
    async (userId) => {
      try {
        setError("");

        const data = await getUserAttendance(userId);

        setAttendance(
          Array.isArray(data) ? data : []
        );

        return data;
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Unable to load student attendance."
        );

        setAttendance([]);

        throw err;
      }
    },
    []
  );

  const addUser = async (userData) => {
    const data = await createUser(userData);

    await loadUsers();

    return data;
  };

  const editUser = async (userId, userData) => {
    const data = await updateUser(
      userId,
      userData
    );

    setUser(data);

    await loadUsers();

    return data;
  };

  const removeUser = async (userId) => {
    await deleteUser(userId);

    setUsers((current) =>
      current.filter(
        (item) => item.id !== userId
      )
    );
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    user,
    attendance,
    loading,
    error,

    loadUsers,
    loadUser,
    loadUserAttendance,

    addUser,
    editUser,
    removeUser,

    setUser,
    setError,
  };
}