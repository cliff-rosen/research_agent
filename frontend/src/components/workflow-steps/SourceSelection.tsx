import React, { useState, useEffect } from 'react';
import { SearchResult } from '../../lib/api/researchApi';

interface SourceSelectionProps {
    searchResults: SearchResult[];
    selectedSources: Set<SearchResult>;
    onSourceToggle: (source: SearchResult) => void;
    onSelectAll: () => void;
    isLoading?: boolean;
}

const SourceSelection: React.FC<SourceSelectionProps> = ({
    searchResults,
    selectedSources,
    onSourceToggle,
    onSelectAll,
    isLoading = false
}) => {
    const [sortedResults, setSortedResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        setSortedResults([...searchResults].sort((a, b) => b.relevance_score - a.relevance_score));
    }, [searchResults]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                    <span>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-pulse">Searching...</span>
                                {searchResults.length > 0 && (
                                    <span>({searchResults.length} sources so far)</span>
                                )}
                            </span>
                        ) : (
                            `${searchResults.length} sources found`
                        )}
                    </span>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={selectedSources.size === searchResults.length && searchResults.length > 0}
                            onChange={onSelectAll}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span>Select All</span>
                    </div>
                </div>
                <span>{selectedSources.size} selected</span>
            </div>
            <div className="space-y-6">
                {sortedResults.map((result, index) => (
                    <div
                        key={index}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-colors ${selectedSources.has(result)
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        onClick={() => onSourceToggle(result)}
                    >
                        <div className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedSources.has(result)}
                                            onChange={() => onSourceToggle(result)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            {result.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                        <span className="inline-block w-4 h-4 mr-2">🌐</span>
                                        {result.displayLink}
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${result.relevance_score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        result.relevance_score >= 70 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {result.relevance_score.toFixed(0)}% relevant
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {result.snippet}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center space-x-4 text-sm">
                                <a
                                    href={result.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="mr-1">🔗</span> Visit Source
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SourceSelection; 