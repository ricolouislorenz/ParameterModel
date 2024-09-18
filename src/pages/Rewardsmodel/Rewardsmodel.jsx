// src/pages/Rewardsmodel/RewardsModel.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Handle,
  useReactFlow,
  ReactFlowProvider,
} from 'react-flow-renderer';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';
import Footer from '../../components/Footer'; // Importiere deinen Footer
import '../../styles/App.css';

// Konstanten für die Positionierung der Knoten
const CENTER_X = 300;
const OFFSET_X = 150;

// Custom Node Component
const CustomNode = ({ id, data, isConnectable }) => (
  <div style={{ padding: 10, border: '1px solid #777', borderRadius: 5, backgroundColor: data.color || '#fff' }}>
    <Handle
      type="source"
      position="top"
      id="top"
      style={{ background: '#555' }}
      isConnectable={isConnectable}
    />
    <Handle
      type="source"
      position="bottom"
      id="bottom"
      style={{ background: '#555' }}
      isConnectable={isConnectable}
    />
    <div>{data.label}</div>
    <Handle
      type="target"
      position="top"
      id="top"
      style={{ background: '#555' }}
      isConnectable={isConnectable}
    />
    <Handle
      type="target"
      position="bottom"
      id="bottom"
      style={{ background: '#555' }}
      isConnectable={isConnectable}
    />
  </div>
);

CustomNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
  }).isRequired,
  isConnectable: PropTypes.bool.isRequired,
};

const nodeTypes = {
  customNode: CustomNode,
};

// Definiere die Knoten mit spezifischen Positionen
const initialNodes = [
  { id: '1', position: { x: CENTER_X, y: 0 }, data: { label: 'ADA Reserves', color: '#4DBDC7' }, type: 'customNode' },
  { id: '2', position: { x: CENTER_X + 5 * OFFSET_X, y: 0 }, data: { label: 'Total Transaction Fees', color: '#8A6791' }, type: 'customNode' },
  { id: '3', position: { x: CENTER_X + 1 * OFFSET_X, y: 100 }, data: { label: 'Monetary Expansion Rate * Performance of All Stake Pools', color: '#AF6B66' }, type: 'customNode' },
  { id: '4', position: { x: CENTER_X + 3 * OFFSET_X, y: 200 }, data: { label: 'Total Reward Pot', color: '#8A6791' }, type: 'customNode' },
  { id: '5', position: { x: CENTER_X - 2 * OFFSET_X, y: 200 }, data: { label: 'Unclaimed Rewards', color: '#AF6B66' }, type: 'customNode' },
  { id: '6', position: { x: CENTER_X + 2 * OFFSET_X, y: 300 }, data: { label: '1 - Treasury Growth Rate', color: '#AF6B66' }, type: 'customNode' },
  { id: '7', position: { x: CENTER_X, y: 400 }, data: { label: 'Stake Pool Rewards Pot', color: '#8A6791' }, type: 'customNode' },
  { id: '10', position: { x: CENTER_X - 1 * OFFSET_X, y: 500 }, data: { label: 'Rewards Equation for Pool n', color: '#AF6B66' }, type: 'customNode' },
  { id: '13', position: { x: CENTER_X, y: 600 }, data: { label: 'Stake Pool n', color: '#F0A724' }, type: 'customNode' },
  { id: '14', position: { x: CENTER_X - 1 * OFFSET_X, y: 700 }, data: { label: 'Margin & Minimum Pool Cost', color: '#AF6B66' }, type: 'customNode' },
  { id: '15', position: { x: CENTER_X + 1 * OFFSET_X, y: 700 }, data: { label: 'Rewards', color: '#AF6B66' }, type: 'customNode' },
  { id: '16', position: { x: CENTER_X - 2 * OFFSET_X, y: 800 }, data: { label: 'Operators', color: '#ffffff' }, type: 'customNode' },
  { id: '17', position: { x: CENTER_X + 2 * OFFSET_X, y: 800 }, data: { label: 'Delegators', color: '#ffffff' }, type: 'customNode' },
  { id: '18', position: { x: CENTER_X - 2 * OFFSET_X, y: 900 }, data: { label: 'Stake Pool Registrations & Deregistrations', color: '#AF6B66' }, type: 'customNode' },
  { id: '19', position: { x: CENTER_X + 1 * OFFSET_X, y: 900 }, data: { label: 'Stake Key Registrations & Deregistrations', color: '#AF6B66' }, type: 'customNode' },
  { id: '20', position: { x: CENTER_X, y: 1000 }, data: { label: 'Deposits', color: '#ffffff' }, type: 'customNode' },
  { id: '21', position: { x: CENTER_X + 2 * OFFSET_X, y: 1100 }, data: { label: 'Unclaimed Refunds for Retired Pools', color: '#AF6B66' }, type: 'customNode' },
  { id: '22', position: { x: CENTER_X + 4 * OFFSET_X, y: 1200 }, data: { label: 'Treasury', color: '#4DBDC7' }, type: 'customNode' },
  { id: '23', position: { x: CENTER_X + 4 * OFFSET_X, y: 1300 }, data: { label: 'Payouts', color: '#F0A724' }, type: 'customNode' },
  { id: '24', position: { x: CENTER_X + 3 * OFFSET_X, y: 700 }, data: { label: 'Rewards Going to Deregistered Stake Addresses', color: '#AF6B66' }, type: 'customNode' },
  { id: '25', position: { x: CENTER_X + 6 * OFFSET_X, y: 800 }, data: { label: 'Treasury Growth Rate', color: '#AF6B66' }, type: 'customNode' },
];

