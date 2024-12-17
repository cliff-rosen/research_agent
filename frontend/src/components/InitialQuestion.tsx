import React from 'react';

interface InitialQuestionProps {
    question: string;
    isLoading: boolean;
    error: string;
    onQuestionChange: (question: string) => void;
}

const InitialQuestion: React.FC<InitialQuestionProps> = ({
    question,
    isLoading,
    error,
    onQuestionChange,
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
        </div>
    );
};

export default InitialQuestion; 