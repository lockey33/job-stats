'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Input, Button } from '@chakra-ui/react'
import SuggestionsList from '@/components/atoms/SuggestionsList/SuggestionsList'

type Normalizer = (s: string) => string

const defaultNormalize: Normalizer = (s) => s.toLowerCase().trim()

interface Props {
  options: string[]
  value: string
  onChange: (next: string) => void
  placeholder?: string
  normalize?: Normalizer
  clearable?: boolean
}

export default function Autocomplete({
  options,
  value,
  onChange,
  placeholder = 'Choisir…',
  normalize = defaultNormalize,
  clearable = true,
}: Props) {
  const [input, setInput] = useState<string>(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => setInput(value || ''), [value])

  const opts = useMemo(
    () => options.map((o) => ({ raw: o, norm: normalize(o) })),
    [options, normalize],
  )
  const inputNorm = normalize(input)

  const suggestions = useMemo(() => {
    if (!inputNorm) return opts.slice(0, 12).map((o) => o.raw)
    return opts
      .filter((o) => o.norm.includes(inputNorm))
      .slice(0, 12)
      .map((o) => o.raw)
  }, [opts, inputNorm])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function pick(s: string) {
    onChange(s)
    setOpen(false)
  }

  function clear() {
    onChange('')
    setInput('')
  }

  return (
    <Box ref={ref} w="full">
      <Box position="relative" display="flex" alignItems="center" gap={2}>
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
        {clearable && value && (
          <Button type="button" size="sm" variant="outline" onClick={clear}>
            Effacer
          </Button>
        )}
        {open && suggestions.length > 0 && (
          <SuggestionsList items={suggestions} onSelect={pick} overlay />
        )}
      </Box>
    </Box>
  )
}
