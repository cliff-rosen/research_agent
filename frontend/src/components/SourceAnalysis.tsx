import React, { useState } from 'react';
import { URLContent } from '../lib/api/searchApi';

interface SourceAnalysisProps {
    sourceContent: URLContent[];
    isLoading: boolean;
    onProceed: () => void;
}

const SourceAnalysis: React.FC<SourceAnalysisProps> = ({ sourceContent, isLoading, onProceed }) => {
    const [expandedSources, setExpandedSources] = useState<number[]>([]);

    const toggleSource = (index: number) => {
        setExpandedSources(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Source Analysis
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {sourceContent.length} sources found
                </div>
            </div>

            <div className="space-y-4">
                {sourceContent.map((content, index) => {
                    const isExpanded = expandedSources.includes(index);
                    return (
                        <div 
                            key={index} 
                            className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden"
                        >
                            {/* Header Section */}
                            <div 
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                                onClick={() => toggleSource(index)}
                            >
                                <div className="flex items-start">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {content.title || 'Untitled Source'}
                                            </h3>
                                            <a 
                                                href={content.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600 text-sm flex-shrink-0"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                View Source
                                            </a>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {content.url}
                                        </div>
                                    </div>
                                    <button 
                                        className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        <svg 
                                            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content Section */}
                            {isExpanded && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800">
                                    {content.error ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                            <div className="text-red-600 dark:text-red-400 font-medium mb-1">
                                                Error Loading Source
                                            </div>
                                            <div className="text-red-500 dark:text-red-300 text-sm">
                                                {content.error}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Text Content */}
                                            <div className="prose dark:prose-invert max-w-none">
                                                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-inner">
                                                    <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-y-auto max-h-[500px]">
                                                        {content.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Button */}
            <div className="pt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Click on a source to expand/collapse its content
                </div>
                <button
                    className={`px-6 py-2 rounded-lg text-white ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={onProceed}
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Generate Final Answer'}
                </button>
            </div>
        </div>
    );
};

export default SourceAnalysis; 