// src/components/share-button.tsx
'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QueryParams } from '@/components/query-form'

interface ShareButtonProps {
  params: QueryParams | null
}

export function ShareButton({ params }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  // Render nothing when no query has been submitted yet
  if (!params) return null

  async function handleShare() {
    const url = window.location.href  // URL already updated by router.replace() before this renders

    // Try Web Share API first (mobile native share sheet — iOS Safari, Android Chrome)
    // Guard: check typeof navigator for SSR safety (button is client-only but belt-and-suspenders)
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare({ url })
    ) {
      try {
        await navigator.share({ title: '高鐵查詢', url })
        return  // share sheet handled it — no clipboard needed
      } catch (e) {
        // User cancelled (AbortError) → do nothing; other errors → fall through to clipboard
        if ((e as DOMException).name === 'AbortError') return
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (non-HTTPS or permission denied) — fail silently
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied
        ? <Check className="h-4 w-4 mr-1" />
        : <Share2 className="h-4 w-4 mr-1" />
      }
      {copied ? '已複製' : '分享'}
    </Button>
  )
}
