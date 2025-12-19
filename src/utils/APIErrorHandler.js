export const handleApiError = (error) => {
  // Normalize API error responses so all callers can reliably use `.msg`
  const fallback = { success: false, msg: "An error occurred" };

  if (!error?.response?.data) {
    return fallback;
  }

  const data = error.response.data;

  // Many backend responses use `msg`, some use `message`
  const msg = data.msg || data.message || (typeof data === "string" ? data : undefined) || fallback.msg;

  return {
    ...data,
    msg,
  };
};
