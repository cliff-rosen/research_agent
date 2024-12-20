import React from 'react';

interface InitialQuestionProps {
    question: string;
    error: string;
    onQuestionChange: (question: string) => void;
}

const InitialQuestion: React.FC<InitialQuestionProps> = ({
    question,
    error,
    onQuestionChange
}) => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Enter Your Research Question
            </h2>
            <textarea
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder="Enter your research question..."
                className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
            {error && (
                <div className="text-red-500 dark:text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
};

export default InitialQuestion; 