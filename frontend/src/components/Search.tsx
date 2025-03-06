import React, { useState } from 'react';

// Define types for our diamond properties
type DiamondShape = 'Round' | 'Princess' | 'Cushion' | 'Oval' | 'Emerald' | 'Marquise' | 'Radiant' | 'Pear' | 'Heart';
type DiamondColor = 'Green' | 'Red'| 'White'| 'Yellow';
type Collection = 'Signature' | 'Vintage' | 'Modern' | 'Classic' | 'Luxury';

interface DiamondFilterProps {
    onSearch: (filters: DiamondFilters) => void;
}

interface DiamondFilters {
    name: string;
    priceMin: number;
    priceMax: number;
    shapes: DiamondShape[];
    colors: DiamondColor[];
    collections: Collection[];
}

const DiamondSearchFilter: React.FC<DiamondFilterProps> = () => {
    // Initial state for filters
    const [filters, setFilters] = useState<DiamondFilters>({
        name: '',
        priceMin: 0,
        priceMax: 100000,
        shapes: [],
        colors: [],
        collections: []
    });

    // Mobile responsiveness state
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Options for selects
    const shapeOptions: DiamondShape[] = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Marquise', 'Radiant', 'Pear', 'Heart'];
    const colorOptions: DiamondColor[] = ['Green', 'Red', 'White', 'Yellow'];
    const collectionOptions: Collection[] = ['Modern', 'Classic', 'Luxury'];

    // Handle input changes
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, name: e.target.value });
    };

    const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, priceMin: Number(e.target.value) });
    };

    const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, priceMax: Number(e.target.value) });
    };

    // Handle multi-select toggles
    const toggleShape = (shape: DiamondShape) => {
        setFilters(prevFilters => {
            if (prevFilters.shapes.includes(shape)) {
                return { ...prevFilters, shapes: prevFilters.shapes.filter(s => s !== shape) };
            } else {
                return { ...prevFilters, shapes: [...prevFilters.shapes, shape] };
            }
        });
    };

    const toggleColor = (color: DiamondColor) => {
        setFilters(prevFilters => {
            if (prevFilters.colors.includes(color)) {
                return { ...prevFilters, colors: prevFilters.colors.filter(c => c !== color) };
            } else {
                return { ...prevFilters, colors: [...prevFilters.colors, color] };
            }
        });
    };

    const toggleCollection = (collection: Collection) => {
        setFilters(prevFilters => {
            if (prevFilters.collections.includes(collection)) {
                return { ...prevFilters, collections: prevFilters.collections.filter(c => c !== collection) };
            } else {
                return { ...prevFilters, collections: [...prevFilters.collections, collection] };
            }
        });
    };

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(filters);
        // Close mobile filters if open
        setIsFiltersOpen(false);
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            name: '',
            priceMin: 0,
            priceMax: 100000,
            shapes: [],
            colors: [],
            collections: []
        });
    };

    // Toggle mobile filters visibility
    const toggleMobileFilters = () => {
        setIsFiltersOpen(!isFiltersOpen);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Find Your Perfect Diamond</h2>

                    {/* Mobile filter toggle */}
                    <button
                        type="button"
                        className="w-full md:hidden bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-3 px-4 rounded-md mb-4 flex items-center justify-between"
                        onClick={toggleMobileFilters}
                    >
                        <span>Filter Options</span>
                        <svg
                            className={`h-5 w-5 transform ${isFiltersOpen ? 'rotate-180' : ''} transition-transform duration-200`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Filter form */}
                    <div className={`${isFiltersOpen ? 'block' : 'hidden'} md:block`}>
                        <form onSubmit={handleSearch}>
                            {/* Name search */}
                            <div className="mb-6">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                                    Diamond Name:
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={filters.name}
                                    onChange={handleNameChange}
                                    placeholder="Search by name or SKU"
                                    className="bg-gray-800 w-full px-3 py-2 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Price range */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Price Range ($)</h3>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="w-full sm:w-1/2">
                                        <label htmlFor="priceMin" className="block text-xs text-gray-400 mb-1">Min:</label>
                                        <input
                                            type="number"
                                            id="priceMin"
                                            value={filters.priceMin}
                                            onChange={handlePriceMinChange}
                                            min="0"
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="w-full sm:w-1/2">
                                        <label htmlFor="priceMax" className="block text-xs text-gray-400 mb-1">Max:</label>
                                        <input
                                            type="number"
                                            id="priceMax"
                                            value={filters.priceMax}
                                            onChange={handlePriceMaxChange}
                                            min="0"
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Diamond shapes */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Shape</h3>
                                <div className="flex flex-wrap gap-2">
                                    {shapeOptions.map(shape => (
                                        <div
                                            key={shape}
                                            className={`flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                                                filters.shapes.includes(shape)
                                                    ? 'bg-blue-900 border-blue-700 text-blue-200'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                            }`}
                                            onClick={() => toggleShape(shape)}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`shape-${shape}`}
                                                checked={filters.shapes.includes(shape)}
                                                onChange={() => {}}
                                                className="mr-2 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                                            />
                                            <label htmlFor={`shape-${shape}`} className="text-sm cursor-pointer">
                                                {shape}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Diamond colors */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Color</h3>
                                <div className="flex flex-wrap gap-2">
                                    {colorOptions.map(color => (
                                        <div
                                            key={color}
                                            className={`flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                                                filters.colors.includes(color)
                                                    ? 'bg-blue-900 border-blue-700 text-blue-200'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                            }`}
                                            onClick={() => toggleColor(color)}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`color-${color}`}
                                                checked={filters.colors.includes(color)}
                                                onChange={() => {}}
                                                className="mr-2 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                                            />
                                            <label htmlFor={`color-${color}`} className="text-sm cursor-pointer">
                                                {color}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Collections */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-gray-300 mb-2">Collection</h3>
                                <div className="flex flex-wrap gap-2">
                                    {collectionOptions.map(collection => (
                                        <div
                                            key={collection}
                                            className={`flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                                                filters.collections.includes(collection)
                                                    ? 'bg-blue-900 border-blue-700 text-blue-200'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                            }`}
                                            onClick={() => toggleCollection(collection)}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`collection-${collection}`}
                                                checked={filters.collections.includes(collection)}
                                                onChange={() => {}}
                                                className="mr-2 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-offset-gray-800"
                                            />
                                            <label htmlFor={`collection-${collection}`} className="text-sm cursor-pointer">
                                                {collection}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-grow"
                                >
                                    Search Diamonds
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-md border border-gray-600 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Filter summary (shows selected filters) */}
                <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-400">Active filters:</span>
                        {filters.shapes.length > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded-full">
                                {filters.shapes.length} shapes
                            </span>
                        )}
                        {filters.colors.length > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded-full">
                                {filters.colors.length} colors
                            </span>
                        )}
                        {filters.collections.length > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded-full">
                                {filters.collections.length} collections
                            </span>
                        )}
                        {filters.priceMin > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded-full">
                                Min: ${filters.priceMin}
                            </span>
                        )}
                        {filters.priceMax < 100000 && (
                            <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded-full">
                                Max: ${filters.priceMax}
                            </span>
                        )}
                        {filters.name && (
                            <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded-full">
                                Name: {filters.name}
                            </span>
                        )}
                        {!filters.shapes.length && !filters.colors.length && !filters.collections.length &&
                            filters.priceMin === 0 && filters.priceMax === 100000 && !filters.name && (
                                <span className="text-sm text-gray-500">No filters applied</span>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiamondSearchFilter;