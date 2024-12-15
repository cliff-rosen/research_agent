import React from 'react';
import { QuestionAnalysis as QuestionAnalysisType } from '../lib/api/researchApi';

interface QuestionAnalysisProps {
    analysis: QuestionAnalysisType;
    isLoading: boolean;
    onProceed: () => void;
}

const QuestionAnalysis: React.FC<QuestionAnalysisProps> = ({ analysis, isLoading, onProceed }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Question Analysis
            </h2>
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Key Components</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {analysis.key_components.map((component, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-400">{component}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Scope Boundaries</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {analysis.scope_boundaries.map((boundary, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-400">{boundary}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Success Criteria</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {analysis.success_criteria.map((criteria, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-400">{criteria}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Conflicting Viewpoints</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {analysis.conflicting_viewpoints.map((viewpoint, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-400">{viewpoint}</li>
                        ))}
                    </ul>
                </div>
                <div className="pt-4">
                    <button
                        className={`px-4 py-2 rounded-lg text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        onClick={onProceed}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Expand Question'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionAnalysis; 