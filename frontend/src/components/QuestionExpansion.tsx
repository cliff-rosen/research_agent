import React from 'react';
import { QuestionAnalysis } from '../lib/api/researchApi';
import ReactMarkdown from 'react-markdown';

interface Props {
    question: string;
    analysis: QuestionAnalysis;
    expandedQueries: string[];
    expandedQueriesMarkdown: string;
    isSearching: boolean;
    onSubmit: (queries: string[]) => void;
}

const QuestionExpansion: React.FC<Props> = ({
    question,
    analysis,
    expandedQueries,
    expandedQueriesMarkdown,
    isSearching,
    onSubmit
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Original Question</h3>
                <p className="text-gray-700 dark:text-gray-300">{question}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">AI Analysis & Query Expansion</h3>
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{expandedQueriesMarkdown}</ReactMarkdown>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Generated Search Queries</h3>
                <ul className="list-disc pl-5 space-y-2">
                    {expandedQueries.map((query, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                            {query}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onSubmit(expandedQueries)}
                    disabled={isSearching || expandedQueries.length === 0}
                    className={`px-4 py-2 rounded-lg ${
                        isSearching || expandedQueries.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isSearching ? 'Searching...' : 'Search with Generated Queries'}
                </button>
            </div>
        </div>
    );
};

export default QuestionExpansion; 