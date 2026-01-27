/**
 * Custom Hook: usePagination
 * Manages pagination state
 */

import { useState } from 'react';

export const usePagination = (pageSize = 12) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const goToPage = (pageNum) => {
    setCurrentPage(Math.max(1, Math.min(pageNum, totalPages)));
  };

  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  const prevPage = () => {
    goToPage(currentPage - 1);
  };

  const updatePaginationInfo = (total) => {
    setTotalItems(total);
    setTotalPages(Math.ceil(total / pageSize));
  };

  const resetPagination = () => {
    setCurrentPage(1);
    setTotalPages(0);
    setTotalItems(0);
  };

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    updatePaginationInfo,
    resetPagination
  };
};
