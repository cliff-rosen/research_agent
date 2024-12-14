import React from 'react';
import { SearchResult } from '../lib/api/researchApi';

interface SourceReviewProps {
    searchResults: SearchResult[];
}

const SourceReview: React.FC<SourceReviewProps> = ({ searchResults }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Source Review
            </h2>
            {searchResults.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{searchResults.length} sources found</span>
                        <span>Sorted by relevance</span>
                    </div>
                    <div className="space-y-6">
                        {searchResults.map((result) => (
                            <div key={result.link}
                                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <h3 className="text-lg font-medium">
                                            <a
                                                href={result.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                {result.title}
                                            </a>
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                            <span className="inline-block w-4 h-4 mr-2">🌐</span>
                                            {result.displayLink}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            result.relevance_score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
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
                                    >
                                        <span className="mr-1">🔗</span> Visit Source
                                    </a>
                                    {/* Could add more actions here like Save, Share, etc. */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No sources found. Try adjusting your search queries.
                </div>
            )}
        </div>
    );
};

export default SourceReview; 