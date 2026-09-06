import { render } from "@solidjs/web"
import "./styles.css"
import { Model, readSnapshot } from "./model"
import { AppProvider, createAppState } from "./state"
import { App } from "./App"

const snapshot = readSnapshot()
document.title = snapshot.title + " · Stepwise"
const app = createAppState(new Model(snapshot))

render(() => (
  <AppProvider value={app}>
    <App />
  </AppProvider>
), document.getElementById("app")!)
