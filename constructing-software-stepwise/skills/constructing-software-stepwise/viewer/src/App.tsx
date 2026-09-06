import { onCleanup, onSettled } from "solid-js"
import { Header, Outline, Summary, WorkspaceTabs } from "./shell"
import { Reader } from "./reader"
import { Chart } from "./chart"
import { useApp } from "./state"

export const App = () => {
  const app = useApp()
  const onHash = (event: Event) => app.fromHash(event)
  const onResize = () => requestAnimationFrame(app.fitGraph)
  onSettled(() => {
    window.addEventListener("hashchange", onHash)
    window.addEventListener("resize", onResize)
    app.fromHash()
    requestAnimationFrame(app.fitGraph)
  })
  onCleanup(() => {
    window.removeEventListener("hashchange", onHash)
    window.removeEventListener("resize", onResize)
  })
  return (
    <>
      <Header />
      <Summary />
      <WorkspaceTabs />
      <main class="workspace" id="workspace" data-view={app.workspaceView()} role="tabpanel" aria-labelledby={"view-" + app.workspaceView()}>
        <Outline />
        <Reader />
        <Chart />
      </main>
    </>
  )
}
