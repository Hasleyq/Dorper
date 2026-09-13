import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { SEX_ICONS, SEX_LABELS, SEX_VARIANTS, formatDate } from '@/lib/sheep-utils'

export interface PedigreeNodeData {
  name: string | null
  earTag: string
  sex: string
  birthDate?: string
  status?: string
  isSubject?: boolean
  [key: string]: unknown
}

function PedigreeNodeComponent({ data }: { data: PedigreeNodeData }) {
  const { name, earTag, sex, birthDate, isSubject } = data

  return (
    <>
      {/* Incoming handle (from child) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-border !w-2 !h-2 !border-0"
      />

      <div
        className={`rounded-lg border bg-card px-4 py-3 shadow-lg transition-shadow hover:shadow-xl min-w-[170px] ${
          isSubject
            ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5'
            : sex === 'MALE'
            ? 'border-sky-500/30'
            : sex === 'FEMALE'
            ? 'border-pink-500/30'
            : 'border-border'
        }`}
      >
        {/* Label for subject */}
        {isSubject && (
          <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-primary/60">
            Osobnik
          </p>
        )}

        {/* Name */}
        <p className={`font-semibold ${isSubject ? 'text-sm' : 'text-xs'}`}>
          {name || earTag}
        </p>

        {/* Ear Tag */}
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{earTag}</p>

        {/* Sex badge + Date */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <Badge
            variant={SEX_VARIANTS[sex] || 'secondary'}
            className="text-[9px] px-1.5 py-0"
          >
            {SEX_ICONS[sex]} {SEX_LABELS[sex] || sex}
          </Badge>
          {birthDate && (
            <span className="text-[9px] text-muted-foreground">
              {formatDate(birthDate)}
            </span>
          )}
        </div>
      </div>

      {/* Outgoing handle (to parents) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-border !w-2 !h-2 !border-0"
      />
    </>
  )
}

export const PedigreeNode = memo(PedigreeNodeComponent)
