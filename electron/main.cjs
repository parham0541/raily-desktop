const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require('electron')

const path =
  require('node:path')

const https =
  require('node:https')

const { performance } =
  require('node:perf_hooks')

const {
  getDatabase,

  getSettings,
  updateSettings,

  getEffectiveNow,
  setServerTime,

  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,

  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,

  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,

  getSleepRecords,
  createSleepRecord,
  updateSleepRecord,
  deleteSleepRecord,

  getMindRecords,
  createMindRecord,
  updateMindRecord,
  deleteMindRecord,

  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('./database.cjs')

let mainWindow = null

function createWindow() {
  mainWindow =
    new BrowserWindow({
      width: 1440,
      height: 900,

      minWidth: 1100,
      minHeight: 700,

      webPreferences: {
        preload:
          path.join(
            __dirname,
            'preload.cjs',
          ),

        contextIsolation:
          true,

        nodeIntegration:
          false,
      },

      autoHideMenuBar:
        true,
    })

  const indexPath =
    path.join(
      __dirname,
      '../dist/index.html',
    )

  mainWindow.loadFile(
    indexPath,
  )

  mainWindow.on(
    'closed',
    () => {
      mainWindow = null
    },
  )
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'settings:get',
  () => {
    console.log(
      '[IPC] settings:get',
    )

    return getSettings()
  },
)

ipcMain.handle(
  'settings:update',
  (
    _event,
    settings,
  ) => {
    console.log(
      '[IPC] settings:update',
    )

    const updatedSettings = updateSettings(
      settings,
    )

    if (updatedSettings?.dateMode === 'server') {
      void syncIranServerTime()
    }

    return updatedSettings
  },
)

/* -------------------------------------------------------------------------- */
/* Clock                                                                       */
/* -------------------------------------------------------------------------- */

/*
 * Clock synchronization
 *
 * "Iran Server" uses Tehran's timezone as the display timezone and compares
 * independent public time sources. No single source is assumed to be correct.
 */

const CLOCK_SOURCES = [
  {
    name: 'Cloudflare',
    url: 'https://www.cloudflare.com/cdn-cgi/trace',
    parse(response) {
      const match = response.body.match(/(?:^|\n)ts=([0-9]+(?:\.[0-9]+)?)(?:\n|$)/)
      if (!match) throw new Error('Cloudflare did not return a timestamp.')
      return Number(match[1]) * 1000
    },
  },
  {
    name: 'WorldTimeAPI Tehran',
    url: 'https://worldtimeapi.org/api/timezone/Asia/Tehran',
    parse(response) {
      const payload = JSON.parse(response.body)
      const value = Number(payload.unixtime)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('WorldTimeAPI returned an invalid timestamp.')
      }
      return value * 1000
    },
  },
  {
    name: 'TimeAPI Tehran',
    url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia%2FTehran',
    parse(response) {
      const payload = JSON.parse(response.body)
      const dateTime = String(payload.dateTime || '')
      if (!dateTime) {
        throw new Error('TimeAPI returned an invalid dateTime.')
      }

      // Date/time strings without an offset represent Tehran local time.
      // Parse their fields as UTC first, then subtract Tehran's UTC offset.
      if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dateTime)) {
        const match = dateTime.match(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/,
        )
        const offsetSeconds = Number(payload.currentUtcOffset?.seconds)
        if (!match || !Number.isFinite(offsetSeconds)) {
          throw new Error('TimeAPI returned an invalid local date or UTC offset.')
        }

        const milliseconds = Number((match[7] || '').padEnd(3, '0').slice(0, 3) || 0)
        const localAsUtc = Date.UTC(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
          Number(match[4]),
          Number(match[5]),
          Number(match[6]),
          milliseconds,
        )
        return localAsUtc - offsetSeconds * 1000
      }

      const timestamp = Date.parse(dateTime)
      if (!Number.isFinite(timestamp)) {
        throw new Error('TimeAPI returned an invalid dateTime.')
      }
      return timestamp
    },
  },
  {
    name: 'Google Date header',
    url: 'https://www.google.com/generate_204',
    parse(response) {
      const dateHeader = response.headers.date
      const timestamp = Date.parse(dateHeader || '')
      if (!Number.isFinite(timestamp)) {
        throw new Error('Google did not return a valid Date header.')
      }
      return timestamp
    },
  },
]

