'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const ReactDatePicker = dynamic(
  () =>
    import('react-datepicker').then(
      (m) => m.default as unknown as React.ComponentType<Record<string, unknown>>,
    ),
  { ssr: false },
)

export interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  dateFormat?: string
  placeholderText?: string
  isClearable?: boolean
  minDate?: Date | null
  maxDate?: Date | null
  selectsStart?: boolean
  selectsEnd?: boolean
  startDate?: Date | null
  endDate?: Date | null
  todayButton?: string
  // date-fns locales are dynamic objects; keep this broad for simplicity
  locale?: unknown
  customInput?: React.ReactElement
}

export default function DatePicker(props: DatePickerProps) {
  // Narrow, vetted prop surface; forward to react-datepicker without leaking complex union types
  return <ReactDatePicker {...(props as unknown as Record<string, unknown>)} />
}
