const logsEl = document.getElementById("logs")
const filterInput = document.getElementById("filterInput")
const clearBtn = document.getElementById("clear")

let logs = []

// Persist UI state across renders
const expandedObjects = new Map()
// key: logId + argIndex → boolean

// Listen to console logs from the inspected page
chrome.devtools.network.onNavigated.addListener(() => {
  logs = []
  logsEl.innerHTML = ""
})

chrome.devtools.inspectedWindow.onResourceAdded.addListener(() => {
  // optional
})

// 🔥 Capture console logs
chrome.devtools.inspectedWindow.eval(`
  (function () {
    if (window.__DEVTOOLS_LOGGER_INSTALLED__) return;
    window.__DEVTOOLS_LOGGER_INSTALLED__ = true;

    const originalLog = console.log;

    window.__DEVTOOLS_CONSOLE_LOGS__ = [];

    console.log = function (...args) {
      window.__DEVTOOLS_CONSOLE_LOGS__.push({
        id: crypto.randomUUID(),   // ✅ stable id
        type: "log",
        args,
        time: Date.now()
      });

      originalLog.apply(console, args);
    };

  })();
`)

let lastCount = 0

function fetchLogs() {
  chrome.devtools.inspectedWindow.eval(
    "window.__DEVTOOLS_CONSOLE_LOGS__ || []",
    (result) => {
      if (result.length !== lastCount) {
        logs = result
        lastCount = result.length
        render()
      }
    }
  )
}

const search = filterInput.value.trim()

function render() {
  const query = filterInput.value.trim()
  logsEl.innerHTML = ""

  logs.forEach((log) => {
    // 🚫 Skip non-matching logs
    if (!logMatchesSearch(log, query)) return

    const row = document.createElement("div")
    row.className = "log"

    log.args.forEach((arg, index) => {
      const key = `${log.id}:${index}`

      // Primitive values
      if (
        arg === null ||
        typeof arg === "string" ||
        typeof arg === "number" ||
        typeof arg === "boolean"
      ) {
        const div = document.createElement("div")
        div.className = "log-text"

        const text = String(arg)
        div.appendChild(highlightText(text, query))

        row.appendChild(div)
        return
      }

      // Object / Array
      const pre = document.createElement("pre")
      pre.className = "log-object"

      const json = JSON.stringify(arg, null, 2)
      pre.appendChild(highlightText(json, query))

      const isExpanded = expandedObjects.get(key) === true
      pre.style.maxHeight = isExpanded ? "none" : "80px"
      pre.style.overflow = "hidden"
      pre.style.cursor = "pointer"

      pre.onclick = () => {
        const next = !expandedObjects.get(key)
        expandedObjects.set(key, next)
        pre.style.maxHeight = next ? "none" : "80px"
      }

      row.appendChild(pre)
    })

    logsEl.appendChild(row)
  })
}

filterInput.addEventListener("input", render)

clearBtn.onclick = () => {
  logs = []
  logsEl.innerHTML = ""
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightText(text, query) {
  if (!query) return document.createTextNode(text)

  const safeQuery = escapeRegExp(query)
  const regex = new RegExp(`(${safeQuery})`, "gi")

  const fragment = document.createDocumentFragment()
  let lastIndex = 0

  text.replace(regex, (match, _, index) => {
    // text before match
    if (index > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.slice(lastIndex, index))
      )
    }

    // highlighted match
    const span = document.createElement("span")
    span.className = "highlight"
    span.textContent = match
    fragment.appendChild(span)

    lastIndex = index + match.length
  })

  // remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
  }

  return fragment
}

function logMatchesSearch(log, query) {
  if (!query) return true

  const q = query.toLowerCase()

  return log.args.some((arg) => {
    try {
      if (
        arg === null ||
        typeof arg === "string" ||
        typeof arg === "number" ||
        typeof arg === "boolean"
      ) {
        return String(arg).toLowerCase().includes(q)
      }

      // Object / array
      return JSON.stringify(arg).toLowerCase().includes(q)
    } catch {
      return false
    }
  })
}

// Refresh logs
setInterval(fetchLogs, 1000)
