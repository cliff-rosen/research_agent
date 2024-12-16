import React from 'react';
import ReactMarkdown from 'react-markdown';
import { QuestionAnalysis as QuestionAnalysisType } from '../lib/api/researchApi';

interface Props {
    analysis: QuestionAnalysisType | null;
    markdownContent: string;
    isLoading: boolean;
    onProceed: () => void;
}

const QuestionAnalysis: React.FC<Props> = ({ analysis, markdownContent, isLoading, onProceed }) => {
    const hasContent = markdownContent.length > 0 || (analysis && analysis.key_components.length > 0);
    const showMarkdown = markdownContent.length > 0 && (!analysis || analysis.key_components.length === 0);

    return (
        <div className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold mb-4">Analysis</h2>
                
                {isLoading && !hasContent ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                ) : showMarkdown ? (
                    <div className="text-gray-700 dark:text-gray-300">
                        <ReactMarkdown className="prose dark:prose-invert max-w-none">
                            {markdownContent}
                        </ReactMarkdown>
                    </div>
                ) : analysis ? (
                    <div className="text-gray-700 dark:text-gray-300 space-y-4">
                        {analysis.key_components.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Key Components</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.key_components.map((item, index) => (
                                        <li key={`key-${index}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysis.scope_boundaries.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Scope Boundaries</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.scope_boundaries.map((item, index) => (
                                        <li key={`scope-${index}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysis.success_criteria.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Success Criteria</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.success_criteria.map((item, index) => (
                                        <li key={`success-${index}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysis.conflicting_viewpoints.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Conflicting Viewpoints</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.conflicting_viewpoints.map((item, index) => (
                                        <li key={`conflict-${index}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <div className="flex justify-end mt-6">
                <button
                    onClick={onProceed}
                    disabled={isLoading || !hasContent}
                    className={`px-4 py-2 rounded-lg ${
                        isLoading || !hasContent
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isLoading ? 'Analyzing...' : 'Continue'}
                </button>
            </div>
        </div>
    );
};

export default QuestionAnalysis; 