function fetchClockSource(source) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now()
    let settled = false

    const finish = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }

    const request = https.get(
      source.url,
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'Raily-Life-Planner/1.0',
          'Cache-Control': 'no-cache',
        },
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')

        response.on('data', (chunk) => {
          body += chunk
          if (body.length > 256 * 1024) {
            request.destroy(new Error('Time server response was too large.'))
          }
        })

        response.on('end', () => {
          const endedAt = performance.now()
          const statusCode = Number(response.statusCode || 0)

          if (statusCode < 200 || statusCode >= 400) {
            finish(reject, new Error(`HTTP ${statusCode}`))
            return
          }

          try {
            const timestamp = Number(source.parse({
              body,
              headers: response.headers,
              statusCode,
            }))

            if (!Number.isFinite(timestamp) || timestamp <= 0) {
              throw new Error('Invalid timestamp.')
            }

            // Estimate the timestamp at the midpoint of the request to
            // reduce network-latency bias.
            const midpointCorrection = Math.max(0, endedAt - startedAt) / 2
            finish(resolve, {
              name: source.name,
              timestamp: timestamp + midpointCorrection,
              latencyMs: endedAt - startedAt,
            })
          } catch (error) {
            finish(reject, error)
          }
        })
      },
    )

    request.setTimeout(5000, () => {
      request.destroy(new Error('Time server request timed out.'))
    })

    request.on('error', (error) => finish(reject, error))
  })
}

let serverTimeSyncPromise = null
let lastClockSyncStatus = null
let lastClockSyncAt = 0
const CLOCK_RESYNC_INTERVAL_MS = 5 * 60 * 1000

async function syncIranServerTime() {
  if (serverTimeSyncPromise) return serverTimeSyncPromise

  serverTimeSyncPromise = (async () => {
    const results = await Promise.allSettled(
      CLOCK_SOURCES.map((source) => fetchClockSource(source)),
    )

    const successful = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)

    const failures = results
      .map((result, index) => ({
        name: CLOCK_SOURCES[index].name,
        error: result.status === 'rejected'
          ? result.reason?.message || 'Unknown error'
          : null,
      }))
      .filter((result) => result.error)

    console.log('[Clock] Sources responded:', successful.map((item) => ({
      name: item.name,
      latencyMs: item.latencyMs,
    })))
    if (failures.length) {
      console.warn('[Clock] Sources failed:', failures)
    }

    if (successful.length === 0) {
      throw new Error('هیچ منبع زمانی در دسترس نیست. اتصال اینترنت را بررسی کن.')
    }

    // Find the largest cluster whose timestamps are within five seconds.
    // This avoids trusting one badly skewed or faulty source.
    const sorted = [...successful].sort((a, b) => a.timestamp - b.timestamp)
    let bestCluster = []

    for (let left = 0; left < sorted.length; left += 1) {
      for (let right = left; right < sorted.length; right += 1) {
        const candidate = sorted.slice(left, right + 1)
        if (
          candidate[candidate.length - 1].timestamp - candidate[0].timestamp <= 5000 &&
          candidate.length > bestCluster.length
        ) {
          bestCluster = candidate
        }
      }
    }

    // Require agreement whenever two or more sources answered. A single
    // available source is accepted as a low-confidence fallback.
    if (successful.length > 1 && bestCluster.length < 2) {
      throw new Error('منابع ساعت با هم توافق ندارند. دوباره تلاش کن.')
    }

    const trusted = bestCluster.length >= 2 ? bestCluster : successful
    const timestamps = trusted
      .map((item) => item.timestamp)
      .sort((a, b) => a - b)
    const middle = Math.floor(timestamps.length / 2)
    const median = timestamps.length % 2
      ? timestamps[middle]
      : (timestamps[middle - 1] + timestamps[middle]) / 2

    setServerTime(median)
    lastClockSyncAt = performance.now()

    const status = {
      synchronized: true,
      timezone: 'Asia/Tehran',
      timestamp: median,
      sourceCount: trusted.length,
      sources: trusted.map((item) => item.name),
      confidence: trusted.length >= 2 ? 'high' : 'low',
      synchronizedAt: new Date().toISOString(),
      failedSources: failures,
    }

    lastClockSyncStatus = status
    console.log('[Clock] Iran server time synchronized:', status)
    return status
  })().finally(() => {
    serverTimeSyncPromise = null
  })

  return serverTimeSyncPromise
}

