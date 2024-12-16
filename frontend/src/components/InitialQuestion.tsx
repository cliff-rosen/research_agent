import React from 'react';

interface InitialQuestionProps {
    question: string;
    isLoading: boolean;
    error: string;
    onQuestionChange: (question: string) => void;
    onSubmit: () => Promise<void>;
}

const InitialQuestion: React.FC<InitialQuestionProps> = ({
    question,
    isLoading,
    error,
    onQuestionChange,
    onSubmit
}) => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Enter Your Research Question
            </h2>
            <textarea
                className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
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
                onClick={onSubmit}
                disabled={!question.trim() || isLoading}
            >
                {isLoading ? 'Processing...' : 'Analyze Question'}
            </button>
        </div>
    );
};

export default InitialQuestion; 