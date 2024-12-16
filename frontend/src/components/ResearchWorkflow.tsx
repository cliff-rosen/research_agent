import React, { useState } from 'react';
import { researchApi, QuestionAnalysis as QuestionAnalysisType, SearchResult, ResearchAnswer as ResearchAnswerType } from '../lib/api/researchApi';
import { searchApi, URLContent } from '../lib/api/searchApi';
import QuestionExpansion from '../components/QuestionExpansion';
import SourceSelection from './SourceSelection';
import QuestionAnalysis from './QuestionAnalysis';
import SourceAnalysis from './SourceAnalysis';
import ResearchAnswer from './ResearchAnswer';
import InitialQuestion from './InitialQuestion';

interface WorkflowStep {
    label: string;
    description: string;
    action: (data?: any) => Promise<void>;
    component: (props: any) => JSX.Element;
}

const ResearchWorkflow: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [analysis, setAnalysis] = useState<QuestionAnalysisType | null>(null);
    const [expandedQueries, setExpandedQueries] = useState<string[]>([]);
    const [error, setError] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSources, setSelectedSources] = useState<SearchResult[]>([]);
    const [sourceContent, setSourceContent] = useState<URLContent[]>([]);
    const [enhancedQuestion, setEnhancedQuestion] = useState<string>('');
    const [researchAnswer, setResearchAnswer] = useState<ResearchAnswerType | null>(null);

    const handleNext = (): void => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = (): void => {
        setActiveStep((prev) => prev - 1);
    };

    // Step 1 handler: Analyze the question
    const handleQuestionSubmit = async (): Promise<void> => {
        setIsLoading(true);
        setError('');
        setMarkdownContent('');
        setAnalysis(null);

        try {
            // Start the streaming analysis
            const analysisStream = researchApi.analyzeQuestionStream(question);
            let hasAdvanced = false;

            // Process the stream
            for await (const update of analysisStream) {
                // Move to next step on first valid update
                if (!hasAdvanced) {
                    hasAdvanced = true;
                    handleNext();
                }

                // Update markdown content
                setMarkdownContent(prev => prev + update.data);
            }

            // console.log('markdownContent\n', markdownContent);

            // Parse the final markdown into structured analysis for the next step
            const sections = markdownContent.split('\n## ');
            const finalAnalysis: QuestionAnalysisType = {
                key_components: [],
                scope_boundaries: [],
                success_criteria: [],
                conflicting_viewpoints: []
            };

            sections.forEach(section => {
                const lines = section.split('\n');
                const firstLine = lines[0].toLowerCase().trim();
                const items = lines
                    .slice(1)
                    .filter(line => line.trim().startsWith('- '))
                    .map(line => line.trim().slice(2));

                if (firstLine.includes('key components')) {
                    finalAnalysis.key_components = items;
                }
                else if (firstLine.includes('scope boundaries')) {
                    finalAnalysis.scope_boundaries = items;
                }
                else if (firstLine.includes('success criteria')) {
                    finalAnalysis.success_criteria = items;
                }
                else if (firstLine.includes('conflicting viewpoints')) {
                    finalAnalysis.conflicting_viewpoints = items;
                }
            });

            setAnalysis(finalAnalysis);
        } catch (err: unknown) {
            console.error('Error processing question:', err);
            setError('Failed to analyze question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2 handler: Expand the question
    const handleQueryExpansion = async (): Promise<void> => {
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
        } catch (err: unknown) {
            console.error('Error expanding question:', err);
            setError('Failed to expand question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Execute the queries
    const handleSubmitQueries = async (queries: string[]): Promise<void> => {
        try {
            setIsSearching(true);
            const results = await researchApi.executeQueries(queries);
            setSearchResults(results);
            handleNext();
        } catch (err: unknown) {
            console.error('Error executing queries:', err);
            setError('Failed to execute search queries. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Step 4 handler: Select sources
    const handleSourceSelection = async (selected: SearchResult[]): Promise<void> => {
        try {
            setIsLoading(true);
            setSelectedSources(selected);

            // Extract URLs from selected sources
            const urls = selected.map(source => source.link);

            // Fetch content for all selected URLs
            const content = await searchApi.fetchUrls(urls);
            setSourceContent(content);

            handleNext();
        } catch (err: unknown) {
            console.error('Error fetching source content:', err);
            setError('Failed to fetch source content. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 5 handler: Analyze the sources
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

    const workflowSteps: WorkflowStep[] = [
        {
            label: 'Initial Question',
            description: 'Enter your research question with as much context as possible',
            action: handleQuestionSubmit,
            component: (props) => (
                <InitialQuestion
                    {...props}
                    question={question}
                    isLoading={isLoading}
                    error={error}
                    onQuestionChange={setQuestion}
                    onSubmit={handleQuestionSubmit}
                />
            )
        },
        {
            label: 'Question Analysis',
            description: 'Review the breakdown of your question into key components',
            action: handleQueryExpansion,
            component: (props) => (
                <QuestionAnalysis
                    {...props}
                    analysis={analysis}
                    markdownContent={markdownContent}
                    isLoading={isLoading}
                    onProceed={handleQueryExpansion}
                />
            )
        },
        {
            label: 'Query Expansion',
            description: 'View and edit related search terms and alternative phrasings',
            action: handleSubmitQueries,
            component: (props) => (
                <QuestionExpansion
                    {...props}
                    question={question}
                    analysis={analysis!}
                    onSubmit={handleSubmitQueries}
                    expandedQueries={expandedQueries}
                    isSearching={isSearching}
                />
            )
        },
        {
            label: 'Source Selection',
            description: 'Review and select relevant sources',
            action: handleSourceSelection,
            component: (props) => (
                <SourceSelection
                    {...props}
                    searchResults={searchResults}
                    onSubmitSelected={handleSourceSelection}
                    isSubmitting={isLoading}
                />
            )
        },
        {
            label: 'Source Analysis',
            description: 'Review extracted information and conflicts',
            action: handleAnalysisProceed,
            component: (props) => (
                <SourceAnalysis
                    {...props}
                    sourceContent={sourceContent}
                    isLoading={isLoading}
                    onProceed={handleAnalysisProceed}
                />
            )
        },
        {
            label: 'Research Answer',
            description: 'View the research answer with citations and confidence levels',
            action: async () => Promise.resolve(),
            component: (props) => (
                researchAnswer ? (
                    <ResearchAnswer
                        {...props}
                        answer={researchAnswer}
                        originalQuestion={question}
                        analysis={analysis!}
                    />
                ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                        No research answer available. Please go back and try again.
                    </div>
                )
            )
        }
    ];

    const renderStepContent = (step: number) => {
        const currentStep = workflowSteps[step];
        return currentStep.component({});
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