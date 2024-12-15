import React from 'react';
import { ResearchAnswer as ResearchAnswerType } from '../lib/api/researchApi';

interface ResearchAnswerProps {
    answer: ResearchAnswerType;
}

const ResearchAnswer: React.FC<ResearchAnswerProps> = ({ answer }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Research Answer
            </h2>
            <div className="prose dark:prose-invert max-w-none">
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {answer.answer}
                    </p>
                </div>
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Sources Used
                    </h3>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                        {answer.sources_used.map((source, index) => (
                            <li key={index}>
                                <a href={source} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="text-blue-600 dark:text-blue-400 hover:underline">
                                    {source}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Confidence Score: {answer.confidence_score.toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResearchAnswer; 