import React from 'react';
import { ResearchAnswer as ResearchAnswerType, ResearchEvaluation } from '../../lib/api/researchApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResearchAnswerProps {
    answer: ResearchAnswerType;
    originalQuestion: string;
    analysis: {
        key_components: string[];
        scope_boundaries: string[];
        success_criteria: string[];
        conflicting_viewpoints: string[];
    };
    evaluation: ResearchEvaluation | null;
}

const ResearchAnswer: React.FC<ResearchAnswerProps> = ({ answer, originalQuestion, analysis, evaluation }) => {
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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Research Answer
                    </h2>
                    <div className="flex items-center bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-full">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                            Confidence Score: {answer.confidence_score.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="markdown-content"
                            components={{
                                // Override heading styles to match our design
                                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-4" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-3" {...props} />,
                                p: ({ node, ...props }) => <p className="text-gray-800 dark:text-gray-200 mb-4" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                                li: ({ node, ...props }) => <li className="text-gray-800 dark:text-gray-200 mb-1" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote
                                        className="border-l-4 border-blue-500 pl-4 py-2 mb-4 text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded"
                                        {...props}
                                    />
                                ),
                                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                                hr: ({ node, ...props }) => <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />
                            }}
                        >
                            {answer.answer}
                        </ReactMarkdown>
                    </div>

                    {/* Evaluation Section */}
                    {evaluation && (
                        <div className="mt-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Answer Evaluation
                            </h3>
                            
                            {/* Scores */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Completeness</div>
                                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                        {evaluation.completeness_score.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                        {evaluation.accuracy_score.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Relevance</div>
                                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                        {evaluation.relevance_score.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall</div>
                                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                        {evaluation.overall_score.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Missing Aspects */}
                            {evaluation.missing_aspects.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Missing Aspects
                                    </h4>
                                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                                        {evaluation.missing_aspects.map((aspect, index) => (
                                            <li key={index}>{aspect}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Improvement Suggestions */}
                            {evaluation.improvement_suggestions.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Improvement Suggestions
                                    </h4>
                                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                                        {evaluation.improvement_suggestions.map((suggestion, index) => (
                                            <li key={index}>{suggestion}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Conflicting Aspects */}
                            {evaluation.conflicting_aspects.length > 0 && (
                                <div>
                                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Conflicting Aspects
                                    </h4>
                                    <div className="space-y-3">
                                        {evaluation.conflicting_aspects.map((conflict, index) => (
                                            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                                                    {conflict.aspect}
                                                </div>
                                                <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                                                    {conflict.conflict}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sources Section */}
                    <div className="mt-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Sources Referenced
                        </h3>
                        <ul className="space-y-2">
                            {answer.sources_used.map((source, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm mr-3">
                                        {index + 1}
                                    </span>
                                    <a href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                                        {source}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearchAnswer;