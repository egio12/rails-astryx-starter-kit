import assert from "node:assert/strict"
import test from "node:test"

import { createElement } from "react"
import { renderToString } from "react-dom/server"

// Node's native TypeScript loader requires explicit file extensions.
// eslint-disable-next-line import-x/extensions
import { useObjectUrl } from "../../app/javascript/hooks/use-object-url.ts"

function ObjectUrlHarness() {
  const [url] = useObjectUrl()

  return createElement("output", null, url)
}

test("does not allocate an object URL during render", () => {
  const originalCreateObjectURL = URL.createObjectURL
  let createCalls = 0
  URL.createObjectURL = () => {
    createCalls += 1
    return "blob:test"
  }

  try {
    renderToString(createElement(ObjectUrlHarness))
  } finally {
    URL.createObjectURL = originalCreateObjectURL
  }

  assert.equal(createCalls, 0)
})
