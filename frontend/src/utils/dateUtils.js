

const toDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};


// =====================================================
// FORMAT DATE
// =====================================================

export const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = toDate(dateValue);

  if (!date) {
    // Keep manually entered dates such as:
    // "12/12/2005"
    return String(dateValue);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


// =====================================================
// FORMAT DATE TIME
// =====================================================

export const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = toDate(dateValue);

  if (!date) {
    return String(dateValue);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


// =====================================================
// FORMAT TIME
// =====================================================

export const formatTime = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = toDate(dateValue);

  if (!date) {
    return String(dateValue);
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


// =====================================================
// FORMAT RELATIVE DATE
// =====================================================

export const formatRelativeDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = toDate(dateValue);

  if (!date) {
    return String(dateValue);
  }

  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  // Future date
  if (difference < 0) {
    return formatDateTime(dateValue);
  }

  const minutes = Math.floor(
    difference / 60000
  );

  // Less than one minute
  if (minutes < 1) {
    return "Just now";
  }

  // Less than one hour
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  // Less than one day
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  // Less than one week
  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  // Older dates
  return formatDate(dateValue);
};


// =====================================================
// FORMAT DATE FOR INPUT
// =====================================================

export const formatDateForInput = (
  dateValue
) => {
  if (!dateValue) {
    return "";
  }

  const date = toDate(dateValue);

  if (!date) {
    return String(dateValue);
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// =====================================================
// CHECK VALID DATE
// =====================================================

export const isValidDate = (
  dateValue
) => {
  return Boolean(
    toDate(dateValue)
  );
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default formatDate;