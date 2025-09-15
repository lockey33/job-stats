'use client'

import { Box, Input } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CloseableTag from '@/components/atoms/CloseableTag/CloseableTag'

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addOnBlur?: boolean
}

export default function ChipsInput({
  value,
  onChange,
  placeholder = 'Ajouter…',
  addOnBlur = true,
}: Props) {
  const [input, setInput] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const normSet = useMemo(() => new Set(value.map(norm)), [value])

  const addChip = useCallback(
    (raw: string) => {
      const n = norm(raw)
      if (!n) return
      if (normSet.has(n)) {
        setInput('')
        return
      }
      onChange([...value, raw.trim()])
      setInput('')
    },
    [normSet, onChange, value],
  )

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addChip(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      // quick remove last chip
      const next = value.slice(0, -1)
      onChange(next)
    }
  }

  const removeChip = useCallback(
    (s: string) => {
      const n = norm(s)
      onChange(value.filter((v) => norm(v) !== n))
    },
    [onChange, value],
  )

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        if (addOnBlur && input.trim()) addChip(input)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [input, addOnBlur, addChip])

  return (
    <Box ref={containerRef} w="full">
      {value.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap="sm" mb="sm">
          {value.map((s) => (
            <CloseableTag key={s} onClose={() => removeChip(s)}>
              {s}
            </CloseableTag>
          ))}
        </Box>
      )}
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        size="sm"
      />
    </Box>
  )
}