const initialEdges = [
  { id: 'e1-3', source: '1', target: '3', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e2-4', source: '2', target: '4', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e6-7', source: '6', target: '7', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e7-5', source: '7', target: '5', sourceHandle: 'top', targetHandle: 'bottom', animated: true, style: { stroke: 'black' } },
  { id: 'e5-1', source: '5', target: '1', sourceHandle: 'top', targetHandle: 'bottom', animated: true, style: { stroke: 'black' } },
  { id: 'e7-10', source: '7', target: '10', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e10-13', source: '10', target: '13', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e13-15', source: '13', target: '15', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e13-14', source: '13', target: '14', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e15-17', source: '15', target: '17', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e14-16', source: '14', target: '16', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e19-17', source: '19', target: '17', sourceHandle: 'top', targetHandle: 'bottom', animated: true, style: { stroke: 'black' } },
  { id: 'e18-16', source: '18', target: '16', sourceHandle: 'top', targetHandle: 'bottom', animated: true, style: { stroke: 'black' } },
  { id: 'e19-20', source: '19', target: '20', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e18-20', source: '18', target: '20', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e20-21', source: '20', target: '21', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e21-22', source: '21', target: '22', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e22-23', source: '22', target: '23', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e4-25', source: '4', target: '25', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e25-22', source: '25', target: '22', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e7-24', source: '7', target: '24', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
  { id: 'e24-22', source: '24', target: '22', sourceHandle: 'bottom', targetHandle: 'top', animated: true, style: { stroke: 'black' } },
];

const nodeDescriptions = {
  // ... (Deine vorhandenen nodeDescriptions)
  'ADA Reserves': {
    definition: 'The total amount of ADA that is held in reserve by the Cardano protocol.',
    description: 'These reserves are used for monetary expansion and to fund rewards over time.',
  },
  'Total Transaction Fees': {
    definition: 'The sum of all transaction fees collected from users.',
    description: 'Transaction fees contribute to the total reward pot and help prevent network spam.',
  },
  // Füge hier die restlichen Beschreibungen hinzu
};

const DiagramContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [open, setOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowWrapper = useRef(null);
  const { fitView, zoomOut } = useReactFlow();

  useEffect(() => {
    if (reactFlowWrapper.current) {
      fitView();
      zoomOut();
      zoomOut(); // Zweimal herauszoomen, um das gesamte Diagramm anzuzeigen
    }
  }, [fitView, zoomOut]);

  const handleElementClick = (event, node) => {
    setSelectedNode(node);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedNode(null);
  };

  return (
    <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleElementClick}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedNode?.data?.label}</DialogTitle>
        <DialogContent>
          <Typography>
            {nodeDescriptions[selectedNode?.data?.label]?.definition}
          </Typography>
          <Typography paragraph>
            {nodeDescriptions[selectedNode?.data?.label]?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const Diagram = () => (
  <ReactFlowProvider>
    <DiagramContent />
  </ReactFlowProvider>
);

const RewardsModel = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Hauptinhalt */}
      <Box sx={{ flex: '1 0 auto', width: '100%', background: 'linear-gradient(135deg, #c2e9fb, #a1c4fd)' }}>
        <Box sx={{ paddingTop: '40px', textAlign: 'center', width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'black' }}>
            Reward Model
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ color: 'black', marginBottom: '40px' }}>
            Take a look at the reward distribution model of Cardano and check out each parameter by clicking on.
          </Typography>
        </Box>
        <Box sx={{ height: '600px', width: '100%', padding: '0 20px' }}>
          <Diagram />
        </Box>
      </Box>
      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default RewardsModel;