ipcMain.handle('clock:sync', async () => {
  try {
    return {
      ok: true,
      ...(await syncIranServerTime()),
    }
  } catch (error) {
    console.warn('[Clock] Synchronization failed:', error.message)
    return {
      ok: false,
      error: error.message || 'Clock synchronization failed.',
    }
  }
})

ipcMain.handle('clock:get', async () => {
  const settings = getSettings()
  let syncStatus = null

  if (settings?.dateMode === 'server') {
    try {
      // Reuse the synchronized clock instead of querying the internet every
      // time the UI asks for the current time.
      const isStale =
        !lastClockSyncStatus ||
        !lastClockSyncAt ||
        performance.now() - lastClockSyncAt >= CLOCK_RESYNC_INTERVAL_MS

      if (isStale) {
        syncStatus = await syncIranServerTime()
      } else {
        syncStatus = lastClockSyncStatus
      }
    } catch (error) {
      syncStatus = {
        synchronized: false,
        timezone: 'Asia/Tehran',
        error: error.message,
      }
      lastClockSyncAt = performance.now()
      lastClockSyncStatus = syncStatus
    }
  }

  const now = getEffectiveNow()

  return {
    timestamp: now.getTime(),
    iso: now.toISOString(),
    dateMode: settings?.dateMode ?? 'system',
    timezone: settings?.dateMode === 'server' ? 'Asia/Tehran' : undefined,
    serverClock: syncStatus,
  }
})

/* -------------------------------------------------------------------------- */
/* Todo                                                                        */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'todos:get',
  () => {
    console.log(
      '[IPC] todos:get',
    )

    return getTodos()
  },
)

ipcMain.handle(
  'todos:create',
  (
    _event,
    todo,
  ) => {
    console.log(
      '[IPC] todos:create',
    )

    return createTodo(
      todo,
    )
  },
)

ipcMain.handle(
  'todos:update',
  (
    _event,
    id,
    updates,
  ) => {
    console.log(
      '[IPC] todos:update',
      id,
    )

    return updateTodo(
      id,
      updates,
    )
  },
)

ipcMain.handle(
  'todos:delete',
  (
    _event,
    id,
  ) => {
    console.log(
      '[IPC] todos:delete',
      id,
    )

    return deleteTodo(
      id,
    )
  },
)

/* -------------------------------------------------------------------------- */
/* Goals                                                                       */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'goals:get',
  () => {
    console.log(
      '[IPC] goals:get',
    )

    return getGoals()
  },
)

ipcMain.handle(
  'goals:create',
  (
    _event,
    goal,
  ) => {
    console.log(
      '[IPC] goals:create',
    )

    return createGoal(
      goal,
    )
  },
)

ipcMain.handle(
  'goals:update',
  (
    _event,
    id,
    updates,
  ) => {
    console.log(
      '[IPC] goals:update',
      id,
    )

    return updateGoal(
      id,
      updates,
    )
  },
)

ipcMain.handle(
  'goals:delete',
  (
    _event,
    id,
  ) => {
    console.log(
      '[IPC] goals:delete',
      id,
    )

    return deleteGoal(
      id,
    )
  },
)

/* -------------------------------------------------------------------------- */
/* Activities                                                                  */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'activities:get',
  () => {
    console.log(
      '[IPC] activities:get',
    )

    return getActivities()
  },
)

ipcMain.handle(
  'activities:create',
  (
    _event,
    activity,
  ) => {
    console.log(
      '[IPC] activities:create',
    )

    return createActivity(
      activity,
    )
  },
)

ipcMain.handle(
  'activities:update',
  (
    _event,
    id,
    updates,
  ) => {
    console.log(
      '[IPC] activities:update',
      id,
    )

    return updateActivity(
      id,
      updates,
    )
  },
)

ipcMain.handle(
  'activities:delete',
  (
    _event,
    id,
  ) => {
    console.log(
      '[IPC] activities:delete',
      id,
    )

    return deleteActivity(
      id,
    )
  },
)

/* -------------------------------------------------------------------------- */
/* Sleep                                                                       */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'sleep:get',
  () => {
    console.log(
      '[IPC] sleep:get',
    )

    return getSleepRecords()
  },
)

