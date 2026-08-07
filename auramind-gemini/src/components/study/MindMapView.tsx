import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ZoomIn, ZoomOut, Maximize2, FileDown } from '@/components/icons';
import { generateMindMap, type MindMapNode, type MindMapData } from '../../services/api/mindMapService';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';

interface MindMapViewProps {
  content: string;
  title: string;
  onClose?: () => void;
  className?: string;
}

type NodeType = 'root' | 'main' | 'sub' | 'detail';

interface PositionedNode {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  type: NodeType;
  parentId: string | null;
  depth: number;
}

interface Connection {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const LEVEL_GAP = 100;
const SIBLING_GAP = 16;
const ROOT_WIDTH = 200;
const ROOT_HEIGHT = 52;

function getNodeType(depth: number): NodeType {
  if (depth === 0) return 'root';
  if (depth === 1) return 'main';
  if (depth === 2) return 'sub';
  return 'detail';
}

function getNodeStyle(type: NodeType) {
  switch (type) {
    case 'root':
      return {
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        fill: 'rgba(139, 92, 246, 0.15)',
        stroke: 'rgb(139, 92, 246)',
        strokeWidth: 2,
        textColor: '#f4f4f5',
        fontSize: 14,
        fontWeight: 700,
        rx: 12,
      };
    case 'main':
      return {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        fill: 'rgba(39, 39, 42, 0.9)',
        stroke: 'rgb(63, 63, 70)',
        strokeWidth: 1.5,
        textColor: '#e4e4e7',
        fontSize: 13,
        fontWeight: 600,
        rx: 10,
      };
    case 'sub':
      return {
        width: NODE_WIDTH - 8,
        height: NODE_HEIGHT - 4,
        fill: 'rgba(39, 39, 42, 0.7)',
        stroke: 'rgb(63, 63, 70)',
        strokeWidth: 1,
        textColor: '#a1a1aa',
        fontSize: 12,
        fontWeight: 500,
        rx: 8,
      };
    case 'detail':
      return {
        width: NODE_WIDTH - 16,
        height: NODE_HEIGHT - 8,
        fill: 'rgba(39, 39, 42, 0.5)',
        stroke: 'rgb(63, 63, 70)',
        strokeWidth: 1,
        textColor: '#71717a',
        fontSize: 11,
        fontWeight: 400,
        rx: 6,
      };
  }
}

function computeSubtreeWidth(node: MindMapNode, collapsed: Set<string>): number {
  if (collapsed.has(node.id) || node.children.length === 0) {
    return ROOT_WIDTH;
  }
  let total = 0;
  for (const child of node.children) {
    total += computeSubtreeWidth(child, collapsed);
  }
  return Math.max(ROOT_WIDTH, total + (node.children.length - 1) * SIBLING_GAP);
}

function layoutTree(
  node: MindMapNode,
  collapsed: Set<string>,
  x: number,
  y: number,
  parentId: string | null,
  depth: number,
  positions: PositionedNode[],
  connections: Connection[]
) {
  const type = getNodeType(depth);
  positions.push({
    id: node.id,
    label: node.label,
    description: node.description,
    x,
    y,
    type,
    parentId,
    depth,
  });

  if (collapsed.has(node.id) || node.children.length === 0) return;

  const childWidths = node.children.map(c => computeSubtreeWidth(c, collapsed));
  const totalWidth = childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * SIBLING_GAP;
  let cx = x - totalWidth / 2;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childX = cx + childWidths[i] / 2;
    const childY = y + LEVEL_GAP;

    connections.push({
      from: { x, y: y + (type === 'root' ? ROOT_HEIGHT / 2 : NODE_HEIGHT / 2) },
      to: { x: childX, y: childY - (childWidths[i] > ROOT_WIDTH ? 24 : 20) },
    });

    layoutTree(child, collapsed, childX, childY, node.id, depth + 1, positions, connections);
    cx += childWidths[i] + SIBLING_GAP;
  }
}

function buildBezierPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dy = to.y - from.y;
  const cy = from.y + dy * 0.5;
  return `M ${from.x} ${from.y} C ${from.x} ${cy}, ${to.x} ${cy}, ${to.x} ${to.y}`;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

