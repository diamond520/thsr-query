// src/hooks/use-local-storage.ts
'use client'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  // Read from localStorage on mount — client-only, never runs on server
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch (error) {
      console.error('[useLocalStorage] read error', error)
    }
    setFirstLoadDone(true)
  }, [key])

  // Write to localStorage whenever storedValue changes, but only after the initial read
  // The firstLoadDone flag prevents writing the empty initial value before the read fires
  useEffect(() => {
    if (!firstLoadDone) return
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error('[useLocalStorage] write error', error)
    }
  }, [storedValue, firstLoadDone, key])

  return [storedValue, setStoredValue]
}
