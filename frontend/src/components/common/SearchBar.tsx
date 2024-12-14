import React, { useState } from 'react';
import { searchApi, SearchResult } from '../../lib/api/searchApi';
import { researchApi, AnalyzeQuestionResponse } from '../../lib/api/researchApi';

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<AnalyzeQuestionResponse | null>(null);

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setAnalysis(null);

        try {
            // First analyze the question
            const analysisResult = await researchApi.analyzeQuestion(query);
            setAnalysis(analysisResult);

            // Then perform searches for each suggested query
            const searchPromises = analysisResult.suggested_queries.map(q => searchApi.search(q));
            const searchResults = await Promise.all(searchPromises);

            // Combine and deduplicate results
            const allResults = searchResults.flat();
            const uniqueResults = allResults.filter((result, index) => {
                return allResults.findIndex(r => r.link === result.link) === index;
            });

            setResults(uniqueResults);
        } catch (err) {
            setError(researchApi.handleError(err));
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            <form onSubmit={handleQuestionSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a research question..."
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
                        'Research'
                    )}
                </button>
            </form>

            {error && (
                <div className="text-red-500 mb-4">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Analysis
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-2">
                        {analysis.analysis}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {analysis.suggested_queries.map((query, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm"
                            >
                                {query}
                            </span>
                        ))}
                    </div>
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
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Relevance: {result.relevance_score.toFixed(1)}%
                                    </div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        {result.snippet}
                                    </p>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}; 