export const calculatePercentage = (present, total) => {
  const presentValue = Number(present) || 0;
  const totalValue = Number(total) || 0;

  if (totalValue === 0) {
    return 0;
  }

  return Number(
    ((presentValue / totalValue) * 100).toFixed(2)
  );
};

export const getAttendancePercentage = (subject) => {
  if (!subject) {
    return 0;
  }

  if (
    subject.percentage !== undefined &&
    subject.percentage !== null
  ) {
    return Number(subject.percentage);
  }

  return calculatePercentage(
    subject.present,
    subject.total
  );
};

export const getAttendanceStatus = (percentage) => {
  const value = Number(percentage) || 0;

  if (value >= 75) {
    return "GOOD";
  }

  if (value >= 65) {
    return "WARNING";
  }

  return "CRITICAL";
};

export const isAttendanceEligible = (percentage) => {
  return Number(percentage) >= 75;
};

export const getRequiredPercentage = () => {
  return 75;
};