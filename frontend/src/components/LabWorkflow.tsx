import React, { useState } from 'react';
import { researchApi, KnowledgeGraphElements } from '../lib/api/researchApi';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

interface WorkflowStep {
  label: string;
  description: string;
  action: (data?: any) => Promise<void>;
  component: (props: any) => JSX.Element;
  actionButtonText: (state?: any) => string;
  isDisabled?: (state?: any) => boolean;
}

// Step 1: Source Input Component
const SourceInput: React.FC<{
  source: string;
  error: string;
  onSourceChange: (source: string) => void;
}> = ({ source, error, onSourceChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Source Text
        </label>
        <textarea
          id="source"
          rows={15}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Paste your source text here..."
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

// Step 2: Knowledge Graph Display Component
const KnowledgeGraphDisplay: React.FC<{
  graphElements: KnowledgeGraphElements;
}> = ({ graphElements }) => {
  // Convert nodes to ReactFlow format
  const initialNodes: Node[] = graphElements.nodes.map((node) => ({
    id: node.id,
    data: {
      label: (
        <div className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-gray-100">{node.label}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {Object.entries(node.properties).map(([key, value]) => (
              <div key={key} className="truncate">
                {key}: {value}
              </div>
            ))}
          </div>
        </div>
      )
    },
    position: { x: 0, y: 0 },
    type: 'default',
    style: {
      background: 'transparent',
      border: 'none',
    },
  }));

  // Convert relationships to ReactFlow edges with enhanced styling
  const initialEdges: Edge[] = graphElements.relationships.map((rel, index) => ({
    id: `e${index}`,
    source: rel.source,
    target: rel.target,
    label: rel.type,
    type: 'smoothstep',
    animated: true,
    labelStyle: {
      fill: 'currentColor',
      fontWeight: 500,
      fontSize: '12px',
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.8,
      rx: 4,
      className: 'dark:fill-gray-800',
    },
    labelBgPadding: [8, 4],
    style: {
      stroke: '#64748b',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#64748b',
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Auto-arrange nodes in a circle
  React.useEffect(() => {
    const radius = Math.max(300, nodes.length * 50);
    const centerX = 400;
    const centerY = 300;

    const arrangedNodes = nodes.map((node, index) => {
      const angle = (index * 2 * Math.PI) / nodes.length;
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });

    setNodes(arrangedNodes);
  }, [graphElements]);

  return (
    <div className="h-[600px] w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Background color="#64748b" />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const LabWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [source, setSource] = useState('');
  const [graphElements, setGraphElements] = useState<KnowledgeGraphElements>({ nodes: [], relationships: [] });

  // Step 1 handler: Submit source text
  const handleSourceSubmit = async (): Promise<void> => {
    setIsLoading(true);
    setError('');

    try {
      // Call the knowledge graph extraction API with the document field
      const result = await researchApi.extractKnowledgeGraph(source.trim());
      setGraphElements(result);
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
    setSource('');
    setGraphElements({ nodes: [], relationships: [] });
  };

  const workflowSteps: WorkflowStep[] = [
    {
      label: 'Source Input',
      description: 'Enter or paste your source text',
      action: handleSourceSubmit,
      actionButtonText: () => 'Process Source',
      isDisabled: () => !source.trim(),
      component: (props) => (
        <SourceInput
          {...props}
          source={source}
          error={error}
          onSourceChange={setSource}
        />
      )
    },
    {
      label: 'Knowledge Graph',
      description: 'View extracted entities and relationships',
      action: async () => { /* No action needed for final step */ },
      actionButtonText: () => 'Done',
      component: (props) => (
        <KnowledgeGraphDisplay
          {...props}
          graphElements={graphElements}
        />
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