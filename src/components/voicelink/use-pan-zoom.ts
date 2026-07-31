"use client"

import { useCallback, useRef, useState } from "react"

export interface Transform {
  x: number
  y: number
  scale: number
}

const MIN_SCALE = 0.6
const MAX_SCALE = 6

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Pan + zoom controller for an SVG element.
 * - Drag with one pointer to pan.
 * - Wheel to zoom (toward cursor).
 * - Pinch with two pointers to zoom (toward midpoint).
 * - Exposes zoomBy() / reset() for on-screen controls.
 */
export function usePanZoom(initial: Transform = { x: 0, y: 0, scale: 1 }) {
  const [transform, setTransform] = useState<Transform>(initial)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pan = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const pinch = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null)
  const moved = useRef(false)

  /** Convert a screen point to SVG user-space coordinates (pre-transform). */
  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }, [])

  /** Zoom around a content point (in pre-transform SVG units), keeping it fixed. */
  const zoomAround = useCallback(
    (svgPt: { x: number; y: number }, newScale: number) => {
      setTransform((t) => {
        const s = clamp(newScale, MIN_SCALE, MAX_SCALE)
        // Keep svgPt fixed: tx' = svgPt.x - (svgPt.x - tx) * (s / t.scale)
        // Equivalent: tx' = tx + (svgPt.x - tx) * (1 - s/t.scale)
        const k = 1 - s / t.scale
        return {
          x: t.x + (svgPt.x - t.x) * k,
          y: t.y + (svgPt.y - t.y) * k,
          scale: s,
        }
      })
    },
    [],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (svg) {
        try {
          svg.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      moved.current = false

      if (pointers.current.size === 1) {
        pan.current = {
          startX: e.clientX,
          startY: e.clientY,
          ox: transform.x,
          oy: transform.y,
        }
      } else if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()]
        pan.current = null
        const mid = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        }
        pinch.current = {
          dist: dist(pts[0], pts[1]),
          scale: transform.scale,
          cx: mid.x,
          cy: mid.y,
        }
      }
    },
    [transform.x, transform.y, transform.scale],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pinch.current && pointers.current.size >= 2) {
        const pts = [...pointers.current.values()]
        const newDist = dist(pts[0], pts[1])
        if (pinch.current.dist > 0) {
          const factor = newDist / pinch.current.dist
          const newScale = pinch.current.scale * factor
          const mid = {
            x: (pts[0].x + pts[1].x) / 2,
            y: (pts[0].y + pts[1].y) / 2,
          }
          const svgPt = toSvgPoint(mid.x, mid.y)
          zoomAround(svgPt, newScale)
        }
        moved.current = true
        return
      }

      if (pan.current) {
        const dx = e.clientX - pan.current.startX
        const dy = e.clientY - pan.current.startY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
        setTransform((t) => ({ ...t, x: pan.current!.ox + dx, y: pan.current!.oy + dy }))
      }
    },
    [toSvgPoint, zoomAround],
  )

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    const svg = svgRef.current
    if (svg) {
      try {
        svg.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) pan.current = null
  }, [])

  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      const svgPt = toSvgPoint(e.clientX, e.clientY)
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      setTransform((t) => {
        const newScale = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE)
        const k = 1 - newScale / t.scale
        return {
          x: t.x + (svgPt.x - t.x) * k,
          y: t.y + (svgPt.y - t.y) * k,
          scale: newScale,
        }
      })
    },
    [toSvgPoint],
  )

  const zoomBy = useCallback(
    (factor: number) => {
      // Zoom around the SVG center
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const svgPt = toSvgPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      setTransform((t) => {
        const newScale = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE)
        const k = 1 - newScale / t.scale
        return {
          x: t.x + (svgPt.x - t.x) * k,
          y: t.y + (svgPt.y - t.y) * k,
          scale: newScale,
        }
      })
    },
    [toSvgPoint],
  )

  const reset = useCallback(() => {
    setTransform(initial)
  }, [initial])

  /** Center a content point (in pre-transform SVG units) at a given scale. */
  const focus = useCallback((svgX: number, svgY: number, scale: number) => {
    const svg = svgRef.current
    const vb = svg?.viewBox?.baseVal
    const cx = vb ? vb.width / 2 : 500
    const cy = vb ? vb.height / 2 : 320
    const s = clamp(scale, MIN_SCALE, MAX_SCALE)
    setTransform({
      x: cx - svgX * s,
      y: cy - svgY * s,
      scale: s,
    })
  }, [])

  /** Directly set the transform (used by programmatic navigation). */
  const setT = useCallback((t: Transform) => {
    setTransform({ x: t.x, y: t.y, scale: clamp(t.scale, MIN_SCALE, MAX_SCALE) })
  }, [])

  /** Whether the last pointer interaction involved movement (used to suppress click-after-drag). */
  const didMove = useCallback(() => moved.current, [])

  return {
    svgRef,
    transform,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    zoomBy,
    reset,
    focus,
    setT,
    didMove,
  }
}
