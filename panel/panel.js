const logsEl = document.getElementById("logs")
const filterInput = document.getElementById("filterInput")
const clearBtn = document.getElementById("clear")

const showLogEl = document.getElementById("showLog")
const showWarnEl = document.getElementById("showWarn")
const showErrorEl = document.getElementById("showError")
const clearFilterBtn = document.getElementById("clearFilter")

let logs = []

// Persist UI state across renders
const expandedObjects = new Map()
// key: logId + argIndex → boolean

let lastCount = 0

const search = filterInput.value.trim()

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

    window.__DEVTOOLS_CONSOLE_LOGS__ = [];

    function push(type, args) {
      window.__DEVTOOLS_CONSOLE_LOGS__.push({
        id: (crypto && crypto.randomUUID && crypto.randomUUID()) ||
            Date.now().toString() + Math.random().toString(36),
        type,
        args,
        time: Date.now()
      });
    }

    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = function (...args) {
      push("log", args);
      origLog.apply(console, args);
    };

    console.warn = function (...args) {
      push("warn", args);
      origWarn.apply(console, args);
    };

    console.error = function (...args) {
      push("error", args);
      origError.apply(console, args);
    };
  })();
`)

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

function render() {
  const query = filterInput.value.trim()
  logsEl.innerHTML = ""

  logs.forEach((log) => {
    // 🚫 log-level filter
    if (!isLogTypeVisible(log.type)) return

    // 🚫 search filter (visible only matches)
    if (!logMatchesSearch(log, query)) return

    const row = document.createElement("div")
    row.className = `log ${log.type}`

    log.args.forEach((arg, index) => {
      const key = `${log.id}:${index}`

      // Primitive
      if (
        arg === null ||
        typeof arg === "string" ||
        typeof arg === "number" ||
        typeof arg === "boolean"
      ) {
        const div = document.createElement("div")
        div.className = "log-text"
        div.appendChild(highlightText(String(arg), query))
        row.appendChild(div)
        return
      }

      // Object
      const pre = document.createElement("pre")
      pre.className = "log-object"
      pre.appendChild(highlightText(JSON.stringify(arg, null, 2), query))

      const expanded = expandedObjects.get(key) === true
      pre.style.maxHeight = expanded ? "none" : "80px"
      pre.style.overflow = "hidden"
      pre.style.cursor = "pointer"

      pre.onclick = () => {
        expandedObjects.set(key, !expanded)
        pre.style.maxHeight = expanded ? "80px" : "none"
      }

      row.appendChild(pre)
    })

    logsEl.appendChild(row)
  })
}

;[showLogEl, showWarnEl, showErrorEl].forEach((el) => {
  if (!el) return
  el.addEventListener("change", render)
})

filterInput.addEventListener("input", render)

clearBtn.onclick = () => {
  chrome.devtools.inspectedWindow.eval("window.__DEVTOOLS_CONSOLE_LOGS__ = []")
  logs = []
  lastCount = 0
  logsEl.innerHTML = ""
}

clearFilterBtn.onclick = () => {
  filterInput.value = ""
  render()
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

function isLogTypeVisible(type) {
  if (type === "log") return showLogEl?.checked ?? true
  if (type === "warn") return showWarnEl?.checked ?? true
  if (type === "error") return showErrorEl?.checked ?? true
  return true
}

// Refresh logs
setInterval(fetchLogs, 1000)
