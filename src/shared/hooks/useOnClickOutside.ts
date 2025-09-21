import { useEffect } from 'react'

type PossibleRef = React.RefObject<HTMLElement | null> | null | undefined

export function useOnClickOutside(
  refs: PossibleRef | PossibleRef[],
  handler: (e: MouseEvent) => void,
) {
  useEffect(() => {
    const list = Array.isArray(refs) ? refs : [refs]

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null

      if (!target) return

      for (const r of list) {
        const el = r?.current

        if (el && el.contains(target)) return
      }

      handler(e)
    }

    document.addEventListener('click', onDocClick)

    return () => document.removeEventListener('click', onDocClick)
  }, [refs, handler])
}
