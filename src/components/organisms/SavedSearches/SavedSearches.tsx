'use client'

import { useEffect, useMemo, useState } from 'react'
import { JobFilters } from '@/features/jobs/types/types'
import { toQueryString } from '@/shared/utils/searchParams'
import { Box, Input, Button, Tag, Text } from '@chakra-ui/react'

const STORAGE_KEY = 'job-stats:saved-searches:v1'

export interface SavedSearchItem {
  id: string
  name: string
  filters: JobFilters
  createdAt: string // ISO
}

interface Props {
  currentFilters: JobFilters
  onApply: (filters: JobFilters) => void
  className?: string
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function SavedSearches({ currentFilters, onApply, className }: Props) {
  const [items, setItems] = useState<SavedSearchItem[]>([])
  const [name, setName] = useState('')

  // Load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch (e) {
      console.warn('Failed to load saved searches', e)
    }
  }, [])

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to save searches', e)
    }
  }, [items])

  const canSave = useMemo(() => name.trim().length > 0, [name])

  function saveCurrent() {
    if (!canSave) return
    const item: SavedSearchItem = {
      id: uid(),
      name: name.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    }
    setItems((prev) => [item, ...prev])
    setName('')
  }

  function applyItem(it: SavedSearchItem) {
    onApply({ ...it.filters })
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  async function copyLink(it: SavedSearchItem) {
    try {
      const qs = toQueryString({ ...it.filters, page: 1 })
      const url = `${window.location.origin}${window.location.pathname}?${qs}`
      await navigator.clipboard.writeText(url)
    } catch (e) {
      console.warn('Clipboard copy failed', e)
    }
  }

  return (
    <Box className={className}>
      <Box rounded="lg" borderWidth="0px" p={0} bg="transparent" shadow="none">
        <Box
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          gap="sm"
          alignItems={{ md: 'flex-end' }}
        >
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb="xs">
              Nom de la recherche
            </Text>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Paris + React + TJM > 600"
              size="sm"
            />
          </Box>
          <Button
            size="sm"
            colorPalette="brand"
            disabled={!canSave}
            onClick={saveCurrent}
            title="Enregistrer la recherche actuelle"
          >
            Enregistrer
          </Button>
        </Box>

        {items.length > 0 ? (
          <Box mt="md">
            <Text fontSize="xs" color="gray.600">
              Favoris
            </Text>
            <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
              {items.map((it) => (
                <Tag.Root key={it.id} size="sm">
                  <Tag.Label>
                    <Button
                      variant="plain"
                      size="xs"
                      onClick={() => applyItem(it)}
                      title={`Appliquer: ${it.name}`}
                    >
                      {it.name}
                    </Button>
                  </Tag.Label>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => copyLink(it)}
                    title="Copier le lien"
                  >
                    🔗
                  </Button>
                  <Tag.CloseTrigger onClick={() => deleteItem(it.id)} title="Supprimer" />
                </Tag.Root>
              ))}
            </Box>
          </Box>
        ) : (
          <Text fontSize="xs" color="gray.600" mt="sm">
            Aucune recherche enregistrée pour le moment.
          </Text>
        )}
      </Box>
    </Box>
  )
}
