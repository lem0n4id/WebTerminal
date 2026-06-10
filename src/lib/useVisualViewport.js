import { useEffect } from 'react'

// Pins the app box to the visual viewport so the soft keyboard never covers
// the input line or bottom bars. On Android Chrome the viewport meta
// interactive-widget=resizes-content does the work natively; on iOS Safari the
// layout viewport never resizes for the keyboard, so we resize manually on
// visualViewport resize/scroll (height + offsetTop). See MOBILE_PLAN.md.
export function useVisualViewport(ref, onResize) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !ref.current) return
    const el = ref.current
    const fit = () => {
      el.style.height = vv.height + 'px'
      el.style.transform = `translateY(${vv.offsetTop}px)`
      if (onResize) onResize()
    }
    vv.addEventListener('resize', fit)
    vv.addEventListener('scroll', fit)
    fit()
    return () => {
      vv.removeEventListener('resize', fit)
      vv.removeEventListener('scroll', fit)
      el.style.height = ''
      el.style.transform = ''
    }
  }, [ref, onResize])
}
