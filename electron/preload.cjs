
'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * Raily preload API
 * IPC channel names must match electron/main.cjs.
 */

const invoke = (channel, ...args) =>
  ipcRenderer.invoke(channel, ...args)

const createCrudApi = (resource) => ({
  get: () => invoke(`${resource}:get`),

  create: (record) =>
    invoke(`${resource}:create`, record),

  update: (id, updates) =>
    invoke(`${resource}:update`, id, updates),

  delete: (id) =>
    invoke(`${resource}:delete`, id),
})

const railyAPI = {
  settings: {
    get: () => invoke('settings:get'),

    update: (settings) =>
      invoke('settings:update', settings),
  },

  clock: {
    get: () => invoke('clock:get'),
    sync: () => invoke('clock:sync'),
  },

  todos: createCrudApi('todos'),
  goals: createCrudApi('goals'),
  sleep: createCrudApi('sleep'),
  mind: createCrudApi('mind'),
  events: createCrudApi('events'),
  activities: createCrudApi('activities'),

  reports: {
    createPdf: (report) =>
      invoke('reports:pdf', report),
  },
}

contextBridge.exposeInMainWorld('raily', railyAPI)
