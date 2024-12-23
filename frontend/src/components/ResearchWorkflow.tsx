import React, { useState } from 'react';
import { researchApi, QuestionAnalysisResponse, SearchResult, ResearchAnswer as ResearchAnswerType, ResearchEvaluation } from '../lib/api/researchApi';
import { searchApi, URLContent } from '../lib/api/searchApi';
import {
    InitialQuestion,
    QuestionImprovement,
    QuestionAnalysis,
    QuestionExpansion,
    SourceSelection,
    SourceAnalysis,
    ResearchAnswer
} from './workflow-steps';

interface WorkflowStep {
    label: string;
    description: string;
    action: (data?: any) => Promise<void>;
    component: (props: any) => JSX.Element;
    actionButtonText: (state?: any) => string;
    isDisabled?: (state?: any) => boolean;
}

const ResearchWorkflow: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [_isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string>('');

    const [question, setQuestion] = useState('');

    const [analysisMarkdown, setAnalysisMarkdown] = useState<string>('');
    const [analysis, setAnalysis] = useState<QuestionAnalysisResponse | null>(null);

    const [enhancedQuestion, setEnhancedQuestion] = useState<string>('');
    const [expandedQueriesMarkdown, setExpandedQueriesMarkdown] = useState<string>('');
    const [expandedQueries, setExpandedQueries] = useState<string[]>([]);

    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [_selectedSources, setSelectedSources] = useState<SearchResult[]>([]);
    const [sourceContent, setSourceContent] = useState<URLContent[]>([]);
    const [researchAnswer, setResearchAnswer] = useState<ResearchAnswerType | null>(null);
    const [evaluation, setEvaluation] = useState<ResearchEvaluation | null>(null);

    const [showAsList, setShowAsList] = useState(false);
    const [selectedQueries, setSelectedQueries] = useState<Set<string>>(new Set());
    const [selectedSourcesSet, setSelectedSourcesSet] = useState<Set<SearchResult>>(new Set());

    const [improvedQuestion, setImprovedQuestion] = useState<QuestionImprovement | null>(null);
    const [isUsingImprovedQuestion, setIsUsingImprovedQuestion] = useState(false);

    // Step 1 handler: Submit initial question for improvement
    const handleInitialSubmit = async (): Promise<void> => {
        setIsLoading(true);
        setError('');
        setImprovedQuestion(null);

        try {
            const improvement = await researchApi.improveQuestion(question);
            setImprovedQuestion(improvement);
            handleNext();
        } catch (err: unknown) {
            console.error('Error improving question:', err);
            setError('Failed to improve question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle question editing
    const handleQuestionEdit = (editedQuestion: string) => {
        setQuestion(editedQuestion);
        // Reset improvement state since we're using a custom edited version
        setIsUsingImprovedQuestion(false);
    };

    // Step 2 handler: Improve the question
    const handleImprovedQuestionSubmit = async (): Promise<void> => {
        // Update the question if using improved version
        if (isUsingImprovedQuestion && improvedQuestion) {
            setQuestion(improvedQuestion.improved_question);
        }

        // Proceed with question analysis
        await handleQuestionSubmit();
    };

    // Step 2a handler: Analyze the question
    const handleQuestionSubmit = async (): Promise<void> => {
        setIsLoading(true);
        setError('');
        setAnalysisMarkdown('');
        setAnalysis(null);

        try {
            // Start the streaming analysis
            const analysisStream = researchApi.analyzeQuestionStream(question);
            let hasAdvanced = false;
            let accumulatedContent = '';

            // Process the stream
            for await (const update of analysisStream) {
                // Move to next step on first valid update
                if (!hasAdvanced) {
                    hasAdvanced = true;
                    handleNext();
                }

                accumulatedContent += update.data;
                // Update display content
                setAnalysisMarkdown(accumulatedContent);
            }

            // Parse the final accumulated content into structured analysis
            const sections = accumulatedContent.split('\n## ');
            const finalAnalysis: QuestionAnalysisResponse = {
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

    // Step 3 handler: Expand the question
    const handleQueryExpansion = async (): Promise<void> => {
        if (!analysis) return;

        setIsLoading(true);
        setError('');
        setExpandedQueriesMarkdown('');
        setExpandedQueries([]);

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

            // Start the streaming expansion
            const expansionStream = researchApi.expandQuestionStream(enhancedQuestionText);
            let hasAdvanced = false;
            let accumulatedContent = '';

            // Process the stream
            for await (const update of expansionStream) {
                // Move to next step on first valid update
                if (!hasAdvanced) {
                    hasAdvanced = true;
                    handleNext();
                }

                accumulatedContent += update.data;
                setExpandedQueriesMarkdown(accumulatedContent);

                // Extract queries from markdown content
                // Assuming the format is a list with "- " prefix
                const queries = accumulatedContent
                    .split('\n')
                    .filter(line => line.trim().startsWith('- '))
                    .map(line => line.trim().slice(2));

                setExpandedQueries(queries);
            }
        } catch (err: unknown) {
            console.error('Error expanding question:', err);
            setError('Failed to expand question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Execute the queries
    const handleSubmitQueries = async (queries: string[]): Promise<void> => {
        try {
            setIsLoading(true);
            setSearchResults([]);
            const expansionStream = researchApi.executeQueriesStream(queries);
            let hasAdvanced = false;
            let accumulatedContent = '';

            for await (const update of expansionStream) {
                if (!hasAdvanced) {
                    hasAdvanced = true;
                    handleNext();
                }

                // Accumulate the content
                accumulatedContent += update.data;

                // Try to parse complete JSON objects
                try {
                    // Split by newlines in case we have multiple complete objects
                    const lines = accumulatedContent.split('\n');

                    // Process all complete lines except the last one (which might be incomplete)
                    const completeLines = lines.slice(0, -1);

                    for (const line of completeLines) {
                        if (line.trim()) {
                            const results = JSON.parse(line);
                            setSearchResults(prev => [...prev, ...results]);
                        }
                    }

                    // Keep the last potentially incomplete line for next iteration
                    accumulatedContent = lines[lines.length - 1];
                } catch (parseError) {
                    // If parsing fails, keep accumulating content
                    continue;
                }
            }

            // Process any remaining content after stream ends
            if (accumulatedContent.trim()) {
                try {
                    const results = JSON.parse(accumulatedContent);
                    setSearchResults(prev => [...prev, ...results]);
                } catch (parseError) {
                    console.error('Error parsing final chunk:', parseError);
                }
            }
        } catch (err: unknown) {
            console.error('Error executing queries:', err);
            setError('Failed to execute search queries. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 5: Select sources
    const handleSourceSelection = async (_selected: SearchResult[]): Promise<void> => {
        try {
            setIsLoading(true);
            setSelectedSources(Array.from(selectedSourcesSet));

            // Extract URLs from selected sources
            const urls = Array.from(selectedSourcesSet).map(source => source.link);

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

    // Step 6: Analyze the sources
    const handleAnalysisProceed = async () => {
        try {
            setIsLoading(true);
            setError('');

            // Get the research answer
            const answer = await researchApi.getResearchAnswer(enhancedQuestion, sourceContent);
            setResearchAnswer(answer);

            // Evaluate the answer if we have the necessary components
            if (analysis) {
                const answerEvaluation = await researchApi.evaluateAnswer(
                    question,
                    analysis,
                    answer.answer
                );
                setEvaluation(answerEvaluation);
            }

            handleNext();
        } catch (error) {
            console.error('Error getting research answer:', error);
            setError('Failed to generate research answer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    /// Helper functionss for workflow steps

    // Helper functions for Query Expansion
    const handleQueryToggle = (query: string) => {
        const newSelected = new Set(selectedQueries);
        if (newSelected.has(query)) {
            newSelected.delete(query);
        } else {
            newSelected.add(query);
        }
        setSelectedQueries(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedQueries.size === expandedQueries.length) {
            setSelectedQueries(new Set());
        } else {
            setSelectedQueries(new Set(expandedQueries));
        }
    };

    // Helper functions for Source Selection
    const handleSourceSelectAll = () => {
        if (selectedSourcesSet.size === searchResults.length) {
            setSelectedSourcesSet(new Set());
        } else {
            setSelectedSourcesSet(new Set(searchResults));
        }
    };

    // Helper functions for Source Analysis
    const handleSourceToggle = (source: SearchResult) => {
        const newSelected = new Set(selectedSourcesSet);
        if (newSelected.has(source)) {
            newSelected.delete(source);
        } else {
            newSelected.add(source);
        }
        setSelectedSourcesSet(newSelected);
    };


    // Functions for all steps

    const handleNext = (): void => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = (): void => {
        setActiveStep((prev) => prev - 1);
    };

    const handleNewQuestion = (): void => {
        setActiveStep(0);
        setIsLoading(false);
        setIsSearching(false);
        setError('');
        setQuestion('');
        setAnalysisMarkdown('');
        setAnalysis(null);
        setEnhancedQuestion('');
        setExpandedQueriesMarkdown('');
        setExpandedQueries([]);
        setSearchResults([]);
        setSelectedSources([]);
        setSelectedSourcesSet(new Set());
        setSourceContent([]);
        setResearchAnswer(null);
        setEvaluation(null);
    };

    const renderStepContent = (step: number) => {
        const currentStep = workflowSteps[step];
        return currentStep.component({});
    };


    const workflowSteps: WorkflowStep[] = [
        {
            label: 'Initial Question',
            description: 'Enter your research question with as much context as possible',
            action: handleInitialSubmit,
            actionButtonText: () => 'Improve Question',
            isDisabled: () => !question.trim(),
            component: (props) => (
                <InitialQuestion
                    {...props}
                    question={question}
                    error={error}
                    onQuestionChange={setQuestion}
                />
            )
        },
        {
            label: 'Question Improvement',
            description: 'Review and approve suggested improvements to your question',
            action: handleImprovedQuestionSubmit,
            actionButtonText: () => 'Proceed with Analysis',
            isDisabled: () => !improvedQuestion,
            component: (props) => (
                <QuestionImprovement
                    {...props}
                    improvement={improvedQuestion}
                    isUsingImprovedQuestion={isUsingImprovedQuestion}
                    onToggleUseImproved={setIsUsingImprovedQuestion}
                    onQuestionEdit={handleQuestionEdit}
                    originalQuestion={question}
                />
            )
        },
        {
            label: 'Question Analysis',
            description: 'Review the breakdown of your question into key components',
            action: handleQueryExpansion,
            actionButtonText: () => 'Proceed to Query Expansion',
            isDisabled: () => !analysis,
            component: (props) => (
                <QuestionAnalysis
                    {...props}
                    analysisMarkdown={analysisMarkdown}
                    question={question}
                />
            )
        },
        {
            label: 'Query Expansion',
            description: 'View and edit related search terms and alternative phrasings',
            action: () => handleSubmitQueries(showAsList ? Array.from(selectedQueries) : expandedQueries),
            actionButtonText: () => showAsList
                ? `Search with Selected Queries (${selectedQueries.size})`
                : 'Search with Generated Queries',
            isDisabled: () => showAsList
                ? selectedQueries.size === 0
                : expandedQueries.length === 0,
            component: (props) => (
                <QuestionExpansion
                    {...props}
                    question={question}
                    expandedQueries={expandedQueries}
                    expandedQueriesMarkdown={expandedQueriesMarkdown}
                    isLoading={isLoading}
                    showAsList={showAsList}
                    setShowAsList={setShowAsList}
                    selectedQueries={selectedQueries}
                    onQueryToggle={handleQueryToggle}
                    onSelectAll={handleSelectAll}
                />
            )
        },
        {
            label: 'Source Selection',
            description: 'Review and select relevant sources',
            action: () => handleSourceSelection([]),
            actionButtonText: () => `Analyze Selected Sources (${selectedSourcesSet.size})`,
            isDisabled: () => selectedSourcesSet.size === 0,
            component: (props) => (
                <SourceSelection
                    {...props}
                    searchResults={searchResults}
                    selectedSources={selectedSourcesSet}
                    onSourceToggle={handleSourceToggle}
                    onSelectAll={handleSourceSelectAll}
                    isLoading={isLoading}
                />
            )
        },
        {
            label: 'Source Analysis',
            description: 'Review extracted information and conflicts',
            action: handleAnalysisProceed,
            actionButtonText: () => 'Generate Final Answer',
            component: (props) => (
                <SourceAnalysis
                    {...props}
                    sourceContent={sourceContent}
                />
            )
        },
        {
            label: 'Research Answer',
            description: 'View the research answer with citations and confidence levels',
            action: async () => Promise.resolve(),
            actionButtonText: () => '',
            component: (props) => (
                researchAnswer ? (
                    <div>
                        <ResearchAnswer
                            {...props}
                            answer={researchAnswer}
                            originalQuestion={question}
                            analysis={analysis!}
                            evaluation={evaluation}
                        />
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={handleNewQuestion}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Start New Question
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                        No research answer available. Please go back and try again.
                    </div>
                )
            )
        }
    ];

    return (
        <div className="flex gap-8 max-w-7xl mx-auto p-6">
            {/* Progress Steps - Now on the left side */}
            <div className="w-64 shrink-0">
                <div className="flex flex-col gap-4">
                    {workflowSteps.map((step, index) => (
                        <div
                            key={step.label}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${index === activeStep
                                ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200'
                                : index < activeStep
                                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:text-emerald-200'
                                    : 'bg-gray-50 border border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index === activeStep
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                                : index < activeStep
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                {index + 1}
                            </div>
                            <div className="flex flex-col">
                                <div className="font-medium">{step.label}</div>
                                <div className="text-xs opacity-80">{step.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
                {/* Step Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    {renderStepContent(activeStep)}
                </div>

                {/* Fixed Navigation */}
                <div className="fixed bottom-0 left-0 right-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4 items-center">
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
                                {activeStep > 0 && (
                                    <button
                                        onClick={handleNewQuestion}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <span>New Question</span>
                                    </button>
                                )}
                            </div>

                            {/* Workflow-specific action button */}
                            {activeStep < workflowSteps.length - 1 && (
                                <button
                                    onClick={() => workflowSteps[activeStep].action()}
                                    disabled={isLoading || (workflowSteps[activeStep].isDisabled?.() ?? false)}
                                    className={`px-6 py-2 rounded-lg ${isLoading || (workflowSteps[activeStep].isDisabled?.() ?? false)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {isLoading ? 'Processing...' : workflowSteps[activeStep].actionButtonText()}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearchWorkflow; 