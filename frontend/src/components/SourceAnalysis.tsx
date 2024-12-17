import React, { useState } from 'react';
import { URLContent } from '../lib/api/searchApi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';

interface SourceAnalysisProps {
    sourceContent: URLContent[];
    isLoading: boolean;
    onProceed: () => void;
}

interface SourceViewModalProps {
    content: URLContent;
    isOpen: boolean;
    onClose: () => void;
}

const ContentRenderer: React.FC<{ content: URLContent }> = ({ content }) => {
    return (
        <div 
            className="text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none prose-p:my-3 prose-p:leading-relaxed prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(content.text, { 
                    USE_PROFILES: { html: true },
                    ALLOWED_TAGS: [
                        'p', 'a', 'b', 'i', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'ul', 'ol', 'li', 'br', 'hr', 'div', 'span', 'blockquote'
                    ],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
                })
            }}
        />
    );
};

const PreviewContent: React.FC<{ content: URLContent }> = ({ content }) => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = DOMPurify.sanitize(content.text);
    
    // Get all paragraphs
    const paragraphs = tempDiv.getElementsByTagName('p');
    let previewHtml = '';
    let charCount = 0;
    
    // Build preview HTML from paragraphs
    for (let i = 0; i < paragraphs.length; i++) {
        const paraText = paragraphs[i].textContent || '';
        if (charCount + paraText.length > 500) {
            if (charCount < 400) {
                // Add partial paragraph with ellipsis
                const remainingChars = 500 - charCount;
                const partialText = paraText.slice(0, remainingChars);
                previewHtml += `<p>${partialText}...</p>`;
            }
            break;
        }
        previewHtml += paragraphs[i].outerHTML;
        charCount += paraText.length;
    }
    
    return (
        <div 
            className="text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none prose-p:my-3 prose-p:leading-relaxed prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-blue-600 dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(previewHtml, { 
                    USE_PROFILES: { html: true },
                    ALLOWED_TAGS: [
                        'p', 'a', 'b', 'i', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'br', 'span'
                    ],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
                })
            }}
        />
    );
};

const SourceViewModal: React.FC<SourceViewModalProps> = ({ content, isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(content.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {content.title || 'Source Content'}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="mb-4">
                        <a 
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                            {content.url}
                        </a>
                    </div>
                    
                    {content.error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <div className="text-red-600 dark:text-red-400 font-medium mb-1">
                                Error Loading Source
                            </div>
                            <div className="text-red-500 dark:text-red-300 text-sm">
                                {content.error}
                            </div>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-inner">
                                <ContentRenderer content={content} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SourceAnalysis: React.FC<SourceAnalysisProps> = ({ sourceContent, isLoading, onProceed }) => {
    const [expandedSources, setExpandedSources] = useState<number[]>([]);
    const [selectedSource, setSelectedSource] = useState<URLContent | null>(null);

    const toggleSource = (index: number) => {
        setExpandedSources(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Source Analysis
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {sourceContent.length} sources found
                </div>
            </div>

            <div className="space-y-4">
                {sourceContent.map((content, index) => {
                    const isExpanded = expandedSources.includes(index);
                    return (
                        <div 
                            key={index} 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                        >
                            {/* Header Section */}
                            <div 
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                                onClick={() => toggleSource(index)}
                            >
                                <div className="flex items-start">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {content.title || 'Untitled Source'}
                                            </h3>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSource(content);
                                                }}
                                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex-shrink-0"
                                            >
                                                View Source
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {content.url}
                                        </div>
                                    </div>
                                    <button 
                                        className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        <svg 
                                            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Preview Section */}
                            {isExpanded && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                                    {content.error ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                            <div className="text-red-600 dark:text-red-400 font-medium mb-1">
                                                Error Loading Source
                                            </div>
                                            <div className="text-red-500 dark:text-red-300 text-sm">
                                                {content.error}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="prose dark:prose-invert max-w-none">
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                                                    <div className="text-gray-800 dark:text-gray-200">
                                                        <PreviewContent content={content} />
                                                        {content.text.length > 500 && (
                                                            <div className="mt-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedSource(content);
                                                                    }}
                                                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                                                >
                                                                    View Full Content...
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Button */}
            <div className="pt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Click on a source to expand/collapse its content
                </div>
                <button
                    className={`px-6 py-2 rounded-lg text-white ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={onProceed}
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Generate Final Answer'}
                </button>
            </div>

            {/* Source View Modal */}
            {selectedSource && (
                <SourceViewModal
                    content={selectedSource}
                    isOpen={true}
                    onClose={() => setSelectedSource(null)}
                />
            )}
        </div>
    );
};

export default SourceAnalysis; 