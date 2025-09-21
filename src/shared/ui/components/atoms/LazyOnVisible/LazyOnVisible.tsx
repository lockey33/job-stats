'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  once?: boolean
}

export default function LazyOnVisible({
  children,
  placeholder = null,
  rootMargin = '200px',
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current

    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { root: null, rootMargin, threshold: 0 },
    )

    obs.observe(el)

    return () => obs.disconnect()
  }, [rootMargin, once])

  return <div ref={ref}>{visible ? children : placeholder}</div>
}
