import React from 'react';
import { URLContent } from '../lib/api/searchApi';

interface SourceAnalysisProps {
    sourceContent: URLContent[];
    isLoading: boolean;
    onProceed: () => void;
}

const SourceAnalysis: React.FC<SourceAnalysisProps> = ({ sourceContent, isLoading, onProceed }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Source Analysis
            </h2>
            <div className="space-y-8">
                {sourceContent.map((content, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-4">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                                    {content.title || 'Untitled Source'}
                                </h3>
                                <a 
                                    href={content.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    View Original Source
                                </a>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 break-all">
                                URL: {content.url}
                            </div>
                        </div>

                        {content.error ? (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                <div className="text-red-600 dark:text-red-400 font-medium mb-1">Error Loading Source</div>
                                <div className="text-red-500 dark:text-red-300 text-sm">
                                    {content.error}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Page Title
                                    </h4>
                                    <div className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                        {content.title}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Content
                                    </h4>
                                    <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                        <div className="text-gray-800 dark:text-gray-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
                                            {content.text}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="pt-4">
                <button
                    className={`px-4 py-2 rounded-lg text-white ${
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