function LoadingSkeleton() {
  const bars = [
    { width: 200, x: 0, y: 0 },
    { width: 140, x: -200, y: 100 },
    { width: 140, x: 0, y: 100 },
    { width: 140, x: 200, y: 100 },
    { width: 110, x: -250, y: 190 },
    { width: 110, x: -150, y: 190 },
    { width: 110, x: -50, y: 190 },
    { width: 110, x: 50, y: 190 },
    { width: 110, x: 150, y: 190 },
    { width: 110, x: 250, y: 190 },
  ];

  return (
    <div className="flex items-center justify-center h-full">
      <svg viewBox="-300 -20 600 300" className="w-full max-w-lg">
        {bars.map((bar, i) => (
          <motion.rect
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={i === 0 ? 52 : 40}
            rx={i === 0 ? 12 : 8}
            fill="rgba(63, 63, 70, 0.3)"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
          />
        ))}
        {bars.slice(0, -1).map((_, i) => i > 0 && (
          <motion.line
            key={`line-${i}`}
            x1={bars[0].x + bars[0].width / 2}
            y1={bars[0].y + 26}
            x2={bars[i + 1].x + bars[i + 1].width / 2}
            y2={bars[i + 1].y}
            stroke="rgba(63, 63, 70, 0.2)"
            strokeWidth={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
          />
        ))}
      </svg>
    </div>
  );
}

const MindMapView: React.FC<MindMapViewProps> = ({ content, title, onClose, className = '' }) => {
  const workspace = useDashboardWorkspace();
  const pdfExportEnabled = useFeatureFlag(
    'mindmap_pdf_export',
    workspace?.user?.id,
    workspace?.user?.role,
    workspace?.user?.plan,
    workspace?.user?.isAdmin,
  );

  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan/Zoom
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCollapsed(new Set());
    setPan({ x: 0, y: 0 });
    setZoom(1);
    try {
      const data = await generateMindMap(content, title);
      setMindMapData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate mind map');
    } finally {
      setIsLoading(false);
    }
  }, [content, title]);

  useEffect(() => {
    if (content && title) {
      generate();
    }
  }, [content, title, generate]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const { positionedNodes, connections } = useMemo(() => {
    if (!mindMapData) return { positionedNodes: [] as PositionedNode[], connections: [] as Connection[] };
    const positions: PositionedNode[] = [];
    const conns: Connection[] = [];
    layoutTree(mindMapData.root, collapsed, 0, 0, null, 0, positions, conns);
    return { positionedNodes: positions, connections: conns };
  }, [mindMapData, collapsed]);

  const nodeHasChildren = useMemo(() => {
    const set = new Set<string>();
    if (!mindMapData) return set;
    const walk = (n: MindMapNode) => {
      if (n.children.length > 0) set.add(n.id);
      n.children.forEach(walk);
    };
    walk(mindMapData.root);
    return set;
  }, [mindMapData]);

  const svgWidth = 1200;
  const svgHeight = 800;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetRef.current = pan;
      setIsPanning(true);
      didDragRef.current = false;
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDragRef.current = true;
      }
      setPan({ x: panOffsetRef.current.x + dx, y: panOffsetRef.current.y + dy });
    }

    if (svgRef.current && hoveredNode) {
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
      });
    }
  }, [isPanning, hoveredNode]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(3, prev * 1.25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.3, prev / 1.25));
  }, []);

  const hasConnections = mindMapData && !collapsed.has(mindMapData.root.id);

  const hoveredNodeData = hoveredNode ? positionedNodes.find(n => n.id === hoveredNode) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            {mindMapData?.title || 'Mind Map'}
          </h3>
          {!isLoading && mindMapData && (
            <p className="text-xs text-zinc-500 mt-0.5">{positionedNodes.length} nodes</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-zinc-500 w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Reset view"
          >
            <Maximize2 size={16} />
          </button>
          {pdfExportEnabled && mindMapData && (
            <button
              onClick={() => {
                // Export mind map as PDF — print the SVG to a PDF via browser print
                window.print();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs font-bold uppercase tracking-wider transition-all"
              title="Export as PDF"
            >
              <FileDown size={14} />
              PDF
            </button>
          )}
          <div className="w-px h-5 bg-zinc-800 mx-1" />
          {error && (
            <button
              onClick={generate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Retry
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative" style={{ height: 500 }}>
        {isLoading && <LoadingSkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <X size={24} className="text-red-400" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-zinc-100 font-bold mb-1">Generation Failed</p>
              <p className="text-sm text-zinc-500">{error}</p>
            </div>
            <button
              onClick={generate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest transition-all"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && !mindMapData && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Maximize2 size={24} className="text-violet-400" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-zinc-100 font-bold mb-1">No Mind Map Yet</p>
              <p className="text-sm text-zinc-500">
                Enter study content and click generate to create a visual knowledge map.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && mindMapData && (
          <div className="w-full h-full cursor-grab active:cursor-grabbing">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="select-none"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${svgWidth / 2 + pan.x}, ${150 + pan.y}) scale(${zoom})`}>
                {/* Connections */}
                {hasConnections && connections.map((conn, i) => (
                  <path
                    key={i}
                    d={buildBezierPath(conn.from, conn.to)}
                    fill="none"
                    stroke="rgb(63, 63, 70)"
                    strokeWidth={2}
                    className="transition-colors duration-200"
                  />
                ))}

                {/* Nodes */}
                <AnimatePresence>
                  {positionedNodes.map((node) => {
                    const style = getNodeStyle(node.type);
                    const isRoot = node.type === 'root';
                    const hasChildren = nodeHasChildren.has(node.id);
                    const isCollapsed = collapsed.has(node.id);

                    return (
                      <motion.g
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        style={{ cursor: isPanning ? 'grabbing' : hasChildren ? 'pointer' : 'default' }}
                        onMouseDown={(e) => { if (hasChildren) e.stopPropagation(); }}
                      >
                        <rect
                          x={node.x - style.width / 2}
                          y={node.y - style.height / 2}
                          width={style.width}
                          height={style.height}
                          rx={style.rx}
                          fill={hoveredNode === node.id && isRoot
                            ? 'rgba(139, 92, 246, 0.25)'
                            : hoveredNode === node.id
                              ? 'rgba(139, 92, 246, 0.1)'
                              : style.fill
                          }
                          stroke={hoveredNode === node.id ? 'rgb(139, 92, 246)' : style.stroke}
                          strokeWidth={hoveredNode === node.id ? 2 : style.strokeWidth}
                          filter={hoveredNode === node.id ? 'url(#nodeGlow)' : undefined}
                          className="transition-all duration-200"
                          onMouseEnter={(e) => {
                            setHoveredNode(node.id);
                            if (svgRef.current) {
                              const rect = svgRef.current.getBoundingClientRect();
                              setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
                            }
                          }}
                          onMouseLeave={() => setHoveredNode(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) toggleCollapse(node.id);
                          }}
                        />

                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={style.textColor}
                          fontSize={style.fontSize}
                          fontWeight={style.fontWeight}
                          className="pointer-events-none select-none"
                          onMouseEnter={() => setHoveredNode(node.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          {truncate(node.label, isRoot ? 20 : 16)}
                        </text>

                        {/* Collapse indicator */}
                        {hasChildren && (
                          <g
                            transform={`translate(${node.x + style.width / 2 - 2}, ${node.y - style.height / 2 - 2})`}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollapse(node.id);
                            }}
                          >
                            <circle
                              cx={0}
                              cy={0}
                              r={8}
                              fill="rgb(39, 39, 42)"
                              stroke="rgb(82, 82, 91)"
                              strokeWidth={1}
                            />
                            <motion.text
                              x={0}
                              y={0.5}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#a1a1aa"
                              fontSize={10}
                              fontWeight={700}
                              animate={{ rotate: isCollapsed ? 0 : 180 }}
                            >
                              {isCollapsed ? '+' : '−'}
                            </motion.text>
                          </g>
                        )}
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              </g>
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredNodeData && hoveredNodeData.description && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: tooltipPos.x,
                    top: tooltipPos.y,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl max-w-[240px]">
                    <p className="text-xs text-zinc-300 leading-relaxed">{hoveredNodeData.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Legend */}
      {!isLoading && !error && mindMapData && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800">
          {(['root', 'main', 'sub', 'detail'] as NodeType[]).map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded"
                style={{
                  backgroundColor: type === 'root' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(63, 63, 70, 0.5)',
                  border: `1px solid ${type === 'root' ? 'rgb(139, 92, 246)' : 'rgb(63, 63, 70)'}`,
                  borderRadius: type === 'root' ? 4 : 3,
                }}
              />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold capitalize">{type}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MindMapView;
