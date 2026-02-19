// src/components/seat-badge.tsx
// Per user decision (LOCKED):
// - Colors: 充足=green, 有限=amber/yellow, 售完=red
// - 商務席 label uses amber color to distinguish from 標準席
// - Badge text is full Chinese: 充足 / 有限 / 售完
// - null status shows "—" (gray) — train not in seat status list

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TdxSeatCode } from '@/types/tdx'

const STATUS_CONFIG: Record<TdxSeatCode, { label: string; className: string }> = {
  O: { label: '充足', className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100' },
  L: { label: '有限', className: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100' },
  X: { label: '售完', className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100' },
}

interface SeatBadgeProps {
  status: TdxSeatCode | null
  type: '標準席' | '商務席'
  className?: string
}

export function SeatBadge({ status, type, className }: SeatBadgeProps) {
  const config = status ? STATUS_CONFIG[status] : null

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {/* 商務席 label is amber/gold to distinguish from 標準席 (per user decision) */}
      <span
        className={cn(
          'text-xs font-medium shrink-0',
          type === '商務席' ? 'text-amber-700' : 'text-muted-foreground'
        )}
      >
        {type}
      </span>
      {config ? (
        <Badge
          variant="outline"
          className={cn('text-xs px-1.5 py-0 h-5 font-normal', config.className)}
        >
          {config.label}
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="text-xs px-1.5 py-0 h-5 font-normal text-muted-foreground border-border"
        >
          —
        </Badge>
      )}
    </div>
  )
}
