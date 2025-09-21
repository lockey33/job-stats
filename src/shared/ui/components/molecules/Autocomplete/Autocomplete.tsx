'use client'

import { Box, Button, Input } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useOnClickOutside } from '@/shared/hooks/useOnClickOutside'
import SuggestionsList from '@/shared/ui/components/atoms/SuggestionsList/SuggestionsList'

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

  useOnClickOutside(ref, () => setOpen(false))

  const pick = useCallback(
    (s: string) => {
      onChange(s)
      setOpen(false)
    },
    [onChange],
  )

  const clear = useCallback(() => {
    onChange('')
    setInput('')
  }, [onChange])

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
