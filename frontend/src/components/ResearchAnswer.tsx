import React from 'react';
import { ResearchAnswer as ResearchAnswerType } from '../lib/api/researchApi';

interface ResearchAnswerProps {
    answer: ResearchAnswerType;
    originalQuestion: string;
    analysis: {
        key_components: string[];
        scope_boundaries: string[];
        success_criteria: string[];
        conflicting_viewpoints: string[];
    };
}

const ResearchAnswer: React.FC<ResearchAnswerProps> = ({ answer, originalQuestion, analysis }) => {
    return (
        <div className="space-y-8">
            {/* Question and Analysis Section */}
            <div className="space-y-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Original Question
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                        {originalQuestion}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Key Components
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                            {analysis.key_components.map((component, index) => (
                                <li key={index}>{component}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Scope Boundaries
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                            {analysis.scope_boundaries.map((boundary, index) => (
                                <li key={index}>{boundary}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Success Criteria
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                            {analysis.success_criteria.map((criteria, index) => (
                                <li key={index}>{criteria}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Conflicting Viewpoints
                        </h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                            {analysis.conflicting_viewpoints.map((viewpoint, index) => (
                                <li key={index}>{viewpoint}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Research Answer Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Research Answer
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
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
        </div>
    );
};

export default ResearchAnswer; 