import React, { useState } from 'react';

interface WorkflowStep {
  label: string;
  description: string;
  action: (data?: any) => Promise<void>;
  component: (props: any) => JSX.Element;
  actionButtonText: (state?: any) => string;
  isDisabled?: (state?: any) => boolean;
}

const LabWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string>('');
  // Step 1 handler: Submit source text
  const handleSourceSubmit = async (): Promise<void> => {
    setIsLoading(true);
    setError('');

    try {
      handleNext();
    } catch (err: unknown) {
      console.error('Error extracting knowledge graph:', err);
      setError('Failed to extract knowledge graph from source. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = (): void => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = (): void => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = (): void => {
    setActiveStep(0);
    setIsLoading(false);
    setError('');
  };

  const workflowSteps: WorkflowStep[] = [
    {
      label: 'Source Input',
      description: 'Enter or paste your source text',
      action: handleSourceSubmit,
      actionButtonText: () => 'Process Source',
      isDisabled: () => true,
      component: () => (
        <div>
          <h1>Source Input</h1>
        </div>
      )
    }
  ];

  const renderStepContent = (step: number) => {
    const currentStep = workflowSteps[step];
    return currentStep.component({});
  };

  return (
    <div className="flex gap-8 max-w-7xl mx-auto p-6">
      {/* Progress Steps - Left side */}
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
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2"
                  >
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Workflow-specific action button */}
              {activeStep < workflowSteps.length && (
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

export default LabWorkflow; 