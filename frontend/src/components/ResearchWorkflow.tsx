import React, { useState } from 'react';
import { researchApi, QuestionAnalysis } from '../lib/api/researchApi';

interface WorkflowStep {
    label: string;
    description: string;
}

const workflowSteps: WorkflowStep[] = [
    {
        label: 'Initial Question',
        description: 'Enter your research question with as much context as possible'
    },
    {
        label: 'Question Analysis',
        description: 'Review the breakdown of your question into key components'
    },
    {
        label: 'Query Expansion',
        description: 'View and edit related search terms and alternative phrasings'
    },
    {
        label: 'Source Review',
        description: 'Review and filter identified sources'
    },
    {
        label: 'Information Analysis',
        description: 'Review extracted information and conflicts'
    },
    {
        label: 'Final Answer',
        description: 'View the comprehensive answer with citations and confidence levels'
    }
];

const ResearchWorkflow: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
    const [error, setError] = useState<string>('');

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleQuestionSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            const analysis = await researchApi.analyzeQuestion(question);
            setAnalysis(analysis);
            handleNext();
        } catch (error) {
            console.error('Error processing question:', error);
            setError('Failed to analyze question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            Enter Your Research Question
                        </h2>
                        <textarea
                            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Enter your research question here..."
                        />
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                        <button
                            className={`px-4 py-2 rounded-lg text-white ${
                                isLoading || !question.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            onClick={handleQuestionSubmit}
                            disabled={!question.trim() || isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Analyze Question'}
                        </button>
                    </div>
                );
            case 1:
                return analysis ? (
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
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                        No analysis available. Please go back and submit a question.
                    </div>
                );
            default:
                return (
                    <div className="p-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Step content in development
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {workflowSteps.map((step, index) => (
                        <div key={step.label} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${index === activeStep
                                    ? 'bg-blue-600 text-white'
                                    : index < activeStep
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                {index + 1}
                            </div>
                            <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                                {step.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {renderStepContent(activeStep)}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
                <button
                    className={`px-4 py-2 rounded-lg ${activeStep === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                    onClick={handleBack}
                    disabled={activeStep === 0}
                >
                    Back
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {workflowSteps[activeStep].description}
                </p>
            </div>
        </div>
    );
};

export default ResearchWorkflow; 