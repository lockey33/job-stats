"use client";

import { JobItem } from '@/lib/domain/types';
import { Box, Text, Table, Tag } from '@chakra-ui/react';

interface Props {
  items: JobItem[];
  total: number;
  onSelect?: (item: JobItem) => void;
}

export default function ResultsTable({ items, total, onSelect }: Props) {
  return (
    <Box w="full">
      <Text fontSize="sm" color="gray.600" mb="sm">
        {total.toLocaleString()} résultats
      </Text>
      <Box overflowX="auto" rounded="lg" borderWidth="0px" bg="transparent" shadow="none" borderTopWidth="1px" borderColor="neutral.200">
        <Table.Root size="sm">
          <Table.Header bg="gray.50">
            <Table.Row>
              <Table.ColumnHeader>Titre</Table.ColumnHeader>
              <Table.ColumnHeader>Entreprise</Table.ColumnHeader>
              <Table.ColumnHeader>Ville</Table.ColumnHeader>
              <Table.ColumnHeader>Exp.</Table.ColumnHeader>
              <Table.ColumnHeader>TJM</Table.ColumnHeader>
              <Table.ColumnHeader>Skills</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((it, idx) => (
              <Table.Row
                key={`${it.id}-${it.created_at ?? ''}-${idx}`}
                cursor="pointer"
                onClick={() => onSelect?.(it)}
                title="Afficher le détail"
                _hover={{ bg: 'gray.50' }}
              >
                <Table.Cell>
                  <Text fontWeight="medium">{it.title ?? it.slug ?? it.job_slug ?? '—'}</Text>
                </Table.Cell>
                <Table.Cell>{it.company_name ?? '—'}</Table.Cell>
                <Table.Cell>{it.city ?? '—'}</Table.Cell>
                <Table.Cell>{it.experience ?? '—'}</Table.Cell>
                <Table.Cell>
                  {it.min_tjm || it.max_tjm ? (
                    <Text as="span">
                      {it.min_tjm ?? '—'}
                      {it.max_tjm ? `–${it.max_tjm}` : ''} €
                    </Text>
                  ) : (
                    '—'
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Box display="flex" flexWrap="wrap" gap="xs">
                    {(it.skills ?? []).slice(0, 6).map((s, idx2) => (
                      <Tag.Root key={`${it.id}-${idx2}-${s}`} size="sm" variant="subtle" colorPalette="brand">
                        <Tag.Label>{s}</Tag.Label>
                      </Tag.Root>
                    ))}
                  </Box>
                </Table.Cell>
                <Table.Cell>{it.created_at?.slice(0, 10) ?? '—'}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