ipcMain.handle(
  'sleep:create',
  (
    _event,
    sleepRecord,
  ) => {
    console.log(
      '[IPC] sleep:create',
    )

    return createSleepRecord(
      sleepRecord,
    )
  },
)

ipcMain.handle(
  'sleep:update',
  (
    _event,
    id,
    updates,
  ) => {
    console.log(
      '[IPC] sleep:update',
      id,
    )

    return updateSleepRecord(
      id,
      updates,
    )
  },
)

ipcMain.handle(
  'sleep:delete',
  (
    _event,
    id,
  ) => {
    console.log(
      '[IPC] sleep:delete',
      id,
    )

    return deleteSleepRecord(
      id,
    )
  },
)

/* -------------------------------------------------------------------------- */
/* Mind                                                                        */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'mind:get',
  () => {
    console.log(
      '[IPC] mind:get',
    )

    return getMindRecords()
  },
)

ipcMain.handle(
  'mind:create',
  (
    _event,
    mindRecord,
  ) => {
    console.log(
      '[IPC] mind:create',
    )

    return createMindRecord(
      mindRecord,
    )
  },
)

ipcMain.handle(
  'mind:update',
  (
    _event,
    id,
    updates,
  ) => {
    console.log(
      '[IPC] mind:update',
      id,
    )

    return updateMindRecord(
      id,
      updates,
    )
  },
)

ipcMain.handle(
  'mind:delete',
  (
    _event,
    id,
  ) => {
    console.log(
      '[IPC] mind:delete',
      id,
    )

    return deleteMindRecord(
      id,
    )
  },
)

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

ipcMain.handle(
  'events:get',
  () => {
    console.log(
      '[IPC] events:get',
    )

    return getEvents()
  },
)

ipcMain.handle(
  'events:create',
  (
    _event,
    eventRecord,
  ) => {
    console.log(
      '[IPC] events:create',
    )

    return createEvent(
      eventRecord,
    )
  },
)

ipcMain.handle(
  'events:update',
  (
    _event,
    id,
    updates,
  ) => {
    console.log(
      '[IPC] events:update',
      id,
    )

    return updateEvent(
      id,
      updates,
    )
  },
)

ipcMain.handle(
  'events:delete',
  (
    _event,
    id,
  ) => {
    console.log(
      '[IPC] events:delete',
      id,
    )

    return deleteEvent(
      id,
    )
  },
)

/* -------------------------------------------------------------------------- */
/* PDF report                                                                  */
/* -------------------------------------------------------------------------- */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatPdfNumber(value, digits = 0) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(number)
}

