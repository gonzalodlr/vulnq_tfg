/** @format */

export const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString() : "—";
