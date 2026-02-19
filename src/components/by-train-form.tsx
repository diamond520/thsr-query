// src/components/by-train-form.tsx
// Train number input with digit-only validation (1-4 chars).
// Emits trainNo string to parent via onSubmit; does NOT fetch data itself.
'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ByTrainFormProps {
  onSubmit: (trainNo: string) => void
}

/** Validates train number: digits only, 1-4 characters. */
function isValidTrainNo(value: string): boolean {
  return /^\d{1,4}$/.test(value.trim())
}

export function ByTrainForm({ onSubmit }: ByTrainFormProps) {
  const [trainNo, setTrainNo] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidTrainNo(trainNo)) return
    onSubmit(trainNo.trim())
  }

  const isValid = isValidTrainNo(trainNo)

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="train-no">車次號</Label>
        <Input
          id="train-no"
          type="text"
          inputMode="numeric"
          placeholder="例：0117"
          value={trainNo}
          onChange={e => setTrainNo(e.target.value)}
          maxLength={4}
          className="max-w-[160px]"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">請輸入 1–4 位數字車次號</p>
      </div>
      <Button type="submit" disabled={!isValid}>
        <Search className="mr-2 h-4 w-4" />
        查詢
      </Button>
    </form>
  )
}
