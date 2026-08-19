import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import { Link } from "react-router-dom";

import api from "../services/api";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

// =====================================================
// CONSTANTS
// =====================================================

const CREATE_TIMEOUT = 30000;
const SYNC_TIMEOUT = 120000;
const SYNC_STATUS_INTERVAL = 5000;

// =====================================================
// HELPERS
// =====================================================

const getUserId = (user) => {
  return (
    user?.id ||
    user?._id ||
    user?.studentId ||
    user?.student_id ||
    user?.student?.id ||
    user?.student?._id ||
    null
  );
};

const getDetailMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map(
        (item) =>
          item?.msg ||
          item?.message ||
          String(item)
      )
      .join(", ");
  }

  return (
    detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "An unexpected error occurred."
  );
};

const normalizeUsers = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const isSyncRunning = (student) => {
  if (!student) return false;

  return (
    student.portalSyncInProgress === true ||
    student.portal_sync_in_progress === true
  );
};

const isSyncFailed = (student) => {
  if (!student) return false;

  return Boolean(
    student.portalSyncLastError ||
      student.portal_sync_last_error ||
      student.portalLastSyncError
  );
};

const isSyncCompleted = (student) => {
  if (!student) return false;

  return (
    student.portalSynced === true ||
    student.portal_synced === true ||
    student.profileSynced === true
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // =====================================================
  // ADD STUDENT MODAL / BACKGROUND SYNC
  // =====================================================

  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [createError, setCreateError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [syncStudentId, setSyncStudentId] = useState(null);

  const pollTimerRef = useRef(null);

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    temporaryPassword: "",
    role: "student",

    // ---------------------------------------------------
    // AMS CREDENTIALS
    // OPTIONAL DURING STUDENT CREATION
    // ---------------------------------------------------

    vtuNumber: "",
    portalUsername: "",
    portalPassword: "",

    phoneNumber: "",
    parentName: "",
    parentPhone: "",
    branch: "",
    year: "",
    semester: "",
    section: "",
    batch: "",
    photoUrl: "",

    smsEnabled: true,
    notificationsEnabled: true,
    active: true,
  });

  // =====================================================
  // LOAD USERS
  // =====================================================

  const loadUsers = useCallback(
    async (manualRefresh = false) => {
      try {
        if (manualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          "/admin/users",
          {
            timeout: CREATE_TIMEOUT,
          }
        );

        setUsers(
          normalizeUsers(
            response?.data
          )
        );
      } catch (err) {
        console.error(
          "Users loading failed:",
          err
        );

        setError(
          getDetailMessage(err) ||
            "Unable to load users. Please try again."
        );
      } finally {
        if (manualRefresh) {
          setTimeout(
            () => setIsRefreshing(false),
            500
          );
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadUsers();

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(
          pollTimerRef.current
        );
      }
    };
  }, [loadUsers]);

  // =====================================================
  // SEARCH / FILTERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      return (
        String(
          user?.name || ""
        )
          .toLowerCase()
          .includes(query) ||

        String(
          user?.email || ""
        )
          .toLowerCase()
          .includes(query) ||

        String(
          user?.vtuNumber ||
            user?.vtu_number ||
            user?.portalUsername ||
            user?.portal_username ||
            ""
        )
          .toLowerCase()
          .includes(query) ||

        String(
          user?.branch || ""
        )
          .toLowerCase()
          .includes(query) ||

        String(
          user?.section || ""
        )
          .toLowerCase()
          .includes(query) ||

        String(
          user?.year || ""
        )
          .toLowerCase()
          .includes(query)
      );
    });
  }, [users, search]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const studentCount = users.filter(
    (u) => u?.role === "student"
  ).length;

  const activeCount = users.filter(
    (u) =>
      u?.active === true ||
      u?.isActive === true
  ).length;

  const portalConfiguredCount =
    users.filter(
      (u) =>
        u?.portalCredentialsConfigured ===
          true ||
        u?.portal_credentials_configured ===
          true
    ).length;

  const syncedCount = users.filter(
    (u) =>
      u?.portalSynced === true ||
      u?.portal_synced === true
  ).length;

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    // ---------------------------------------------------
    // CLEAR AMS ERROR WHILE USER CORRECTS THE FORM
    // ---------------------------------------------------

    if (
      name === "portalUsername" ||
      name === "portalPassword" ||
      name === "vtuNumber"
    ) {
      setCreateError("");
    }
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      temporaryPassword: "",
      role: "student",

      vtuNumber: "",
      portalUsername: "",
      portalPassword: "",

      phoneNumber: "",
      parentName: "",
      parentPhone: "",
      branch: "",
      year: "",
      semester: "",
      section: "",
      batch: "",
      photoUrl: "",

      smsEnabled: true,
      notificationsEnabled: true,
      active: true,
    });

    setCreateError("");
    setSyncMessage("");
    setSyncStudentId(null);

    if (pollTimerRef.current) {
      clearTimeout(
        pollTimerRef.current
      );

      pollTimerRef.current = null;
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeAddModal = () => {
    if (
      isCreating ||
      isSyncing
    ) {
      return;
    }

    setShowAddModal(false);
    resetForm();
  };

  // =====================================================
  // BACKGROUND SYNC MONITORING
  // =====================================================

  const executeBackgroundSyncCheck =
    useCallback(
      async (
        studentId,
        startTime
      ) => {
        if (!studentId) return;

        // ------------------------------------------------
        // SYNC TIMEOUT
        // ------------------------------------------------

        if (
          Date.now() - startTime >
          SYNC_TIMEOUT
        ) {
          setIsSyncing(false);

          setCreateError(
            "Synchronization is taking longer than expected. The server is still processing portal data in the background."
          );

          loadUsers(true);

          return;
        }

        try {
          const response =
            await api.get(
              `/admin/students/${studentId}/overview`,
              {
                timeout: 15000,
              }
            );

          const currentStudent =
            response?.data?.student ||
            response?.data?.profile ||
            response?.data ||
            null;

          if (!currentStudent) {
            pollTimerRef.current =
              setTimeout(
                () =>
                  executeBackgroundSyncCheck(
                    studentId,
                    startTime
                  ),
                SYNC_STATUS_INTERVAL
              );

            return;
          }

          // ------------------------------------------------
          // SYNC FAILED
          // ------------------------------------------------

          if (
            isSyncFailed(
              currentStudent
            )
          ) {
            setIsSyncing(false);

            const failMessage =
              currentStudent.portalSyncLastError ||
              currentStudent.portal_sync_last_error ||
              "AMS/Parent Portal background sync failed.";

            setCreateError(
              failMessage
            );

            loadUsers(true);

            return;
          }

          // ------------------------------------------------
          // SYNC COMPLETED
          // ------------------------------------------------

          if (
            isSyncCompleted(
              currentStudent
            ) &&
            !isSyncRunning(
              currentStudent
            )
          ) {
            setIsSyncing(false);

            setSyncMessage(
              "Student profile, subjects, and attendance synced successfully!"
            );

            await loadUsers(
              true
            );

            setTimeout(() => {
              setShowAddModal(false);
              resetForm();
            }, 1200);

            return;
          }

          // ------------------------------------------------
          // SYNC STILL RUNNING
          // ------------------------------------------------

          if (
            isSyncRunning(
              currentStudent
            )
          ) {
            setSyncMessage(
              "AMS and Parent Portal background task is running. Scraping profile information and attendance records..."
            );
          }

          pollTimerRef.current =
            setTimeout(
              () =>
                executeBackgroundSyncCheck(
                  studentId,
                  startTime
                ),
              SYNC_STATUS_INTERVAL
            );
        } catch (err) {
          console.warn(
            "Sync monitor poll fluctuation, retrying...",
            err
          );

          pollTimerRef.current =
            setTimeout(
              () =>
                executeBackgroundSyncCheck(
                  studentId,
                  startTime
                ),
              SYNC_STATUS_INTERVAL
            );
        }
      },
      [loadUsers]
    );

  // =====================================================
  // START BACKGROUND SYNC
  // =====================================================

  const startBackgroundSyncFlow =
    async (
      studentId,
      username,
      password
    ) => {
      setSyncStudentId(
        studentId
      );

      setIsSyncing(true);

      try {
        setSyncMessage(
          "Saving AMS credentials and starting portal synchronization..."
        );

        // ------------------------------------------------
        // SAVE AMS CREDENTIALS
        // ------------------------------------------------

        await api.put(
          `/admin/users/${studentId}`,
          {
            portalUsername:
              username,
            portalPassword:
              password,
          },
          {
            timeout:
              CREATE_TIMEOUT,
          }
        );

        // ------------------------------------------------
        // START PROFILE / PORTAL SYNC
        // ------------------------------------------------

        await api.post(
          `/admin/students/${studentId}/sync-profile`,
          {},
          {
            timeout:
              CREATE_TIMEOUT,
          }
        );

        // ------------------------------------------------
        // START MONITORING
        // ------------------------------------------------

        const startTime =
          Date.now();

        executeBackgroundSyncCheck(
          studentId,
          startTime
        );
      } catch (err) {
        console.error(
          "Initiating backend background sync failed:",
          err
        );

        setIsSyncing(false);

        setCreateError(
          getDetailMessage(
            err
          ) ||
            "Student was created, but the AMS synchronization could not be started."
        );
      }
    };

  // =====================================================
  // CREATE STUDENT
  // =====================================================

  const handleCreateStudent =
    async (event) => {
      event.preventDefault();

      if (
        isCreating ||
        isSyncing
      ) {
        return;
      }

      setCreateError("");
      setSyncMessage("");

      // ------------------------------------------------
      // APPLICATION ACCOUNT VALIDATION
      // ------------------------------------------------

      if (
        !form.name.trim()
      ) {
        return setCreateError(
          "Student name is required."
        );
      }

      if (
        !form.email.trim()
      ) {
        return setCreateError(
          "Student email is required."
        );
      }

      if (
        !form.temporaryPassword ||
        form.temporaryPassword.length <
          8
      ) {
        return setCreateError(
          "Temporary password must contain at least 8 characters."
        );
      }

      // ------------------------------------------------
      // AMS CREDENTIALS
      //
      // OPTIONAL
      //
      // Both empty:
      //     Create student normally.
      //
      // Both entered:
      //     Create student + validate AMS + sync.
      //
      // Only one entered:
      //     Show validation error.
      // ------------------------------------------------

      const vtuNumber =
        String(
          form.vtuNumber || ""
        )
          .trim()
          .toUpperCase();

      let portalUsername =
        String(
          form.portalUsername ||
            ""
        )
          .trim()
          .toUpperCase();

      const portalPassword =
        String(
          form.portalPassword ||
            ""
        );

      // ------------------------------------------------
      // AMS CREDENTIALS ARE COMPLETELY OPTIONAL
      //
      // IMPORTANT:
      // VTU number is only student information.
      // It must NOT automatically become an AMS username.
      //
      // Therefore:
      // VTU entered + AMS username empty + AMS password empty
      // = valid student creation without AMS credentials.
      // ------------------------------------------------

      const hasPortalUsername =
        Boolean(
          portalUsername
        );

      const hasPortalPassword =
        Boolean(
          portalPassword
        );

      // ------------------------------------------------
      // PARTIAL AMS CREDENTIALS ARE NOT ALLOWED
      // ------------------------------------------------

      if (
        hasPortalUsername !==
        hasPortalPassword
      ) {
        return setCreateError(
          "Please enter both AMS username and AMS password, or leave both empty. AMS credentials are optional."
        );
      }

      // ------------------------------------------------
      // CREATE REQUEST
      // ------------------------------------------------

      try {
        setIsCreating(
          true
        );

        // ------------------------------------------------
        // MESSAGE DEPENDS ON AMS CREDENTIALS
        // ------------------------------------------------

        if (
          hasPortalUsername &&
          hasPortalPassword
        ) {
          setSyncMessage(
            "Creating student account..."
          );
        } else {
          setSyncMessage(
            "Creating student account without AMS credentials..."
          );
        }

        // ------------------------------------------------
        // BASE PAYLOAD
        // ------------------------------------------------

        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),

          temporaryPassword:
            form.temporaryPassword,

          role: "student",

          vtuNumber:
            vtuNumber || null,

          phoneNumber:
            form.phoneNumber.trim() ||
            null,

          parentName:
            form.parentName.trim() ||
            null,

          parentPhone:
            form.parentPhone.trim() ||
            null,

          branch:
            form.branch.trim() ||
            null,

          year:
            form.year.trim() ||
            null,

          semester:
            form.semester.trim() ||
            null,

          section:
            form.section.trim() ||
            null,

          batch:
            form.batch.trim() ||
            null,

          photoUrl:
            form.photoUrl.trim() ||
            null,

          smsEnabled:
            form.smsEnabled,

          notificationsEnabled:
            form.notificationsEnabled,

          active:
            form.active,
        };

        // ------------------------------------------------
        // ONLY ADD AMS CREDENTIALS WHEN PROVIDED
        // ------------------------------------------------

        if (
          hasPortalUsername &&
          hasPortalPassword
        ) {
          payload.portalUsername =
            portalUsername;

          payload.portalPassword =
            portalPassword;
        }

        // ------------------------------------------------
        // CREATE STUDENT
        // ------------------------------------------------

        const response =
          await api.post(
            "/admin/users",
            payload,
            {
              timeout:
                CREATE_TIMEOUT,
            }
          );

        const createdUser =
          response?.data;

        const studentId =
          getUserId(
            createdUser
          );

        if (!studentId) {
          throw new Error(
            "Student was created, but the server response did not contain a student ID."
          );
        }

        // ------------------------------------------------
        // DATABASE CREATION COMPLETE
        // ------------------------------------------------

        setIsCreating(
          false
        );

        // ------------------------------------------------
        // NO AMS CREDENTIALS
        //
        // IMPORTANT:
        //
        // Student is successfully created.
        // Do NOT call sync-profile.
        // Do NOT send empty/default password.
        //
        // Student can configure AMS later
        // from the student login.
        // ------------------------------------------------

        if (
          !hasPortalUsername ||
          !hasPortalPassword
        ) {
          setIsSyncing(
            false
          );

          setSyncMessage(
            "Student account created successfully. AMS credentials can be added later from the student login."
          );

          await loadUsers(
            true
          );

          setTimeout(() => {
            setShowAddModal(
              false
            );

            resetForm();
          }, 1500);

          return;
        }

        // ------------------------------------------------
        // AMS CREDENTIALS PROVIDED
        //
        // Continue with existing working sync flow.
        // ------------------------------------------------

        await startBackgroundSyncFlow(
          studentId,
          portalUsername,
          portalPassword
        );
      } catch (err) {
        console.error(
          "Student provisioning process failed:",
          err
        );

        setCreateError(
          getDetailMessage(
            err
          ) ||
            "Unable to complete student creation."
        );

        setIsCreating(
          false
        );
      }
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <Loading fullPage />
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 xl:p-10">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <Link
            to="/admin"
            className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-indigo-600 sm:text-sm"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>

            Back to Admin Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766a6.375 6.375 0 0111.964-3.07"
                    />
                  </svg>
                </span>

                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Student Directory
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                User Management
              </h1>

              <p className="mt-1 max-w-xl text-sm font-medium text-slate-500 sm:text-base">
                Manage student accounts, academic information, AMS credentials and synchronized student data.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* REFRESH */}

              <button
                type="button"
                onClick={() =>
                  loadUsers(true)
                }
                disabled={
                  isRefreshing
                }
                className="group flex items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95 disabled:opacity-70"
              >
                <svg
                  className={`h-4 w-4 ${
                    isRefreshing
                      ? "animate-spin text-indigo-600"
                      : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>

                {isRefreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              {/* ADD STUDENT */}

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(
                    true
                  );
                }}
                className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14M5 12h14"
                  />
                </svg>

                Add Student
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={() =>
                loadUsers(true)
              }
            />
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard
            title="Total Users"
            value={users.length}
            color="slate"
          />

          <StatCard
            title="Students"
            value={studentCount}
            color="indigo"
          />

          <StatCard
            title="Active"
            value={activeCount}
            color="emerald"
          />

          <StatCard
            title="AMS Configured"
            value={
              portalConfiguredCount
            }
            color="violet"
          />

          <StatCard
            title="AMS Synced"
            value={syncedCount}
            color="cyan"
          />
        </div>

        {/* =================================================
            DIRECTORY
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl">

          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-white p-5 sm:flex-row sm:items-center sm:px-8 sm:py-6">

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Student Directory
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Click a student to view complete profile and attendance.
              </p>
            </div>

            <div className="relative w-full max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search name, VTU, email..."
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredUsers.length ===
          0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center sm:p-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766a6.375 6.375 0 0111.964-3.07"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No Students Found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? "No profiles match your current search."
                  : "No student accounts have been created yet."}
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        VTU Number
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Academic
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        AMS
                      </th>

                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(
                      (user) => {
                        const userId =
                          getUserId(
                            user
                          );

                        return (
                          <tr
                            key={
                              userId
                            }
                            className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                            onClick={() => {
                              if (
                                userId
                              ) {
                                window.location.href = `/admin/users/${userId}`;
                              }
                            }}
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                                  {user.photoUrl ? (
                                    <img
                                      src={
                                        user.photoUrl
                                      }
                                      alt={
                                        user.name
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    user.name
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                    "U"
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-bold text-slate-900 group-hover:text-indigo-600">
                                    {user.name ||
                                      "Unknown"}
                                  </p>

                                  <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                                    {user.email ||
                                      "No email"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-8 py-5 text-sm font-bold uppercase tracking-wider text-slate-600">
                              {user.vtuNumber ||
                                user.vtu_number ||
                                user.portalUsername ||
                                user.portal_username ||
                                "—"}
                            </td>

                            <td className="px-8 py-5">
                              <p className="text-sm font-bold text-slate-700">
                                {user.branch ||
                                  "—"}
                              </p>

                              <p className="mt-0.5 text-xs font-medium text-slate-400">
                                Year{" "}
                                {user.year ||
                                  "—"}{" "}
                                • Sem{" "}
                                {user.semester ||
                                  "—"}{" "}
                                • Sec{" "}
                                {user.section ||
                                  "—"}
                              </p>
                            </td>

                            <td className="px-8 py-5">
                              {user.portalSynced ||
                              user.portal_synced ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                  Synced
                                </span>
                              ) : user.portalCredentialsConfigured ||
                                user.portal_credentials_configured ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
                                  Not Configured
                                </span>
                              )}
                            </td>

                            <td className="px-8 py-5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${
                                  user.active
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    user.active
                                      ? "bg-emerald-500"
                                      : "bg-rose-500"
                                  }`}
                                />

                                {user.active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-8 py-5 text-right">
                              {userId ? (
                                <Link
                                  to={`/admin/users/${userId}`}
                                  onClick={(
                                    event
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white"
                                >
                                  View Student

                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                  </svg>
                                </Link>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">
                                  Invalid ID
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  MOBILE LIST
              ================================================= */}

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredUsers.map(
                  (user) => {
                    const userId =
                      getUserId(
                        user
                      );

                    return (
                      <div
                        key={
                          userId
                        }
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                              {user.photoUrl ? (
                                <img
                                  src={
                                    user.photoUrl
                                  }
                                  alt={
                                    user.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                user.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                "U"
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-slate-900">
                                {user.name ||
                                  "Unknown"}
                              </p>

                              <p className="truncate text-xs text-slate-400">
                                {user.email ||
                                  "No email"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                              user.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {user.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <InfoMini
                            label="VTU Number"
                            value={
                              user.vtuNumber ||
                              user.vtu_number ||
                              user.portalUsername ||
                              user.portal_username ||
                              "—"
                            }
                          />

                          <InfoMini
                            label="Branch"
                            value={
                              user.branch ||
                              "—"
                            }
                          />

                          <InfoMini
                            label="Year"
                            value={
                              user.year ||
                              "—"
                            }
                          />

                          <InfoMini
                            label="AMS"
                            value={
                              user.portalSynced ||
                              user.portal_synced
                                ? "Synced"
                                : user.portalCredentialsConfigured ||
                                  user.portal_credentials_configured
                                ? "Ready"
                                : "Not Configured"
                            }
                          />
                        </div>

                        {userId && (
                          <Link
                            to={`/admin/users/${userId}`}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white"
                          >
                            View Full Student Profile

                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                              />
                            </svg>
                          </Link>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-8">
                <p className="text-xs font-medium text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {
                      filteredUsers.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900">
                    {users.length}
                  </span>{" "}
                  users
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          ADD STUDENT MODAL
      ===================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Administration
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                  Add New Student
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  Create the student account. AMS credentials are optional and can be added later.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeAddModal
                }
                disabled={
                  isCreating ||
                  isSyncing
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={
                handleCreateStudent
              }
              className="max-h-[calc(92vh-100px)] overflow-y-auto"
            >
              <div className="space-y-7 p-5 sm:p-7">

                {/* =================================================
                    ERROR
                ================================================= */}

                {createError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-600">
                        !
                      </div>

                      <p className="text-sm font-semibold text-rose-700">
                        {createError}
                      </p>
                    </div>
                  </div>
                )}

                {/* =================================================
                    SYNC MESSAGE
                ================================================= */}

                {(syncMessage ||
                  isSyncing) && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      isSyncing
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isSyncing ? (
                        <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                          ✓
                        </span>
                      )}

                      <div>
                        <p className="text-sm font-bold">
                          {syncMessage ||
                            "Synchronizing AMS..."}
                        </p>

                        {isSyncing && (
                          <p className="mt-1 text-xs font-medium opacity-75">
                            Please do not close this window while synchronization is being monitored.
                          </p>
                        )}
                      </div>
                    </div>

                    {isSyncing && (
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                        <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-500" />
                      </div>
                    )}
                  </div>
                )}

                {/* =================================================
                    APPLICATION ACCOUNT
                ================================================= */}

                <FormSection
                  title="Application Account"
                  description="Login information for this application"
                >
                  <Input
                    label="Full Name"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Student full name"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="student@example.com"
                  />

                  <Input
                    label="Temporary Password"
                    name="temporaryPassword"
                    type="password"
                    value={
                      form.temporaryPassword
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                </FormSection>

                {/* =================================================
                    AMS CREDENTIALS
                ================================================= */}

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
                  <div className="mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 5.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                          />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          Veltech AMS Credentials
                        </h3>

                        <p className="text-xs font-medium text-slate-500">
                          Optional. Enter them now to fetch AMS data immediately, or leave them empty for the student to add later.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl border border-indigo-200 bg-white/70 p-3">
                    <p className="text-xs font-semibold leading-5 text-indigo-700">
                      <span className="font-black">
                        Optional:
                      </span>{" "}
                      You can create the student without AMS credentials. No default AMS password will be created or sent.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="AMS Username"
                      name="portalUsername"
                      value={
                        form.portalUsername
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter AMS username (optional)"
                      autoComplete="off"
                    />

                    <Input
                      label="AMS Password"
                      name="portalPassword"
                      type="password"
                      value={
                        form.portalPassword
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Leave empty to add later"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* =================================================
                    STUDENT INFORMATION
                ================================================= */}

                <FormSection
                  title="Student Information"
                  description="Optional fallback information"
                >
                  <Input
                    label="VTU Number"
                    name="vtuNumber"
                    value={
                      form.vtuNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="VTU26381"
                    autoComplete="off"
                  />

                  <Input
                    label="Phone Number"
                    name="phoneNumber"
                    value={
                      form.phoneNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="+91..."
                  />

                  <Input
                    label="Photo URL"
                    name="photoUrl"
                    value={
                      form.photoUrl
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="https://..."
                  />
                </FormSection>

                {/* =================================================
                    PARENT INFORMATION
                ================================================= */}

                <FormSection
                  title="Parent Information"
                  description="Parent / guardian details"
                >
                  <Input
                    label="Parent Name"
                    name="parentName"
                    value={
                      form.parentName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Parent name"
                  />

                  <Input
                    label="Parent Phone"
                    name="parentPhone"
                    value={
                      form.parentPhone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="+91..."
                  />
                </FormSection>

                {/* =================================================
                    ACADEMIC INFORMATION
                ================================================= */}

                <FormSection
                  title="Academic Information"
                  description="Used as fallback information"
                >
                  <Input
                    label="Branch"
                    name="branch"
                    value={
                      form.branch
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Computer Science"
                  />

                  <Input
                    label="Year"
                    name="year"
                    value={
                      form.year
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2"
                  />

                  <Input
                    label="Semester"
                    name="semester"
                    value={
                      form.semester
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="4"
                  />

                  <Input
                    label="Section"
                    name="section"
                    value={
                      form.section
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="A"
                  />

                  <Input
                    label="Batch"
                    name="batch"
                    value={
                      form.batch
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2024-2028"
                  />
                </FormSection>

                {/* =================================================
                    SETTINGS
                ================================================= */}

                <FormSection
                  title="Account Settings"
                  description="Notifications and account status"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Checkbox
                      name="smsEnabled"
                      checked={
                        form.smsEnabled
                      }
                      onChange={
                        handleChange
                      }
                      label="SMS Notifications"
                    />

                    <Checkbox
                      name="notificationsEnabled"
                      checked={
                        form.notificationsEnabled
                      }
                      onChange={
                        handleChange
                      }
                      label="App Notifications"
                    />

                    <Checkbox
                      name="active"
                      checked={
                        form.active
                      }
                      onChange={
                        handleChange
                      }
                      label="Active Account"
                    />
                  </div>
                </FormSection>
              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">

                <button
                  type="button"
                  onClick={
                    closeAddModal
                  }
                  disabled={
                    isCreating ||
                    isSyncing
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isCreating ||
                    isSyncing
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(isCreating ||
                    isSyncing) && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}

                  {isCreating
                    ? "Creating Student..."
                    : isSyncing
                    ? "Syncing AMS..."
                    : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

function StatCard({
  title,
  value,
  color,
}) {
  const styles = {
    slate: {
      icon: "bg-slate-100 text-slate-600",
      value: "text-slate-900",
    },

    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      value: "text-indigo-600",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },

    violet: {
      icon: "bg-violet-50 text-violet-600",
      value: "text-violet-600",
    },

    cyan: {
      icon: "bg-cyan-50 text-cyan-600",
      value: "text-cyan-600",
    },
  };

  const style =
    styles[color] ||
    styles.slate;

  return (
    <div className="group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-6">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.icon} sm:h-12 sm:w-12 sm:rounded-2xl`}
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766a6.375 6.375 0 0111.964-3.07"
          />
        </svg>
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
        {title}
      </p>

      <p
        className={`mt-1 text-3xl font-black ${style.value} sm:text-4xl`}
      >
        {value}
      </p>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900 sm:text-base">
          {title}
        </h3>

        <p className="mt-0.5 text-xs font-medium text-slate-400">
          {description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete = "off",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={
          autoComplete
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

function Checkbox({
  name,
  checked,
  onChange,
  label,
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-50">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />

      <span className="text-xs font-bold text-slate-700">
        {label}
      </span>
    </label>
  );
}

function InfoMini({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}