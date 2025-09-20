'use client'

import { chakra, type HTMLChakraProps } from '@chakra-ui/react'

type SvgProps = HTMLChakraProps<'svg'>

export function DownloadIcon(props: SvgProps) {
  return (
    <chakra.svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 3v12m0 0l-4-4m4 4 4-4M4 19h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </chakra.svg>
  )
}

export function FilterIcon(props: SvgProps) {
  return (
    <chakra.svg viewBox="0 0 24 24" {...props}>
      <path
        d="M3 5h18l-7 8v6l-4 2v-8L3 5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </chakra.svg>
  )
}

export function StarIcon(props: SvgProps) {
  return (
    <chakra.svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="currentColor"
      />
    </chakra.svg>
  )
}

export function ResetIcon(props: SvgProps) {
  return (
    <chakra.svg viewBox="0 0 24 24" {...props}>
      <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor" />
    </chakra.svg>
  )
}

export function CloseIcon(props: SvgProps) {
  return (
    <chakra.svg viewBox="0 0 24 24" {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </chakra.svg>
  )
}
