# 🧰 Console Organizer – Chrome DevTools Extension

A lightweight Chrome **DevTools extension** that enhances the browser console with **custom filters, search highlighting, and structured log viewing**.

Built for developers who want more control over console logs while debugging.

---

## ✨ Features

* 📌 **Custom DevTools tab**
* 🔍 **Search with highlight**

  * Highlights only visible matches
* 🎚 **Log level filters**

  * `log`, `warn`, `error`
* 🧹 **Clear logs**
* 🧠 **Object-aware rendering**

  * Expand / collapse objects
* 🧭 **Single-scroll UI**

---

## 🧩 How It Works

* Injects a lightweight hook into the inspected page via **DevTools APIs**
* Captures:

  * `console.log`
  * `console.warn`
  * `console.error`
* Stores logs in memory for the active DevTools session
* Renders logs inside a custom DevTools panel

> ⚠️ Logs reset on page reload (expected DevTools behavior)

---

## 🚀 Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to:

   ```
   chrome://extensions
   ```
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder
6. Open DevTools on any webpage
7. Click the **Console Organizer** tab

---

## 🛠 Usage

1. Open any webpage
2. Open **Chrome DevTools**
3. Navigate to **Console Organizer**
4. Use:

   * Search box to filter & highlight logs
   * Checkboxes to toggle log levels
   * Clear buttons to reset logs or filters
5. Run logs in console:

   ```js
   console.log("Hello");
   console.warn({ user: "admin" });
   console.error("Something went wrong");
   ```

---

## ⚠️ Limitations

* Logs are session-based (cleared on refresh)
* Uses `eval` internally (DevTools-only, safe)
* Not intended for production logging

---

## 🧠 Future Improvements

* Collapse repeated logs
* Regex search mode
* Timeline view
* Export logs (JSON)
* Jump to next / previous match

