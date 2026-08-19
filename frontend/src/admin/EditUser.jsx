import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  vtuNumber: "",
  rollNumber: "",
  gender: "",
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  degree: "",
  branch: "",
  community: "",
  religion: "",
  nationality: "",
  aadhaarNumber: "",
  academicBankCreditsId: "",
  phoneNumber: "",
  parentName: "",
  parentPhone: "",
  year: "",
  semester: "",
  section: "",
  batch: "",
  photoUrl: "",
  portalUsername: "",
  portalPassword: "",
  smsEnabled: true,
  notificationsEnabled: true,
  active: true,
};

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    ""
  );
}

function authConfig() {
  const token = getToken();

  return {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
  };
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function safeTrim(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeVtuUsername(value) {
  const normalized = safeTrim(value).toUpperCase();
  return /^VTU\d+$/.test(normalized) ? normalized : "";
}

export default function EditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStudent() {
      if (!userId) {
        setError("Student ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/admin/users/${userId}`
        );

        if (!mounted) return;

        const student = response.data?.user || response.data || {};

        setStudent(student);

        setForm({
          ...emptyForm,
          ...student,

          name: student.name ?? "",
          email: student.email ?? "",

          vtuNumber:
            normalizeVtuUsername(
              student.portalUsername ??
                student.portal_username ??
                student.vtuNumber ??
                student.vtu_number
            ),

          portalUsername:
            normalizeVtuUsername(
              student.portalUsername ??
                student.portal_username ??
                student.vtuNumber ??
                student.vtu_number
            ),

          rollNumber:
            student.rollNumber ??
            student.roll_number ??
            student.registrationNumber ??
            (normalizeVtuUsername(student.vtuNumber)
              ? ""
              : student.vtuNumber ?? ""),


          gender: student.gender ?? "",
          fatherName: student.fatherName ?? "",
          motherName: student.motherName ?? "",
          dateOfBirth: student.dateOfBirth ?? "",
          degree: student.degree ?? "",
          branch: student.branch ?? "",
          community: student.community ?? "",
          religion: student.religion ?? "",
          nationality: student.nationality ?? "",
          aadhaarNumber: student.aadhaarNumber ?? "",
          academicBankCreditsId:
            student.academicBankCreditsId ?? "",
          phoneNumber: student.phoneNumber ?? "",
          parentName: student.parentName ?? "",
          parentPhone: student.parentPhone ?? "",
          year: student.year ?? "",
          semester: student.semester ?? "",
          section: student.section ?? "",
          batch: student.batch ?? "",
          photoUrl: student.photoUrl ?? "",

          smsEnabled:
            student.smsEnabled ?? true,
          notificationsEnabled:
            student.notificationsEnabled ?? true,
          active:
            student.active ?? true,

          portalPassword: "",
        });
      } catch (err) {
        if (!mounted) return;

        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Failed to load student details."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStudent();

    return () => {
      mounted = false;
    };
  }, [userId]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!safeTrim(form.name)) {
      setError("Student name is required.");
      return;
    }

    if (!safeTrim(form.email)) {
      setError("Email is required.");
      return;
    }

    if (!safeTrim(form.vtuNumber)) {
      setError("VTU number is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: safeTrim(form.name),
        email: safeTrim(form.email),
        rollNumber: safeTrim(form.rollNumber),

        gender: safeTrim(form.gender),
        fatherName: safeTrim(form.fatherName),
        motherName: safeTrim(form.motherName),
        dateOfBirth: safeTrim(form.dateOfBirth),
        degree: safeTrim(form.degree),
        branch: safeTrim(form.branch),
        community: safeTrim(form.community),
        religion: safeTrim(form.religion),
        nationality: safeTrim(form.nationality),

        aadhaarNumber: safeTrim(form.aadhaarNumber),
        academicBankCreditsId:
          safeTrim(form.academicBankCreditsId),

        phoneNumber: safeTrim(form.phoneNumber),
        parentName: safeTrim(form.parentName),
        parentPhone: safeTrim(form.parentPhone),

        year: safeTrim(form.year),
        semester: safeTrim(form.semester),
        section: safeTrim(form.section),
        batch: safeTrim(form.batch),

        photoUrl: safeTrim(form.photoUrl),

        smsEnabled: form.smsEnabled,
        notificationsEnabled:
          form.notificationsEnabled,
        active: form.active,
      };

      // VTU/AMS credentials are NOT resent during a normal profile edit.
      // This prevents an unchanged credential from being revalidated.
      //
      // They are sent only when the admin explicitly changes the
      // VTU/AMS username or enters a new AMS password.
      const originalVtu = normalizeVtuUsername(
        student?.portalUsername ??
          student?.portal_username ??
          student?.vtuNumber ??
          student?.vtu_number ??
          ""
      );

      const editedVtu = normalizeVtuUsername(
        form.vtuNumber
      );

      const vtuChanged =
        editedVtu !== originalVtu;

      if (vtuChanged) {
        if (!editedVtu) {
          throw new Error(
            "Invalid VTU number. Use a value such as VTU26381."
          );
        }

        payload.vtuNumber = editedVtu;
        payload.portalUsername = editedVtu;
      }

      // Only send a new AMS password when the admin entered one.
      // Existing password remains untouched when this is empty.
      if (safeTrim(form.portalPassword)) {
        if (!editedVtu) {
          throw new Error(
            "Enter a valid AMS VTU number such as VTU26381 before changing the password."
          );
        }

        payload.portalUsername = editedVtu;
        payload.portalPassword =
          safeTrim(form.portalPassword);
      }

      const response = await api.put(
        `/admin/users/${userId}`,
        payload
      );

      if (!response?.data) {
        throw new Error(
          "The server did not return the updated student."
        );
      }

      setSuccess(
        "Student details updated successfully."
      );

      setForm((previous) => ({
        ...previous,
        portalPassword: "",
      }));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message = err?.response?.data?.message;

      const validationMessage = Array.isArray(detail)
        ? detail
            .map((item) =>
              item?.msg
                ? `${item.loc?.join(".") || "field"}: ${item.msg}`
                : String(item)
            )
            .join("; ")
        : detail;

      setError(
        validationMessage ||
          message ||
          err?.message ||
          "Failed to update student."
      );
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal() {
    if (saving || deleting) return;
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
  }

  async function handleDelete() {
    setShowDeleteModal(false);
    setDeleting(true);
    setError("");

    try {
      await api.delete(
        `/admin/users/${userId}`
      );

      navigate("/admin/users", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to delete student."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow">
          Loading student...
        </div>
      </div>
    );
  }

  return (
    <>
      {(saving || deleting) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-100 border-t-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {deleting ? "Deleting Student..." : "Saving Changes..."}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {deleting
                ? "Please wait while the student is being deleted."
                : "Please wait while your changes are being saved."}
            </p>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 15H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete Student?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800">
                    {form.name || "this student"}
                  </span>
                  ?
                </p>
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  The student account will be deactivated.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              to={`/admin/users/${userId}`}
              className="mb-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Student Details
            </Link>

            <h1 className="text-2xl font-bold text-slate-900">
              Edit Student
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update student information without changing the
              existing live attendance synchronization.
            </p>
          </div>

          <button
            type="button"
            onClick={openDeleteModal}
            disabled={deleting || saving}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Student"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Section title="Basic Information">
            <Field
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Field
              label="VTU Number"
              name="vtuNumber"
              value={form.vtuNumber}
              onChange={handleChange}
              required
            />

            <Field
              label="Roll / Registration Number"
              name="rollNumber"
              value={form.rollNumber}
              onChange={handleChange}
            />

            <SelectField
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              options={[
                "Male",
                "Female",
                "Other",
              ]}
            />

            <Field
              label="Date of Birth"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
            />
          </Section>

          <Section title="AMS / Parent Portal">
            <Field
              label="AMS Username / VTU Number"
              name="portalUsername"
              value={form.vtuNumber}
              onChange={() => {}}
              disabled
            />

            <Field
              label="New AMS Password"
              name="portalPassword"
              type="password"
              value={form.portalPassword}
              onChange={handleChange}
            />

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 md:col-span-2">
              <p className="text-sm font-bold text-indigo-900">
                Portal Login Information
              </p>

              <p className="mt-2 text-sm text-indigo-800">
                AMS username:{" "}
                <strong>
                  {form.vtuNumber || "—"}
                </strong>
              </p>

              <p className="mt-1 text-sm text-indigo-800">
                Parent Portal login:{" "}
                <strong>
                  {form.vtuNumber || "—"}
                </strong>
              </p>

              <p className="mt-1 text-sm text-indigo-800">
                Parent Portal password:{" "}
                <strong>Not required</strong>
              </p>

              <p className="mt-3 text-xs text-indigo-700">
                Leave New AMS Password empty to keep the
                currently stored AMS password unchanged.
              </p>
            </div>
          </Section>

          <Section title="Family Information">
            <Field
              label="Father Name"
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
            />

            <Field
              label="Mother Name"
              name="motherName"
              value={form.motherName}
              onChange={handleChange}
            />

            <Field
              label="Parent Name"
              name="parentName"
              value={form.parentName}
              onChange={handleChange}
            />

            <Field
              label="Parent Phone"
              name="parentPhone"
              value={form.parentPhone}
              onChange={handleChange}
            />
          </Section>

          <Section title="Academic Information">
            <Field
              label="Degree"
              name="degree"
              value={form.degree}
              onChange={handleChange}
            />

            <Field
              label="Branch"
              name="branch"
              value={form.branch}
              onChange={handleChange}
            />

            <Field
              label="Year"
              name="year"
              value={form.year}
              onChange={handleChange}
            />

            <Field
              label="Semester"
              name="semester"
              value={form.semester}
              onChange={handleChange}
            />

            <Field
              label="Section"
              name="section"
              value={form.section}
              onChange={handleChange}
            />

            <Field
              label="Batch"
              name="batch"
              value={form.batch}
              onChange={handleChange}
            />

            <Field
              label="Academic Bank Credits ID"
              name="academicBankCreditsId"
              value={form.academicBankCreditsId}
              onChange={handleChange}
            />
          </Section>

          <Section title="Personal & Contact Information">
            <Field
              label="Community"
              name="community"
              value={form.community}
              onChange={handleChange}
            />

            <Field
              label="Religion"
              name="religion"
              value={form.religion}
              onChange={handleChange}
            />

            <Field
              label="Nationality"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
            />

            <Field
              label="Aadhaar Number"
              name="aadhaarNumber"
              value={form.aadhaarNumber}
              onChange={handleChange}
            />

            <Field
              label="Phone Number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />

            <Field
              label="Photo URL"
              name="photoUrl"
              value={form.photoUrl}
              onChange={handleChange}
            />
          </Section>

          <Section title="Account Settings">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                name="smsEnabled"
                checked={Boolean(form.smsEnabled)}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  SMS Notifications
                </span>
                <span className="text-xs text-slate-500">
                  Allow SMS attendance notifications.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={Boolean(
                  form.notificationsEnabled
                )}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  Notifications
                </span>
                <span className="text-xs text-slate-500">
                  Enable application notifications.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 md:col-span-2">
              <input
                type="checkbox"
                name="active"
                checked={Boolean(form.active)}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  Active Student
                </span>
                <span className="text-xs text-slate-500">
                  Inactive students cannot use the application.
                </span>
              </span>
            </label>
          </Section>

          <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
            <Link
              to={`/admin/users/${userId}`}
              className="rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || deleting}
              className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}