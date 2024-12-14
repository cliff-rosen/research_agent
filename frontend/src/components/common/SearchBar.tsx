import React, { useState } from 'react';
import { SearchResult } from '../../lib/api/searchApi';
import { researchApi, QuestionAnalysis } from '../../lib/api/researchApi';

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);

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

            // Then expand the question into multiple queries
            const expandedQueries = await researchApi.expandQuestion(query);

            // Execute all queries at once
            const searchResults = await researchApi.executeQueries(expandedQueries);
            setResults(searchResults);
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
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Key Components</h4>
                            <ul className="list-disc list-inside text-blue-600 dark:text-blue-400">
                                {analysis.key_components.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Scope Boundaries</h4>
                            <ul className="list-disc list-inside text-blue-600 dark:text-blue-400">
                                {analysis.scope_boundaries.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Success Criteria</h4>
                            <ul className="list-disc list-inside text-blue-600 dark:text-blue-400">
                                {analysis.success_criteria.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Potential Conflicts</h4>
                            <ul className="list-disc list-inside text-blue-600 dark:text-blue-400">
                                {analysis.conflicting_viewpoints.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
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