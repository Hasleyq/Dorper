import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PedigreeNode, type PedigreeNodeData } from './PedigreeNode'
import { Loader2 } from 'lucide-react'

// ============================================
// Node type registry (must be stable reference)
// ============================================
const nodeTypes = { pedigreeNode: PedigreeNode }

// ============================================
// Props
// ============================================
interface PedigreeFlowProps {
  sheepId: string
}

// ============================================
// Tree → React Flow nodes/edges conversion
// ============================================
const X_SPACING = 280
const NODE_HEIGHT = 80

function buildFlowElements(
  ancestor: any,
  depth: number
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const initialYGap = Math.pow(2, depth - 1) * (NODE_HEIGHT + 10)

  function processNode(
    data: any,
    pathId: string,
    x: number,
    y: number,
    yGap: number,
    level: number
  ) {
    if (!data) return

    const nodeData: PedigreeNodeData = {
      name: data.name,
      earTag: data.earTag,
      sex: data.sex,
      birthDate: data.birthDate,
      status: data.status,
      isSubject: level === 0,
    }

    nodes.push({
      id: pathId,
      type: 'pedigreeNode',
      position: { x, y },
      data: nodeData,
    })

    // Father → above
    if (data.father) {
      const fatherId = `${pathId}-father`
      edges.push({
        id: `edge-${pathId}-f`,
        source: pathId,
        target: fatherId,
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animated: false,
      })
      processNode(data.father, fatherId, x + X_SPACING, y - yGap, yGap / 2, level + 1)
    }

    // Mother → below
    if (data.mother) {
      const motherId = `${pathId}-mother`
      edges.push({
        id: `edge-${pathId}-m`,
        source: pathId,
        target: motherId,
        type: 'smoothstep',
        style: { stroke: '#ec4899', strokeWidth: 2 },
        animated: false,
      })
      processNode(data.mother, motherId, x + X_SPACING, y + yGap, yGap / 2, level + 1)
    }
  }

  processNode(ancestor, 'root', 0, 0, initialYGap, 0)
  return { nodes, edges }
}

// ============================================
// Main component
// ============================================
export function PedigreeFlow({ sheepId }: PedigreeFlowProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    async function fetchAncestors() {
      if (!window.electronAPI) {
        setError('Brak połączenia z Electron API')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const ancestorTree = await window.electronAPI.sheep.getAncestors(sheepId, 3)

        if (!ancestorTree) {
          setError('Nie znaleziono danych rodowodowych')
          return
        }

        const { nodes: flowNodes, edges: flowEdges } = buildFlowElements(ancestorTree, 3)
        setNodes(flowNodes)
        setEdges(flowEdges)
      } catch (err) {
        console.error('Failed to fetch ancestors:', err)
        setError('Błąd podczas ładowania rodowodu')
      } finally {
        setLoading(false)
      }
    }

    fetchAncestors()
  }, [sheepId, setNodes, setEdges])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Ładowanie rodowodu...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        colorMode="light"
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#e2e8f0" />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !shadow-xl [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!bg-secondary [&>button:hover]:!text-foreground"
        />
        <MiniMap
          nodeStrokeColor="#cbd5e1"
          nodeColor={(node) => {
            const data = node.data as PedigreeNodeData
            if (data.isSubject) return '#d97706'
            return data.sex === 'MALE' ? '#3b82f6' : '#ec4899'
          }}
          maskColor="rgba(241,245,249,0.7)"
          className="!bg-card/80 !border-border"
        />
      </ReactFlow>
    </div>
  )
}
