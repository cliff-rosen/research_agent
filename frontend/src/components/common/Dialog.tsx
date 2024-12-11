import React from 'react'

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Dialog */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="absolute right-0 top-0 pr-4 pt-4">
                        <button
                            onClick={onClose}
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <span className="sr-only">Close</span>
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                    
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <div className="mt-4">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dialog 