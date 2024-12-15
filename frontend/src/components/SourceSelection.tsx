import React, { useState } from 'react';
import { SearchResult } from '../lib/api/researchApi';

interface SourceSelectionProps {
    searchResults: SearchResult[];
    onSubmitSelected: (selectedResults: SearchResult[]) => void;
    isSubmitting: boolean;
}

const SourceSelection: React.FC<SourceSelectionProps> = ({ searchResults, onSubmitSelected, isSubmitting }) => {
    const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

    const toggleSource = (link: string) => {
        const newSelected = new Set(selectedSources);
        if (newSelected.has(link)) {
            newSelected.delete(link);
        } else {
            newSelected.add(link);
        }
        setSelectedSources(newSelected);
    };

    const toggleAll = () => {
        if (selectedSources.size === searchResults.length) {
            setSelectedSources(new Set());
        } else {
            setSelectedSources(new Set(searchResults.map(result => result.link)));
        }
    };

    const handleSubmit = () => {
        const selectedResults = searchResults.filter(result => selectedSources.has(result.link));
        onSubmitSelected(selectedResults);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Source Selection
                </h2>
                <button
                    className={`px-4 py-2 rounded-lg text-white ${
                        selectedSources.size === 0 || isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleSubmit}
                    disabled={selectedSources.size === 0 || isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : `Analyze ${selectedSources.size} Sources`}
                </button>
            </div>
            {searchResults.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                            <span>{searchResults.length} sources found</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedSources.size === searchResults.length && searchResults.length > 0}
                                    onChange={toggleAll}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span>Select All</span>
                            </div>
                        </div>
                        <span>{selectedSources.size} selected</span>
                    </div>
                    <div className="space-y-6">
                        {searchResults.map((result) => {
                            const isSelected = selectedSources.has(result.link);
                            return (
                                <div key={result.link}
                                    className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border 
                                        ${isSelected 
                                            ? 'border-blue-500 dark:border-blue-400' 
                                            : 'border-gray-200 dark:border-gray-700'} 
                                        hover:shadow-md transition-shadow cursor-pointer`}
                                    onClick={() => toggleSource(result.link)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSource(result.link)}
                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <h3 className="text-lg font-medium">
                                                    <a
                                                        href={result.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {result.title}
                                                    </a>
                                                </h3>
                                            </div>
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
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="mr-1">🔗</span> Visit Source
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
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

export default SourceSelection; 