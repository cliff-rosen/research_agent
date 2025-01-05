import React, { useState } from 'react';
import { QuestionImprovement as QuestionImprovementType } from '../../lib/api/researchApi';

interface QuestionImprovementProps {
    improvement: QuestionImprovementType | null;
    finalQuestion: string;
    onQuestionSelect: (question: string) => void;
    originalQuestion: string;
    setQuestion: (question: string) => void;
}

const QuestionImprovement: React.FC<QuestionImprovementProps> = ({
    improvement,
    finalQuestion,
    onQuestionSelect,
    originalQuestion,
    setQuestion
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState('');
    const [editSource, setEditSource] = useState<'original' | 'improved'>('original');

    // Initialize edited question when starting to edit
    const startEditing = (source: 'original' | 'improved') => {
        setEditSource(source);
        // Start with the current text of the version being edited
        const startingText = source === 'original' ? originalQuestion : improvement?.improved_question || '';
        setEditedQuestion(startingText);
        setIsEditing(true);
    };

    // Save edited question
    const handleSaveEdit = () => {
        if (editSource === 'original') {
            setQuestion(editedQuestion);
            onQuestionSelect(editedQuestion);
        } else {
            onQuestionSelect(editedQuestion);
        }
        setIsEditing(false);
    };

    if (!improvement) {
        return (
            <div className="text-gray-600 dark:text-gray-400">
                No improvement analysis available. Please go back and try again.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Question Selection Section */}
            <div className="space-y-4">
                {/* Original Question */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                        <input
                            type="radio"
                            checked={finalQuestion === originalQuestion}
                            onChange={() => onQuestionSelect(originalQuestion)}
                            className="mt-1.5"
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">Original Question</h3>
                                <button
                                    onClick={() => startEditing('original')}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Edit
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">{originalQuestion}</p>
                        </div>
                    </div>
                </div>

                {/* Improved Question */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                        <input
                            type="radio"
                            checked={finalQuestion === improvement.improved_question}
                            onChange={() => onQuestionSelect(improvement.improved_question)}
                            className="mt-1.5"
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">Improved Question</h3>
                                <button
                                    onClick={() => startEditing('improved')}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Edit
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">{improvement.improved_question}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                        <h3 className="text-lg font-semibold mb-4">
                            Edit {editSource === 'original' ? 'Original' : 'Improved'} Question
                        </h3>
                        <textarea
                            value={editedQuestion}
                            onChange={(e) => setEditedQuestion(e.target.value)}
                            className="w-full h-32 p-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Enter your edited question..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Analysis</h3>

                {/* Clarity Issues */}
                {improvement.analysis.clarity_issues.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Clarity Issues</h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {improvement.analysis.clarity_issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Scope Issues */}
                {improvement.analysis.scope_issues.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Scope Considerations</h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {improvement.analysis.scope_issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Precision Issues */}
                {improvement.analysis.precision_issues.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Precision Issues</h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {improvement.analysis.precision_issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Implicit Assumptions */}
                {improvement.analysis.implicit_assumptions.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Implicit Assumptions</h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {improvement.analysis.implicit_assumptions.map((assumption, index) => (
                                <li key={index}>{assumption}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Missing Context */}
                {improvement.analysis.missing_context.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Missing Context</h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {improvement.analysis.missing_context.map((context, index) => (
                                <li key={index}>{context}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Structural Improvements */}
                {improvement.analysis.structural_improvements.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Structural Improvements</h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {improvement.analysis.structural_improvements.map((improvement, index) => (
                                <li key={index}>{improvement}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Improvement Summary</h3>
                <p className="text-yellow-700 dark:text-yellow-300">{improvement.improvement_explanation}</p>
            </div>
        </div>
    );
};

export default QuestionImprovement; 