function buildPdfHtml(report) {
  const isFa = report?.language !== 'en'
  const direction = isFa ? 'rtl' : 'ltr'

  const title = isFa
    ? 'گزارش جامع Raily'
    : 'Raily Complete Report'

  const subtitle = report?.rangeLabel ||
    (isFa ? 'گزارش عملکرد' : 'Performance report')

  const cards = Array.isArray(report?.cards)
    ? report.cards
    : []

  const sections = Array.isArray(report?.sections)
    ? report.sections
    : []

  return `<!doctype html>
<html lang="${isFa ? 'fa' : 'en'}" dir="${direction}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 16mm 14mm; }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #172033;
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    direction: ${direction};
    unicode-bidi: plaintext;
  }

  body {
    font-size: 11px;
    line-height: 1.7;
    unicode-bidi: plaintext;
  }

  h1, h2, h3, p, span, div {
    unicode-bidi: plaintext;
  }

  .text-content {
    direction: auto;
    unicode-bidi: plaintext;
    text-align: ${isFa ? 'right' : 'left'};
  }

  .page {
    width: 100%;
  }

  .header {
    border-bottom: 2px solid #2563eb;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }

  .title {
    font-size: 25px;
    font-weight: 800;
    margin: 0;
    color: #0f172a;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .subtitle {
    margin-top: 4px;
    color: #64748b;
    font-size: 11px;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .meta {
    margin-top: 8px;
    color: #94a3b8;
    font-size: 9px;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-bottom: 18px;
  }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    padding: 11px;
    background: #f8fafc;
  }

  .card-label {
    color: #64748b;
    font-size: 9px;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .card-value {
    margin-top: 3px;
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .card-subtitle {
    color: #94a3b8;
    font-size: 8px;
    margin-top: 2px;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .section {
    margin-top: 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 5px;
    margin-bottom: 9px;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .summary {
    border-radius: 9px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 12px;
    color: #1e3a8a;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .rows {
    display: grid;
    gap: 5px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    border-bottom: 1px solid #f1f5f9;
    padding: 6px 0;
  }

  .row:last-child {
    border-bottom: 0;
  }

  .label {
    color: #64748b;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .value {
    font-weight: 700;
    color: #0f172a;
    direction: auto;
    unicode-bidi: plaintext;
  }

  .footer {
    margin-top: 22px;
    padding-top: 9px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 8px;
    text-align: center;
  }

  @media print {
    .section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <h1 class="title">${escapeHtml(title)}</h1>
    <div class="subtitle text-content" dir="auto">${escapeHtml(subtitle)}</div>
    <div class="meta text-content" dir="auto">
      ${escapeHtml(report?.generatedAt || '')}
    </div>
  </header>

  <div class="cards">
    ${cards.map((card) => `
      <div class="card">
        <div class="card-label text-content" dir="auto">${escapeHtml(card.label)}</div>
        <div class="card-value text-content" dir="auto">${escapeHtml(card.value)}</div>
        <div class="card-subtitle text-content" dir="auto">${escapeHtml(card.subtitle)}</div>
      </div>
    `).join('')}
  </div>

  ${sections.map((section) => `
    <section class="section">
      <div class="section-title text-content" dir="auto">${escapeHtml(section.title)}</div>
      ${section.summary ? `<div class="summary text-content" dir="auto">${escapeHtml(section.summary)}</div>` : ''}
      ${Array.isArray(section.rows) && section.rows.length ? `
        <div class="rows">
          ${section.rows.map((row) => `
            <div class="row">
              <span class="label text-content" dir="auto">${escapeHtml(row.label)}</span>
              <span class="value text-content" dir="auto">${escapeHtml(row.value)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `).join('')}

  <footer class="footer">
    Raily • ${escapeHtml(isFa ? 'گزارش تولیدشده از داده‌های برنامه' : 'Report generated from application data')}
  </footer>
</div>
</body>
</html>`
}

ipcMain.handle(
  'reports:pdf',
  async (
    _event,
    report,
  ) => {
    console.log(
      '[IPC] reports:pdf',
    )

    if (!mainWindow) {
      throw new Error(
        'Main window is not available.',
      )
    }

    const html =
      buildPdfHtml(
        report,
      )

    const pdfWindow =
      new BrowserWindow({
        show: false,

        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      })

    try {
      await pdfWindow.loadURL(
        `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`,
      )

      const pdfBuffer =
        await pdfWindow.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          margins: {
            marginType: 'default',
          },
        })

      const result =
        await dialog.showSaveDialog(
          mainWindow,
          {
            title:
              report?.language === 'en'
                ? 'Save Raily PDF report'
                : 'ذخیره گزارش PDF Raily',

            defaultPath:
              path.join(
                app.getPath('documents'),
                `Raily-Report-${Date.now()}.pdf`,
              ),

            filters: [
              {
                name: 'PDF',
                extensions: ['pdf'],
              },
            ],
          },
        )

      if (
        result.canceled ||
        !result.filePath
      ) {
        return {
          canceled: true,
        }
      }

      const fs =
        require('node:fs/promises')

      await fs.writeFile(
        result.filePath,
        pdfBuffer,
      )

      return {
        canceled: false,
        filePath:
          result.filePath,
      }
    } finally {
      if (!pdfWindow.isDestroyed()) {
        pdfWindow.close()
      }
    }
  },
)

/* -------------------------------------------------------------------------- */
/* Electron lifecycle                                                          */
/* -------------------------------------------------------------------------- */

app.whenReady().then(
  () => {
    getDatabase()

    if (getSettings()?.dateMode === 'server') {
      void syncIranServerTime()
    }

    const serverTimeSyncInterval = setInterval(() => {
      if (getSettings()?.dateMode === 'server') {
        void syncIranServerTime()
      }
    }, 5 * 60 * 1000)

    serverTimeSyncInterval.unref?.()

    createWindow()

    app.on(
      'activate',
      () => {
        if (
          BrowserWindow.getAllWindows()
            .length === 0
        ) {
          createWindow()
        }
      },
    )
  },
)

app.on(
  'window-all-closed',
  () => {
    if (
      process.platform !==
      'darwin'
    ) {
      app.quit()
    }
  },
)