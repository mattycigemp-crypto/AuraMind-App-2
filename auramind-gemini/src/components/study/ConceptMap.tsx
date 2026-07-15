import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConceptMapData, ConceptNode, ConceptEdge } from '../../services/ai/conceptMapService';
import { NetworkIcon as Network, XIcon as X, ZoomInIcon as ZoomIn, ZoomOutIcon as ZoomOut, RotateCcwIcon as RotateCcw } from '../icons/CustomIcons';

interface ConceptMapProps {
  data: ConceptMapData;
  onClose?: () => void;
  className?: string;
}

interface MapNode extends ConceptNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16',
];

const getGroupColor = (group: string, index: number) => {
  let hash = 0;
  for (let i = 0; i < group.length; i++) hash = group.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

const WIDTH = 800;
const HEIGHT = 600;

export const ConceptMap: React.FC<ConceptMapProps> = ({ data, onClose, className = '' }) => {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const nodeMap = useMemo(() => {
    const map = new Map<string, ConceptNode>();
    data.nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [data.nodes]);

  // Initialize node positions in a circle
  useEffect(() => {
    const initialNodes: MapNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const radius = Math.min(WIDTH, HEIGHT) * 0.3;
      return {
        ...n,
        x: WIDTH / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: HEIGHT / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      };
    });
    setNodes(initialNodes);
  }, [data.nodes]);

  // Force-directed layout simulation
  useEffect(() => {
    let running = true;
    const simulate = () => {
      if (!running) return;
      setNodes(prev => {
        if (prev.length === 0) return prev;
        const newNodes = prev.map(n => ({ ...n }));
        const centerX = WIDTH / 2;
        const centerY = HEIGHT / 2;

        // Repulsion between nodes
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const a = newNodes[i];
            const b = newNodes[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 2000 / (dist * dist + 100);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }

        // Attraction along edges
        data.edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (source && target) {
            let dx = target.x - source.x;
            let dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 120 + (edge.strength || 0.5) * 80;
            const force = ((dist - targetDist) / dist) * 0.03;
            const fx = dx * force;
            const fy = dy * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // Center gravity
        newNodes.forEach(n => {
          const dx = centerX - n.x;
          const dy = centerY - n.y;
          n.vx += dx * 0.0005;
          n.vy += dy * 0.0005;


          // Damping
          n.vx *= 0.85;
          n.vy *= 0.85;

          // Update position
          n.x += n.vx;
          n.y += n.vy;

          // Boundary constraints
          n.x = Math.max(40, Math.min(WIDTH - 40, n.x));
          n.y = Math.max(40, Math.min(HEIGHT - 40, n.y));
        });

        return newNodes;
      });
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [data.edges]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 ${className}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-6xl h-[85vh] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Network size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Concept Map</h2>
              <p className="text-xs text-zinc-400">{data.topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleZoomOut} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-zinc-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleReset} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <RotateCcw size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ml-2">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
          >
            <defs>
              {data.nodes.map((n, i) => (
                <marker
                  key={`marker-${n.id}`}
                  id={`arrow-${n.id}`}
                  viewBox="0 -5 10 10"
                  refX="25"
                  refY="0"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,-5L10,0L0,5" fill={getGroupColor(n.group, i)} opacity="0.6" />
                </marker>
              ))}
            </defs>

            {/* Edges */}
            {data.edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              return (
                <g key={`edge-${i}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="url(#edgeGradient)"
                    strokeWidth={(edge.strength || 0.5) * 3}
                    opacity={0.4}
                  />
                  {edge.label && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2}
                      fill="#a1a1aa"
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const color = getGroupColor(node.group, i);
              const radius = 20 + (node.size || 1) * 8;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  className="cursor-pointer"
                >
                  <motion.circle
                    r={radius}
                    fill={color}
                    fillOpacity={0.2}
                    stroke={color}
                    strokeWidth={2}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                    whileHover={{ scale: 1.1 }}
                  />
                  <text
                    y={radius + 18}
                    fill="#e4e4e7"
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {node.label.length > 18 ? `${node.label.slice(0, 18)}...` : node.label}
                  </text>
                  <text
                    y={radius + 32}
                    fill="#71717a"
                    fontSize="9"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {node.group}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-md p-3 max-w-xs">
          <h3 className="text-xs font-semibold text-zinc-300 mb-2">Groups</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(data.nodes.map(n => n.group))).map((group, i) => (
              <span key={group} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getGroupColor(group, i) }} />
                {group}
              </span>
            ))}
          </div>
        </div>

        {/* Selected Node Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-20 right-4 z-10 w-80 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md p-4 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedNode.label}</h3>
                  <span className="text-xs text-zinc-500">{selectedNode.group}</span>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{selectedNode.description || 'No description available.'}</p>
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">Connected to</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.edges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e, i) => {
                      const otherId = e.source === selectedNode.id ? e.target : e.source;
                      const other = nodeMap.get(otherId);
                      return other ? (
                        <span key={i} className="px-2 py-1 rounded-md bg-zinc-900 text-[10px] text-zinc-400">
                          {other.label}
                        </span>
                      ) : null;
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConceptMap;
