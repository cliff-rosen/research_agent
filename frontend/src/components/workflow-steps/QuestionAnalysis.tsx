import React from 'react';
import { QuestionAnalysisResponse } from '../../lib/api/researchApi';
import ReactMarkdown from 'react-markdown';

interface Props {
    analysis: QuestionAnalysisResponse | null;
    analysisMarkdown: string;
    isLoading: boolean;
    onProceed: () => void;
    question: string;
}

const QuestionAnalysis: React.FC<Props> = ({
    analysisMarkdown,
    question
}) => {
    return (
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Original Question</h3>
                <p className="text-gray-700 dark:text-gray-300">{question}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-ul:list-disc prose-ol:list-decimal">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="mb-4">{children}</p>,
                            h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{children}</code>,
                        }}
                    >
                        {analysisMarkdown}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default QuestionAnalysis; 