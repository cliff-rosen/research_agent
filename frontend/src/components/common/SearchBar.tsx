import React, { useState } from 'react';
import { searchApi, SearchResult } from '../../lib/api/searchApi';

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
    pagemap?: {
        [key: string]: any;
    };
}

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const searchResults = await searchApi.search(query);
            setResults(searchResults);
        } catch (err) {
            setError(searchApi.handleError(err));
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search topics..."
                    className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        'Search'
                    )}
                </button>
            </form>

            {error && (
                <div className="text-red-500 mb-4">
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {results.map((result, index) => (
                            <li key={index} className="p-4">
                                <a
                                    href={result.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 -m-4 p-4"
                                >
                                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                        {result.title}
                                    </h3>
                                    <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                                        {result.displayLink}
                                    </div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        {result.snippet}
                                    </p>
                                    {/* {result.pagemap && (
                                        <div className="pagemap">
                                            {result.pagemap.cse_thumbnail && (
                                                <img 
                                                    src={result.pagemap.cse_thumbnail[0].src} 
                                                    alt={result.title}
                                                    width={result.pagemap.cse_thumbnail[0].width}
                                                    height={result.pagemap.cse_thumbnail[0].height}
                                                />
                                            )}
                                        </div>
                                    )} */}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}; 