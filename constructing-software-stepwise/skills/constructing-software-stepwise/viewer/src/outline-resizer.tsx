import { useApp } from "./state"

/** A native-focusable split pane handle. Pointer capture keeps drags outside the handle coherent. */
export const OutlineResizer = () => {
  const app = useApp()
  let drag: { pointer: number; x: number; width: number } | undefined
  const finish = () => { drag = undefined; app.saveOutlineWidth() }
  return <div
    class="outline-resizer"
    role="separator"
    tabindex={0}
    aria-label="Resize design outline"
    aria-orientation="vertical"
    aria-controls="outline"
    aria-valuemin={app.outlineMin}
    aria-valuemax={app.outlineMax()}
    aria-valuenow={app.outlineWidth()}
    aria-valuetext={app.outlineWidth() + " pixels"}
    title="Drag to resize the outline. Arrow keys adjust width; Home/End select limits; double-click resets."
    onPointerDown={(event) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.currentTarget.focus()
      drag = { pointer: event.pointerId, x: event.clientX, width: app.outlineWidth() }
      event.currentTarget.setPointerCapture(event.pointerId)
    }}
    onPointerMove={(event) => {
      if (drag?.pointer === event.pointerId) app.resizeOutline(drag.width + event.clientX - drag.x)
    }}
    onPointerUp={(event) => {
      if (drag?.pointer !== event.pointerId) return
      finish()
      event.currentTarget.releasePointerCapture(event.pointerId)
    }}
    onPointerCancel={finish}
    onLostPointerCapture={finish}
    onDblClick={() => app.resizeOutline(255, true)}
    onKeyDown={(event) => {
      const delta = event.shiftKey ? 50 : 10
      const width = event.key === "ArrowLeft" ? app.outlineWidth() - delta
        : event.key === "ArrowRight" ? app.outlineWidth() + delta
        : event.key === "Home" ? app.outlineMin
        : event.key === "End" ? app.outlineMax() : undefined
      if (width === undefined) return
      event.preventDefault()
      app.resizeOutline(width, true)
    }}
  />
}
