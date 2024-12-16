import React, { useState } from 'react';
import { QuestionAnalysisResponse } from '../lib/api/researchApi';
import ReactMarkdown from 'react-markdown';

interface Props {
    question: string;
    analysis: QuestionAnalysisResponse;
    expandedQueries: string[];
    expandedQueriesMarkdown: string;
    isLoading: boolean;
    onSubmit: (queries: string[]) => void;
}

const QuestionExpansion: React.FC<Props> = ({
    question,
    analysis,
    expandedQueries,
    expandedQueriesMarkdown,
    isLoading,
    onSubmit
}) => {
    const [showAsList, setShowAsList] = useState(false);
    const [selectedQueries, setSelectedQueries] = useState<Set<string>>(new Set(expandedQueries));

    const handleQueryToggle = (query: string) => {
        const newSelected = new Set(selectedQueries);
        if (newSelected.has(query)) {
            newSelected.delete(query);
        } else {
            newSelected.add(query);
        }
        setSelectedQueries(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedQueries.size === expandedQueries.length) {
            setSelectedQueries(new Set());
        } else {
            setSelectedQueries(new Set(expandedQueries));
        }
    };

    return (
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Original Question</h3>
                <p className="text-gray-700 dark:text-gray-300">{question}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">AI Analysis & Query Expansion</h3>
                    {!isLoading && (
                        <button
                            onClick={() => setShowAsList(!showAsList)}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            {showAsList ? 'Show as Text' : 'Show as List'}
                        </button>
                    )}
                </div>

                {!showAsList ? (
                    <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-ul:list-disc prose-ol:list-decimal">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-4">{children}</p>,
                                h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
                                ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                                li: ({ children }) => <li className="mb-1 text-gray-700 dark:text-gray-300">{children}</li>,
                                code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{children}</code>,
                            }}
                        >
                            {expandedQueriesMarkdown}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                {selectedQueries.size === expandedQueries.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            {expandedQueries.map((query, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <input
                                        type="checkbox"
                                        id={`query-${index}`}
                                        checked={selectedQueries.has(query)}
                                        onChange={() => handleQueryToggle(query)}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor={`query-${index}`}
                                        className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                    >
                                        {query}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onSubmit(showAsList ? Array.from(selectedQueries) : expandedQueries)}
                    disabled={isLoading || (showAsList ? selectedQueries.size === 0 : expandedQueries.length === 0)}
                    className={`px-4 py-2 rounded-lg ${
                        isLoading || (showAsList ? selectedQueries.size === 0 : expandedQueries.length === 0)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isLoading ? 'Loading...' : 
                     showAsList ? `Search with Selected Queries (${selectedQueries.size})` :
                     'Search with Generated Queries'}
                </button>
            </div>
        </div>
    );
};

export default QuestionExpansion; 