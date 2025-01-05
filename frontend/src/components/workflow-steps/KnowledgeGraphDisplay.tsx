import React, { useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { KnowledgeGraphElements } from '../../lib/api/researchApi';

interface KnowledgeGraphDisplayProps {
  graphElements: KnowledgeGraphElements;
  handleNext: () => void;
}

const KnowledgeGraphDisplay: React.FC<KnowledgeGraphDisplayProps> = ({ graphElements, handleNext }) => {
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
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Auto-arrange nodes in a circle
  useEffect(() => {
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
  }, [graphElements, setNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  return (
    <div className="space-y-4">
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

    </div>
  );
};

export default KnowledgeGraphDisplay; 