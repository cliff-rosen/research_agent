import React from 'react';
import { QuestionAnalysis } from '../lib/api/researchApi';

interface QuestionExpansionProps {
    question: string;
    analysis: QuestionAnalysis;
    onSubmit: (queries: string[]) => void;
    expandedQueries: string[];
    isSearching: boolean;
}

const QuestionExpansion: React.FC<QuestionExpansionProps> = ({
    expandedQueries,
    onSubmit,
    isSearching
}) => {
    return (
        <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
                Based on your question and its analysis, here are the expanded search queries:
            </p>
            <ul className="list-disc pl-5 space-y-1">
                {expandedQueries.map((query, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400">{query}</li>
                ))}
            </ul>
            <button
                className={`px-4 py-2 rounded-lg text-white ${
                    isSearching || expandedQueries.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={() => onSubmit(expandedQueries)}
                disabled={isSearching || expandedQueries.length === 0}
            >
                {isSearching ? 'Searching...' : 'Search Sources'}
            </button>
        </div>
    );
};

export default QuestionExpansion; 