import { SetStateAction } from "react";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
    step: number;
    onPageChange: (pageNumber: React.SetStateAction<number>) => void;
}

const  PaginationTemp = ({ totalPages = 1, currentPage = 1, step = 1, onPageChange }: PaginationProps) => {
    // Function to handle page change
    const handlePageChange = (pageNumber: SetStateAction<number>) => {
        onPageChange(pageNumber);
    };

    // Function to generate page numbers
    const generatePageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = generatePageNumbers();

    return (
        <div className="flex flex-col items-center justify-between py-4 sm:flex-row sm:py-8">
            <button
                onClick={() => currentPage > 1 && handlePageChange(currentPage - step)}
                className="mb-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:mb-0"
                disabled={currentPage === 1}
            >
                ← Previous
            </button>

            {/* Page Numbers */}
            <div className="flex flex-wrap justify-center space-x-2">
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`mb-2 px-3 py-2 text-sm font-medium rounded-md ${
                            page === currentPage
                                ? "bg-indigo-600 text-white dark:bg-indigo-500"
                                : "bg-white text-gray-700 hover:bg-indigo-600 hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-500"
                        } sm:mb-0`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            {/* Next Button */}
            <button
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + step)}
                className="mt-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:mt-0"
                disabled={currentPage === totalPages}
            >
                Next →
            </button>
        </div>
    );
};

export default PaginationTemp;