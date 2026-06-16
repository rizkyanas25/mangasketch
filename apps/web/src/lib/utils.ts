// Format dates as e.g. OCT 19, 2026
export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d
      .toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();
  } catch (e) {
    return 'UNKNOWN DATE';
  }
};
