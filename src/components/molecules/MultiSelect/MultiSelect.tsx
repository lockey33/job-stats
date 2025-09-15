'use client'

import { Box, Input } from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import CloseableTag from '@/components/atoms/CloseableTag/CloseableTag'
import SuggestionsList from '@/components/atoms/SuggestionsList/SuggestionsList'

type Normalizer = (s: string) => string

const defaultNormalize: Normalizer = (s) => s.toLowerCase().trim().replace(/\s+/g, ' ')

interface Props {
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  maxSuggestions?: number
  normalize?: Normalizer
  dedupeByNormalized?: boolean // true: dedupe by normalized form, false: dedupe by raw value
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Ajouter…',
  maxSuggestions = 12,
  normalize = defaultNormalize,
  dedupeByNormalized = true,
}: Props) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const normalizedOptions = useMemo(
    () => options.map((o) => ({ raw: o, norm: normalize(o) })),
    [options, normalize],
  )
  const selectedSet = useMemo(
    () => (dedupeByNormalized ? new Set(value.map(normalize)) : new Set(value)),
    [value, dedupeByNormalized, normalize],
  )
  const inputNorm = normalize(input)

  const suggestions = useMemo(() => {
    const isSelected = (o: { raw: string; norm: string }) =>
      dedupeByNormalized ? selectedSet.has(o.norm) : selectedSet.has(o.raw)
    if (!inputNorm) {
      return normalizedOptions
        .filter((o) => !isSelected(o))
        .slice(0, maxSuggestions)
        .map((o) => o.raw)
    }
    return normalizedOptions
      .filter((o) => !isSelected(o) && o.norm.includes(inputNorm))
      .slice(0, maxSuggestions)
      .map((o) => o.raw)
  }, [normalizedOptions, selectedSet, inputNorm, maxSuggestions, dedupeByNormalized])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function addItem(item: string) {
    const n = normalize(item)
    const exists = dedupeByNormalized ? selectedSet.has(n) : selectedSet.has(item)
    if (exists) return
    onChange([...value, item])
    setInput('')
    setOpen(false)
  }

  function removeItem(item: string) {
    if (dedupeByNormalized) {
      const n = normalize(item)
      onChange(value.filter((v) => normalize(v) !== n))
    } else {
      onChange(value.filter((v) => v !== item))
    }
  }

  return (
    <Box ref={containerRef} w="full">
      {value.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap="sm" mb="sm">
          {value.map((v) => (
            <CloseableTag key={v} onClose={() => removeItem(v)}>
              {v}
            </CloseableTag>
          ))}
        </Box>
      )}
      <Box position="relative">
        <Input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          size="sm"
        />

        {open && suggestions.length > 0 && (
          <SuggestionsList items={suggestions} onSelect={addItem} overlay />
        )}
      </Box>
    </Box>
  )
}
