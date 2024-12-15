import React, { useState } from 'react';
import { researchApi, QuestionAnalysis as QuestionAnalysisType, SearchResult, ResearchAnswer as ResearchAnswerType } from '../lib/api/researchApi';
import { searchApi, URLContent } from '../lib/api/searchApi';
import QuestionExpansion from '../components/QuestionExpansion';
import SourceSelection from './SourceSelection';
import QuestionAnalysis from './QuestionAnalysis';
import SourceAnalysis from './SourceAnalysis';
import ResearchAnswer from './ResearchAnswer';

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
        label: 'Source Selection',
        description: 'Review and select relevant sources'
    },
    {
        label: 'Source Analysis',
        description: 'Review extracted information and conflicts'
    },
    {
        label: 'Research Answer',
        description: 'View the research answer with citations and confidence levels'
    }
];

const ResearchWorkflow: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<QuestionAnalysisType | null>(null);
    const [expandedQueries, setExpandedQueries] = useState<string[]>([]);
    const [error, setError] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSources, setSelectedSources] = useState<SearchResult[]>([]);
    const [sourceContent, setSourceContent] = useState<URLContent[]>([]);
    const [enhancedQuestion, setEnhancedQuestion] = useState<string>('');
    const [researchAnswer, setResearchAnswer] = useState<ResearchAnswerType | null>(null);

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
            const analysisResult = await researchApi.analyzeQuestion(question);
            setAnalysis(analysisResult);
            handleNext();
        } catch (error) {
            console.error('Error processing question:', error);
            setError('Failed to analyze question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQueryExpansion = async () => {
        if (!analysis) return;

        setIsLoading(true);
        setError('');
        try {
            // Create an enhanced question that includes the analysis context
            const enhancedQuestionText = `
Original Question: ${question}

Key Components:
${analysis.key_components.map(c => `- ${c}`).join('\n')}

Scope Boundaries:
${analysis.scope_boundaries.map(b => `- ${b}`).join('\n')}

Success Criteria:
${analysis.success_criteria.map(c => `- ${c}`).join('\n')}
            `.trim();

            setEnhancedQuestion(enhancedQuestionText);
            const expanded = await researchApi.expandQuestion(enhancedQuestionText);
            setExpandedQueries(expanded);
            handleNext();
        } catch (error) {
            console.error('Error expanding question:', error);
            setError('Failed to expand question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitQueries = async (queries: string[]) => {
        try {
            setIsSearching(true);
            const results = await researchApi.executeQueries(queries);
            setSearchResults(results);
            handleNext();
        } catch (error) {
            console.error('Error executing queries:', error);
            setError('Failed to execute search queries. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSourceSelection = async (selected: SearchResult[]) => {
        try {
            setIsLoading(true);
            setSelectedSources(selected);
            
            // Extract URLs from selected sources
            const urls = selected.map(source => source.link);
            
            // Fetch content for all selected URLs
            const content = await searchApi.fetchUrls(urls);
            setSourceContent(content);
            
            handleNext();
        } catch (error) {
            console.error('Error fetching source content:', error);
            setError('Failed to fetch source content. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalysisProceed = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            const answer = await researchApi.getResearchAnswer(enhancedQuestion, sourceContent);
            setResearchAnswer(answer);
            handleNext();
        } catch (error) {
            console.error('Error getting research answer:', error);
            setError('Failed to generate research answer. Please try again.');
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
                            className={`px-4 py-2 rounded-lg text-white ${isLoading || !question.trim()
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
                    <QuestionAnalysis
                        analysis={analysis}
                        isLoading={isLoading}
                        onProceed={handleQueryExpansion}
                    />
                ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                        No analysis available. Please go back and submit a question.
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            Expanded Search Queries
                        </h2>
                        <QuestionExpansion 
                            question={question}
                            analysis={analysis!}
                            onSubmit={handleSubmitQueries}
                            expandedQueries={expandedQueries}
                            isSearching={isSearching}
                        />
                    </div>
                );
            case 3:
                return <SourceSelection 
                    searchResults={searchResults} 
                    onSubmitSelected={handleSourceSelection}
                    isSubmitting={isLoading}
                />;
            case 4:
                return <SourceAnalysis 
                    sourceContent={sourceContent}
                    isLoading={isLoading}
                    onProceed={handleAnalysisProceed}
                />;
            case 5:
                return researchAnswer ? (
                    <ResearchAnswer answer={researchAnswer} />
                ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                        No research answer available. Please go back and try again.
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