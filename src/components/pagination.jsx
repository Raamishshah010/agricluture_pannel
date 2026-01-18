
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Pagination = ({
    totalPages = 22,
    initialPage = 2,
    onPageChange
}) => {
    const t = useTranslation();
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && !loading) {
            setLoading(true);
            setCurrentPage(page);
            if (onPageChange) onPageChange(page);
            setLoading(false);
        }
    };

    const getPageNumbers = (isMobile = false) => {
        const pages = [];
        const maxVisible = isMobile ? 3 : 7;
        const showEllipsis = totalPages > maxVisible;

        if (!showEllipsis) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (isMobile) {
                // Mobile: Show only current page and neighbors
                if (currentPage > 1) pages.push(1);
                if (currentPage > 2) pages.push('ellipsis');
                
                if (currentPage > 1 && currentPage < totalPages) {
                    pages.push(currentPage);
                } else if (currentPage === 1) {
                    pages.push(1);
                    if (totalPages > 1) pages.push(2);
                } else {
                    pages.push(totalPages - 1);
                    pages.push(totalPages);
                }
                
                if (currentPage < totalPages - 1) pages.push('ellipsis');
                if (currentPage < totalPages) pages.push(totalPages);
            } else {
                // Desktop: Original logic
                if (currentPage <= 3) {
                    for (let i = 1; i <= 5; i++) {
                        pages.push(i);
                    }
                    pages.push('ellipsis');
                    pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push('ellipsis');
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                        pages.push(i);
                    }
                } else {
                    pages.push(1);
                    pages.push('ellipsis');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i);
                    }
                    pages.push('ellipsis');
                    pages.push(totalPages);
                }
            }
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center sm:justify-start my-3 sm:my-5 bg-gray-50 px-2 sm:px-0">
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Previous Button */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    aria-label={t('common.components.previousPage')}
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>

                {/* Desktop Pagination */}
                <div className="hidden md:flex items-center gap-2">
                    {getPageNumbers(false).map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <div
                                    key={`ellipsis-${index}`}
                                    className="w-12 h-12 flex items-center justify-center text-gray-400 text-xl"
                                >
                                    ...
                                </div>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                disabled={loading}
                                className={`w-12 h-12 cursor-pointer flex items-center justify-center rounded-lg text-xl font-medium transition-all ${
                                    currentPage === page
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-100'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={`Go to page ${page}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Tablet Pagination */}
                <div className="hidden sm:flex md:hidden items-center gap-1.5">
                    {getPageNumbers(false).map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <div
                                    key={`ellipsis-${index}`}
                                    className="w-10 h-10 flex items-center justify-center text-gray-400 text-lg"
                                >
                                    ...
                                </div>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                disabled={loading}
                                className={`w-10 h-10 cursor-pointer flex items-center justify-center rounded-lg text-base font-medium transition-all ${
                                    currentPage === page
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-100'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={`Go to page ${page}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Pagination */}
                <div className="flex sm:hidden items-center gap-1">
                    {getPageNumbers(true).map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <div
                                    key={`ellipsis-${index}`}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 text-base"
                                >
                                    ...
                                </div>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                disabled={loading}
                                className={`w-8 h-8 cursor-pointer flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                    currentPage === page
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-100'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={`Go to page ${page}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Page Info - Mobile Only */}
                <div className="flex sm:hidden items-center mx-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {currentPage} / {totalPages}
                    </span>
                </div>

                {/* Next Button */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-gray-200 text-gray-400 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    aria-label={t('common.components.nextPage')}
                >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;