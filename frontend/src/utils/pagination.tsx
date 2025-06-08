// utils/pagination.ts
export const paginate = <T,>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
): T[] => {
  const start = (currentPage - 1) * itemsPerPage;
  return items.slice(start, start + itemsPerPage);
};
