import React, { useState } from 'react';
import { researchApi, KnowledgeGraphElements } from '../lib/api/researchApi';
import BaseWorkflow, { WorkflowStep } from './common/BaseWorkflow';
import { SourceInput, KnowledgeGraphDisplay } from './workflow-steps';

const KbWorkflow: React.FC = () => {
  const [source, setSource] = useState('');
  const [graphElements, setGraphElements] = useState<KnowledgeGraphElements>({ 
    nodes: [], 
    relationships: [] 
  });

  const workflowSteps: WorkflowStep[] = [
    {
      label: 'Source Input',
      description: 'Enter or paste your source text',
      action: async (handleNext) => {
        const result = await researchApi.extractKnowledgeGraph(source.trim());
        setGraphElements(result);
        handleNext();
      },
      actionButtonText: () => 'Process Source',
      isDisabled: () => !source.trim(),
      component: ({ handleNext }) => (
        <SourceInput
          source={source}
          onSourceChange={setSource}
          handleNext={handleNext}
        />
      )
    },
    {
      label: 'Knowledge Graph',
      description: 'View extracted entities and relationships',
      action: async () => { 
        // No action needed for final step
      },
      actionButtonText: () => 'Done',
      component: ({ handleNext }) => (
        <KnowledgeGraphDisplay
          graphElements={graphElements}
          handleNext={handleNext}
        />
      )
    }
  ];

  return <BaseWorkflow steps={workflowSteps} />;
};

export default KbWorkflow; 