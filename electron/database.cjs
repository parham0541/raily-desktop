const Database = require('better-sqlite3')
const {
  drizzle,
} = require('drizzle-orm/better-sqlite3')
const {
  migrate,
} = require('drizzle-orm/better-sqlite3/migrator')
const {
  eq,
  desc,
} = require('drizzle-orm')
const {
  integer,
  sqliteTable,
  text,
} = require('drizzle-orm/sqlite-core')
const {
  toGregorian,
} = require('jalaali-js')
const path = require('node:path')
const fs = require('node:fs')
const { performance } = require('node:perf_hooks')

/* -------------------------------------------------------------------------- */
/* Database Schema                                                             */
/* -------------------------------------------------------------------------- */

const users = sqliteTable(
  'users',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    name: text('name')
      .notNull(),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const settings = sqliteTable(
  'settings',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    theme: text('theme')
      .notNull()
      .default('system'),

    language: text('language')
      .notNull()
      .default('en'),

    dateMode: text('date_mode')
      .notNull()
      .default('system'),

    manualDate: text(
      'manual_date',
    ),

    manualTime: text(
      'manual_time',
    ),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const todos = sqliteTable(
  'todos',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    title: text('title')
      .notNull(),

    description: text(
      'description',
    ),

    completed: integer(
      'completed',
      {
        mode: 'boolean',
      },
    )
      .notNull()
      .default(false),

    priority: text('priority')
      .notNull()
      .default('medium'),

    dueDate: text(
      'due_date',
    ),

    dueTime: text(
      'due_time',
    ),

    completedAt: integer(
      'completed_at',
    ),

    status: text('status')
      .notNull()
      .default('pending'),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const goals = sqliteTable(
  'goals',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    title: text('title')
      .notNull(),

    description: text(
      'description',
    ),

    category: text('category')
      .notNull()
      .default('general'),

    progress: integer('progress')
      .notNull()
      .default(0),

    startDate: text(
      'start_date',
    ),

    targetDate: text(
      'target_date',
    ),

    status: text('status')
      .notNull()
      .default('active'),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const activities = sqliteTable(
  'activities',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    title: text('title')
      .notNull(),

    description: text(
      'description',
    ),

    category: text('category')
      .notNull()
      .default('general'),

    activityDate: text(
      'activity_date',
    ).notNull(),

    startTime: text(
      'start_time',
    ),

    endTime: text(
      'end_time',
    ),

    duration: integer(
      'duration',
    )
      .notNull()
      .default(0),

    completed: integer(
      'completed',
      {
        mode: 'boolean',
      },
    )
      .notNull()
      .default(false),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const sleepRecords = sqliteTable(
  'sleep_records',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    sleepDate: text(
      'sleep_date',
    ).notNull(),

    bedtime: text(
      'bedtime',
    ).notNull(),

    wakeTime: text(
      'wake_time',
    ).notNull(),

    duration: integer(
      'duration',
    ).notNull(),

    quality: integer(
      'quality',
    )
      .notNull()
      .default(3),

    note: text(
      'note',
    ),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const mindRecords = sqliteTable(
  'mind_records',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    checkInDate: text(
      'check_in_date',
    ).notNull(),

    mood: integer(
      'mood',
    ).notNull(),

    cried: integer(
      'cried',
      {
        mode: 'boolean',
      },
    ),

    sadness: integer(
      'sadness',
    ),

    anger: integer(
      'anger',
    ),

    anxiety: integer(
      'anxiety',
    ),

    energy: integer(
      'energy',
    ),

    sleepQuality: integer(
      'sleep_quality',
    ),

    happiness: integer(
      'happiness',
    ),

    selfCare: integer(
      'self_care',
    ),

    feelingSafe: integer(
      'feeling_safe',
      {
        mode: 'boolean',
      },
    ),

    bothering: text(
      'bothering',
    ),

    note: text(
      'note',
    ),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)


const events = sqliteTable(
  'events',
  {
    id: integer('id')
      .primaryKey({
        autoIncrement: true,
      }),

    title: text('title')
      .notNull(),

    description: text(
      'description',
    ),

    eventDate: text(
      'event_date',
    ).notNull(),

    startTime: text(
      'start_time',
    ),

    endTime: text(
      'end_time',
    ),

    allDay: integer(
      'all_day',
      {
        mode: 'boolean',
      },
    )
      .notNull()
      .default(false),

    location: text(
      'location',
    ),

    category: text('category')
      .notNull()
      .default('general'),

    reminderMinutes: integer(
      'reminder_minutes',
    ),

    color: text(
      'color',
    ),

    createdAt: integer(
      'created_at',
    ).notNull(),

    updatedAt: integer(
      'updated_at',
    ).notNull(),
  },
)

const schema = {
  users,
  settings,
  todos,
  goals,
  activities,
  sleepRecords,
  mindRecords,
  events,
}

/* -------------------------------------------------------------------------- */
/* Database                                                                    */
/* -------------------------------------------------------------------------- */

const dataDirectory =
  path.join(
    process.env.APPDATA ||
      path.join(
        process.env.HOME ||
          process.env.USERPROFILE ||
          '.',
        'AppData',
        'Roaming',
      ),
    'Raily',
  )

fs.mkdirSync(
  dataDirectory,
  {
    recursive: true,
  },
)

const databasePath =
  path.join(
    dataDirectory,
    'raily.db',
  )

const sqlite =
  new Database(
    databasePath,
  )

sqlite.pragma(
  'journal_mode = WAL',
)

const db =
  drizzle(sqlite)

migrate(
  db,
  {
    migrationsFolder:
      path.join(
        __dirname,
        '../drizzle',
      ),
  },
)

/*
 * Sleep records are created here as a small compatibility safeguard for
 * existing Raily installations. New databases will also have the table
 * available without requiring the user to delete the existing database.
 */
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sleep_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sleep_date TEXT NOT NULL,
    bedtime TEXT NOT NULL,
    wake_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    quality INTEGER NOT NULL DEFAULT 3,
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`)

function getDatabase() {
  return db
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

function getSettings() {
  return db
    .select()
    .from(schema.settings)
    .limit(1)
    .get() ?? null
}

function updateSettings(
  updates,
) {
  const current =
    getSettings()

  const now =
    Date.now()

  if (!current) {
    return db
      .insert(schema.settings)
      .values({
        theme:
          updates?.theme ??
          'system',

        language:
          updates?.language ??
          'en',

        dateMode:
          updates?.dateMode ??
          'system',

        manualDate:
          updates?.manualDate ??
          null,

        manualTime:
          updates?.manualTime ??
          null,

        createdAt:
          now,

        updatedAt:
          now,
      })
      .returning()
      .get()
  }

  return db
    .update(schema.settings)
    .set({
      ...updates,
      updatedAt:
        now,
    })
    .where(
      eq(
        schema.settings.id,
        current.id,
      ),
    )
    .returning()
    .get()
}

/* -------------------------------------------------------------------------- */
/* Raily Clock                                                                 */
/* -------------------------------------------------------------------------- */

// The main process updates this cache after receiving a trusted server timestamp.
// Keeping the local sync time lets the clock continue advancing between syncs.
let serverClock = null

function setServerTime(serverTimestamp) {
  if (
    typeof serverTimestamp !== 'number' ||
    !Number.isFinite(serverTimestamp)
  ) {
    throw new TypeError('Server timestamp must be a finite number.')
  }

  serverClock = {
    // Use a monotonic clock for elapsed time. Date.now() follows the PC's
    // wall clock, so changing the system clock would otherwise skew server time.
    timestamp: serverTimestamp,
    syncedAt: performance.now(),
  }

  return {
    success: true,
    timestamp: serverTimestamp,
  }
}

function getServerNow() {
  if (!serverClock) {
    return null
  }

  const elapsed = performance.now() - serverClock.syncedAt
  return new Date(serverClock.timestamp + Math.max(0, elapsed))
}

function getServerClockStatus() {
  if (!serverClock) {
    return {
      synced: false,
      timestamp: null,
      ageMs: null,
    }
  }

  const elapsed = Math.max(0, performance.now() - serverClock.syncedAt)

  return {
    synced: true,
    timestamp: serverClock.timestamp + elapsed,
    ageMs: Math.round(elapsed),
  }
}

function getSystemNow() {
  return new Date()
}

function parseJalaliDate(
  value,
) {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const match =
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(
      value,
    )

  if (!match) {
    return null
  }

  const jy =
    Number(match[1])

  const jm =
    Number(match[2])

  const jd =
    Number(match[3])

  if (
    jm < 1 ||
    jm > 12 ||
    jd < 1 ||
    jd > 31
  ) {
    return null
  }

  return {
    jy,
    jm,
    jd,
  }
}

function parseTime(
  value,
) {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const match =
    /^(\d{1,2}):(\d{2})$/.exec(
      value,
    )

  if (!match) {
    return null
  }

  const hours =
    Number(match[1])

  const minutes =
    Number(match[2])

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return {
    hours,
    minutes,
  }
}

function getEffectiveNow() {
  const settings =
    getSettings()

  if (!settings) {
    return getSystemNow()
  }

  if (
    settings.dateMode ===
    'system'
  ) {
    return getSystemNow()
  }

  if (settings.dateMode === 'server') {
    return getServerNow() ?? getSystemNow()
  }

  if (
    settings.dateMode ===
      'manual' &&
    settings.manualDate &&
    settings.manualTime
  ) {
    const jalaliDate =
      parseJalaliDate(
        settings.manualDate,
      )

    const time =
      parseTime(
        settings.manualTime,
      )

    if (
      jalaliDate &&
      time
    ) {
      try {
        const gregorian =
          toGregorian(
            jalaliDate.jy,
            jalaliDate.jm,
            jalaliDate.jd,
          )

        const baseDate =
          new Date(
            gregorian.gy,
            gregorian.gm - 1,
            gregorian.gd,
            time.hours,
            time.minutes,
            0,
            0,
          )

        const elapsed =
          Math.max(
            0,
            Date.now() -
              settings.updatedAt,
          )

        return new Date(
          baseDate.getTime() +
            elapsed,
        )
      } catch {
        return getSystemNow()
      }
    }
  }

  return getSystemNow()
}

/* -------------------------------------------------------------------------- */
/* Todo                                                                        */
/* -------------------------------------------------------------------------- */

function convertTodoDueDateToTimestamp(
  dueDate,
  dueTime,
) {
  if (!dueDate) {
    return null
  }

  const jalaliDate =
    parseJalaliDate(
      dueDate,
    )

  if (!jalaliDate) {
    return null
  }

  const time =
    parseTime(
      dueTime ?? '00:00',
    )

  if (!time) {
    return null
  }

  try {
    const gregorian =
      toGregorian(
        jalaliDate.jy,
        jalaliDate.jm,
        jalaliDate.jd,
      )

    return new Date(
      gregorian.gy,
      gregorian.gm - 1,
      gregorian.gd,
      time.hours,
      time.minutes,
      0,
      0,
    ).getTime()
  } catch {
    return null
  }
}

function syncTodoStatus() {
  const todoList =
    db
      .select()
      .from(schema.todos)
      .all()

  const now =
    getEffectiveNow().getTime()

  for (
    const todo of todoList
  ) {
    if (
      todo.completed
    ) {
      if (
        todo.status !==
        'completed'
      ) {
        db
          .update(schema.todos)
          .set({
            status:
              'completed',

            updatedAt:
              Date.now(),
          })
          .where(
            eq(
              schema.todos.id,
              todo.id,
            ),
          )
          .run()
      }

      continue
    }

    if (
      todo.status ===
      'overdue'
    ) {
      continue
    }

    const dueTimestamp =
      convertTodoDueDateToTimestamp(
        todo.dueDate,
        todo.dueTime,
      )

    if (
      dueTimestamp !==
        null &&
      dueTimestamp <
        now
    ) {
      db
        .update(schema.todos)
        .set({
          status:
            'overdue',

          updatedAt:
            Date.now(),
        })
        .where(
          eq(
            schema.todos.id,
            todo.id,
          ),
        )
        .run()
    }
  }
}

function getTodos() {
  syncTodoStatus()

  return db
    .select()
    .from(schema.todos)
    .orderBy(
      desc(
        schema.todos.createdAt,
      ),
    )
    .all()
}

function createTodo(
  todo,
) {
  const now =
    Date.now()

  const title =
    String(
      todo?.title ?? '',
    ).trim()

  if (!title) {
    throw new Error(
      'Todo title is required.',
    )
  }

  return db
    .insert(schema.todos)
    .values({
      title,

      description:
        todo?.description ??
        null,

      completed: false,

      priority:
        todo?.priority ??
        'medium',

      dueDate:
        todo?.dueDate ??
        null,

      dueTime:
        todo?.dueTime ??
        null,

      completedAt:
        null,

      status:
        'pending',

      createdAt:
        now,

      updatedAt:
        now,
    })
    .returning()
    .get()
}

function updateTodo(
  id,
  updates,
) {
  syncTodoStatus()

  const current =
    db
      .select()
      .from(schema.todos)
      .where(
        eq(
          schema.todos.id,
          id,
        ),
      )
      .get()

  if (!current) {
    throw new Error(
      'Todo not found.',
    )
  }

  if (
    current.status ===
    'overdue'
  ) {
    throw new Error(
      'This task is overdue and can no longer be edited.',
    )
  }

  const data = {
    updatedAt:
      Date.now(),
  }

  if (
    updates?.title !==
    undefined
  ) {
    const title =
      String(
        updates.title,
      ).trim()

    if (!title) {
      throw new Error(
        'Todo title is required.',
      )
    }

    data.title =
      title
  }

  if (
    updates?.description !==
    undefined
  ) {
    data.description =
      updates.description
  }

  if (
    updates?.priority !==
    undefined
  ) {
    data.priority =
      updates.priority
  }

  if (
    updates?.dueDate !==
    undefined
  ) {
    data.dueDate =
      updates.dueDate
  }

  if (
    updates?.dueTime !==
    undefined
  ) {
    data.dueTime =
      updates.dueTime
  }

  if (
    updates?.completed !==
    undefined
  ) {
    data.completed =
      Boolean(
        updates.completed,
      )

    if (
      data.completed
    ) {
      data.completedAt =
        Date.now()

      data.status =
        'completed'
    } else {
      data.completedAt =
        null

      data.status =
        'pending'
    }
  }

  return db
    .update(schema.todos)
    .set(data)
    .where(
      eq(
        schema.todos.id,
        id,
      ),
    )
    .returning()
    .get()
}

function deleteTodo(
  id,
) {
  const result =
    db
      .delete(schema.todos)
      .where(
        eq(
          schema.todos.id,
          id,
        ),
      )
      .run()

  if (
    result.changes === 0
  ) {
    throw new Error(
      'Todo not found.',
    )
  }

  return {
    success: true,
  }
}

/* -------------------------------------------------------------------------- */
/* Goals                                                                       */
/* -------------------------------------------------------------------------- */

function getGoals() {
  return db
    .select()
    .from(schema.goals)
    .orderBy(
      desc(
        schema.goals.createdAt,
      ),
    )
    .all()
}

function createGoal(
  goal,
) {
  const now =
    Date.now()

  const title =
    String(
      goal?.title ?? '',
    ).trim()

  if (!title) {
    throw new Error(
      'Goal title is required.',
    )
  }

  const numericProgress =
    Number(
      goal?.progress ?? 0,
    )

  const progress =
    Number.isFinite(
      numericProgress,
    )
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              numericProgress,
            ),
          ),
        )
      : 0

  return db
    .insert(schema.goals)
    .values({
      title,

      description:
        goal?.description ??
        null,

      category:
        goal?.category ??
        'general',

      progress,

      startDate:
        goal?.startDate ??
        null,

      targetDate:
        goal?.targetDate ??
        null,

      status:
        goal?.status ??
        'active',

      createdAt:
        now,

      updatedAt:
        now,
    })
    .returning()
    .get()
}

function updateGoal(
  id,
  updates,
) {
  const current =
    db
      .select()
      .from(schema.goals)
      .where(
        eq(
          schema.goals.id,
          id,
        ),
      )
      .get()

  if (!current) {
    throw new Error(
      'Goal not found.',
    )
  }

  const data = {
    updatedAt:
      Date.now(),
  }

  if (
    updates?.title !==
    undefined
  ) {
    const title =
      String(
        updates.title,
      ).trim()

    if (!title) {
      throw new Error(
        'Goal title is required.',
      )
    }

    data.title =
      title
  }

  if (
    updates?.description !==
    undefined
  ) {
    data.description =
      updates.description
  }

  if (
    updates?.category !==
    undefined
  ) {
    data.category =
      updates.category
  }

  if (
    updates?.progress !==
    undefined
  ) {
    const numericProgress =
      Number(
        updates.progress,
      )

    if (
      !Number.isFinite(
        numericProgress,
      )
    ) {
      throw new Error(
        'Goal progress must be a number.',
      )
    }

    data.progress =
      Math.min(
        100,
        Math.max(
          0,
          Math.round(
            numericProgress,
          ),
        ),
      )
  }

  if (
    updates?.startDate !==
    undefined
  ) {
    data.startDate =
      updates.startDate
  }

  if (
    updates?.targetDate !==
    undefined
  ) {
    data.targetDate =
      updates.targetDate
  }

  if (
    updates?.status !==
    undefined
  ) {
    data.status =
      updates.status
  }

  return db
    .update(schema.goals)
    .set(data)
    .where(
      eq(
        schema.goals.id,
        id,
      ),
    )
    .returning()
    .get()
}

function deleteGoal(
  id,
) {
  const result =
    db
      .delete(schema.goals)
      .where(
        eq(
          schema.goals.id,
          id,
        ),
      )
      .run()

  if (
    result.changes === 0
  ) {
    throw new Error(
      'Goal not found.',
    )
  }

  return {
    success: true,
  }
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                  */
/* -------------------------------------------------------------------------- */

function getActivities() {
  return db
    .select()
    .from(schema.activities)
    .orderBy(
      desc(
        schema.activities.createdAt,
      ),
    )
    .all()
}

function createActivity(
  activity,
) {
  const now =
    Date.now()

  const title =
    String(
      activity?.title ?? '',
    ).trim()

  if (!title) {
    throw new Error(
      'Activity title is required.',
    )
  }

  const activityDate =
    String(
      activity?.activityDate ?? '',
    ).trim()

  if (!activityDate) {
    throw new Error(
      'Activity date is required.',
    )
  }

  const duration =
    Number(
      activity?.duration ?? 0,
    )

  if (
    !Number.isFinite(
      duration,
    ) ||
    duration < 0
  ) {
    throw new Error(
      'Activity duration must be a valid positive number.',
    )
  }

  return db
    .insert(schema.activities)
    .values({
      title,

      description:
        activity?.description ??
        null,

      category:
        activity?.category ??
        'general',

      activityDate,

      startTime:
        activity?.startTime ??
        null,

      endTime:
        activity?.endTime ??
        null,

      duration:
        Math.round(
          duration,
        ),

      completed:
        Boolean(
          activity?.completed ??
            false,
        ),

      createdAt:
        now,

      updatedAt:
        now,
    })
    .returning()
    .get()
}

function updateActivity(
  id,
  updates,
) {
  const current =
    db
      .select()
      .from(schema.activities)
      .where(
        eq(
          schema.activities.id,
          id,
        ),
      )
      .get()

  if (!current) {
    throw new Error(
      'Activity not found.',
    )
  }

  const data = {
    updatedAt:
      Date.now(),
  }

  if (
    updates?.title !==
    undefined
  ) {
    const title =
      String(
        updates.title,
      ).trim()

    if (!title) {
      throw new Error(
        'Activity title is required.',
      )
    }

    data.title =
      title
  }

  if (
    updates?.description !==
    undefined
  ) {
    data.description =
      updates.description
  }

  if (
    updates?.category !==
    undefined
  ) {
    data.category =
      updates.category
  }

  if (
    updates?.activityDate !==
    undefined
  ) {
    const activityDate =
      String(
        updates.activityDate,
      ).trim()

    if (!activityDate) {
      throw new Error(
        'Activity date is required.',
      )
    }

    data.activityDate =
      activityDate
  }

  if (
    updates?.startTime !==
    undefined
  ) {
    data.startTime =
      updates.startTime
  }

  if (
    updates?.endTime !==
    undefined
  ) {
    data.endTime =
      updates.endTime
  }

  if (
    updates?.duration !==
    undefined
  ) {
    const duration =
      Number(
        updates.duration,
      )

    if (
      !Number.isFinite(
        duration,
      ) ||
      duration < 0
    ) {
      throw new Error(
        'Activity duration must be a valid positive number.',
      )
    }

    data.duration =
      Math.round(
        duration,
      )
  }

  if (
    updates?.completed !==
    undefined
  ) {
    data.completed =
      Boolean(
        updates.completed,
      )
  }

  return db
    .update(schema.activities)
    .set(data)
    .where(
      eq(
        schema.activities.id,
        id,
      ),
    )
    .returning()
    .get()
}

function deleteActivity(
  id,
) {
  const result =
    db
      .delete(schema.activities)
      .where(
        eq(
          schema.activities.id,
          id,
        ),
      )
      .run()

  if (
    result.changes === 0
  ) {
    throw new Error(
      'Activity not found.',
    )
  }

  return {
    success: true,
  }
}


/* -------------------------------------------------------------------------- */
/* Sleep / Rest                                                               */
/* -------------------------------------------------------------------------- */

function validateSleepTime(
  value,
  fieldName,
) {
  const time =
    String(
      value ?? '',
    ).trim()

  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      time,
    )
  ) {
    throw new Error(
      `${fieldName} must be a valid time in HH:mm format.`,
    )
  }

  return time
}

function calculateSleepDuration(
  bedtime,
  wakeTime,
) {
  const start =
    Number(
      bedtime.slice(0, 2),
    ) *
      60 +
    Number(
      bedtime.slice(3, 5),
    )

  const end =
    Number(
      wakeTime.slice(0, 2),
    ) *
      60 +
    Number(
      wakeTime.slice(3, 5),
    )

  let duration =
    end - start

  if (
    duration <= 0
  ) {
    duration += 24 * 60
  }

  return duration
}

function validateSleepQuality(
  quality,
) {
  const value =
    Number(
      quality ?? 3,
    )

  if (
    !Number.isInteger(
      value,
    ) ||
    value < 1 ||
    value > 5
  ) {
    throw new Error(
      'Sleep quality must be an integer between 1 and 5.',
    )
  }

  return value
}

function getSleepRecords() {
  return db
    .select()
    .from(
      schema.sleepRecords,
    )
    .orderBy(
      desc(
        schema.sleepRecords.sleepDate,
      ),
      desc(
        schema.sleepRecords.createdAt,
      ),
    )
    .all()
}

function createSleepRecord(
  sleep,
) {
  const now =
    Date.now()

  const sleepDate =
    String(
      sleep?.sleepDate ?? '',
    ).trim()

  if (!sleepDate) {
    throw new Error(
      'Sleep date is required.',
    )
  }

  const bedtime =
    validateSleepTime(
      sleep?.bedtime,
      'Bedtime',
    )

  const wakeTime =
    validateSleepTime(
      sleep?.wakeTime,
      'Wake time',
    )

  const duration =
    calculateSleepDuration(
      bedtime,
      wakeTime,
    )

  const quality =
    validateSleepQuality(
      sleep?.quality,
    )

  return db
    .insert(
      schema.sleepRecords,
    )
    .values({
      sleepDate,
      bedtime,
      wakeTime,
      duration,
      quality,
      note:
        sleep?.note ??
        null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()
}

function updateSleepRecord(
  id,
  updates,
) {
  const current =
    db
      .select()
      .from(
        schema.sleepRecords,
      )
      .where(
        eq(
          schema.sleepRecords.id,
          id,
        ),
      )
      .get()

  if (!current) {
    throw new Error(
      'Sleep record not found.',
    )
  }

  const data = {
    updatedAt:
      Date.now(),
  }

  const bedtime =
    updates?.bedtime !==
    undefined
      ? validateSleepTime(
          updates.bedtime,
          'Bedtime',
        )
      : current.bedtime

  const wakeTime =
    updates?.wakeTime !==
    undefined
      ? validateSleepTime(
          updates.wakeTime,
          'Wake time',
        )
      : current.wakeTime

  if (
    updates?.sleepDate !==
    undefined
  ) {
    const sleepDate =
      String(
        updates.sleepDate,
      ).trim()

    if (!sleepDate) {
      throw new Error(
        'Sleep date is required.',
      )
    }

    data.sleepDate =
      sleepDate
  }

  if (
    updates?.bedtime !==
    undefined
  ) {
    data.bedtime =
      bedtime
  }

  if (
    updates?.wakeTime !==
    undefined
  ) {
    data.wakeTime =
      wakeTime
  }

  if (
    updates?.bedtime !==
      undefined ||
    updates?.wakeTime !==
      undefined
  ) {
    data.duration =
      calculateSleepDuration(
        bedtime,
        wakeTime,
      )
  }

  if (
    updates?.quality !==
    undefined
  ) {
    data.quality =
      validateSleepQuality(
        updates.quality,
      )
  }

  if (
    updates?.note !==
    undefined
  ) {
    data.note =
      updates.note
  }

  return db
    .update(
      schema.sleepRecords,
    )
    .set(data)
    .where(
      eq(
        schema.sleepRecords.id,
        id,
      ),
    )
    .returning()
    .get()
}

function deleteSleepRecord(
  id,
) {
  const result =
    db
      .delete(
        schema.sleepRecords,
      )
      .where(
        eq(
          schema.sleepRecords.id,
          id,
        ),
      )
      .run()

  if (
    result.changes === 0
  ) {
    throw new Error(
      'Sleep record not found.',
    )
  }

  return {
    success: true,
  }
}


/* -------------------------------------------------------------------------- */
/* Mind / Mood                                                                */
/* -------------------------------------------------------------------------- */

function validateMindValue(
  value,
  fieldName,
) {
  const number =
    Number(
      value,
    )

  if (
    !Number.isInteger(
      number,
    ) ||
    number < 1 ||
    number > 5
  ) {
    throw new Error(
      `${fieldName} must be an integer between 1 and 5.`,
    )
  }

  return number
}

function validateMindOptionalValue(
  value,
  fieldName,
) {
  if (
    value ===
    undefined ||
    value ===
    null
  ) {
    return null
  }

  return validateMindValue(
    value,
    fieldName,
  )
}

function getMindRecords() {
  return db
    .select()
    .from(
      schema.mindRecords,
    )
    .orderBy(
      desc(
        schema.mindRecords.checkInDate,
      ),
      desc(
        schema.mindRecords.createdAt,
      ),
    )
    .all()
}

function createMindRecord(
  mind,
) {
  const now =
    Date.now()

  const checkInDate =
    String(
      mind?.checkInDate ??
        '',
    ).trim()

  if (
    !checkInDate
  ) {
    throw new Error(
      'Check-in date is required.',
    )
  }

  return db
    .insert(
      schema.mindRecords,
    )
    .values({
      checkInDate,

      mood:
        validateMindValue(
          mind?.mood,
          'Mood',
        ),

      cried:
        mind?.cried ===
        undefined ||
        mind?.cried ===
        null
          ? null
          : Boolean(
              mind.cried,
            ),

      sadness:
        validateMindOptionalValue(
          mind?.sadness,
          'Sadness',
        ),

      anger:
        validateMindOptionalValue(
          mind?.anger,
          'Anger',
        ),

      anxiety:
        validateMindOptionalValue(
          mind?.anxiety,
          'Anxiety',
        ),

      energy:
        validateMindOptionalValue(
          mind?.energy,
          'Energy',
        ),

      sleepQuality:
        validateMindOptionalValue(
          mind?.sleepQuality,
          'Sleep quality',
        ),

      happiness:
        validateMindOptionalValue(
          mind?.happiness,
          'Happiness',
        ),

      selfCare:
        validateMindOptionalValue(
          mind?.selfCare,
          'Self-care',
        ),

      feelingSafe:
        mind?.feelingSafe ===
        undefined ||
        mind?.feelingSafe ===
        null
          ? null
          : Boolean(
              mind.feelingSafe,
            ),

      bothering:
        mind?.bothering ??
        null,

      note:
        mind?.note ??
        null,

      createdAt:
        now,

      updatedAt:
        now,
    })
    .returning()
    .get()
}

function updateMindRecord(
  id,
  updates,
) {
  const current =
    db
      .select()
      .from(
        schema.mindRecords,
      )
      .where(
        eq(
          schema.mindRecords.id,
          id,
        ),
      )
      .get()

  if (!current) {
    throw new Error(
      'Mind record not found.',
    )
  }

  const data = {
    updatedAt:
      Date.now(),
  }

  if (
    updates?.checkInDate !==
    undefined
  ) {
    const checkInDate =
      String(
        updates.checkInDate,
      ).trim()

    if (
      !checkInDate
    ) {
      throw new Error(
        'Check-in date is required.',
      )
    }

    data.checkInDate =
      checkInDate
  }

  if (
    updates?.mood !==
    undefined
  ) {
    data.mood =
      validateMindValue(
        updates.mood,
        'Mood',
      )
  }

  if (
    updates?.cried !==
    undefined
  ) {
    data.cried =
      updates.cried ===
        null
        ? null
        : Boolean(
            updates.cried,
          )
  }

  if (
    updates?.sadness !==
    undefined
  ) {
    data.sadness =
      validateMindOptionalValue(
        updates.sadness,
        'Sadness',
      )
  }

  if (
    updates?.anger !==
    undefined
  ) {
    data.anger =
      validateMindOptionalValue(
        updates.anger,
        'Anger',
      )
  }

  if (
    updates?.anxiety !==
    undefined
  ) {
    data.anxiety =
      validateMindOptionalValue(
        updates.anxiety,
        'Anxiety',
      )
  }

  if (
    updates?.energy !==
    undefined
  ) {
    data.energy =
      validateMindOptionalValue(
        updates.energy,
        'Energy',
      )
  }

  if (
    updates?.sleepQuality !==
    undefined
  ) {
    data.sleepQuality =
      validateMindOptionalValue(
        updates.sleepQuality,
        'Sleep quality',
      )
  }

  if (
    updates?.happiness !==
    undefined
  ) {
    data.happiness =
      validateMindOptionalValue(
        updates.happiness,
        'Happiness',
      )
  }

  if (
    updates?.selfCare !==
    undefined
  ) {
    data.selfCare =
      validateMindOptionalValue(
        updates.selfCare,
        'Self-care',
      )
  }

  if (
    updates?.feelingSafe !==
    undefined
  ) {
    data.feelingSafe =
      updates.feelingSafe ===
        null
        ? null
        : Boolean(
            updates.feelingSafe,
          )
  }

  if (
    updates?.bothering !==
    undefined
  ) {
    data.bothering =
      updates.bothering
  }

  if (
    updates?.note !==
    undefined
  ) {
    data.note =
      updates.note
  }

  return db
    .update(
      schema.mindRecords,
    )
    .set(data)
    .where(
      eq(
        schema.mindRecords.id,
        id,
      ),
    )
    .returning()
    .get()
}

function deleteMindRecord(
  id,
) {
  const result =
    db
      .delete(
        schema.mindRecords,
      )
      .where(
        eq(
          schema.mindRecords.id,
          id,
        ),
      )
      .run()

  if (
    result.changes ===
    0
  ) {
    throw new Error(
      'Mind record not found.',
    )
  }

  return {
    success: true,
  }
}




/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

function validateEventDate(value) {
  const eventDate =
    String(
      value ??
        '',
    ).trim()

  if (!eventDate) {
    throw new Error(
      'Event date is required.',
    )
  }

  return eventDate
}

function validateEventTitle(value) {
  const title =
    String(
      value ??
        '',
    ).trim()

  if (!title) {
    throw new Error(
      'Event title is required.',
    )
  }

  return title
}

function validateEventTime(value, fieldName) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return null
  }

  const time =
    String(
      value,
    ).trim()

  return time || null
}

function validateEventReminder(value) {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ''
  ) {
    return null
  }

  const reminder =
    Number(
      value,
    )

  if (
    !Number.isInteger(
      reminder,
    ) ||
    reminder < 0
  ) {
    throw new Error(
      'Reminder minutes must be a non-negative integer.',
    )
  }

  return reminder
}

function getEvents() {
  return db
    .select()
    .from(
      schema.events,
    )
    .orderBy(
      desc(
        schema.events.eventDate,
      ),
      desc(
        schema.events.createdAt,
      ),
    )
    .all()
}

function createEvent(
  event,
) {
  const now =
    Date.now()

  return db
    .insert(
      schema.events,
    )
    .values({
      title:
        validateEventTitle(
          event?.title,
        ),

      description:
        event?.description ??
        null,

      eventDate:
        validateEventDate(
          event?.eventDate,
        ),

      startTime:
        validateEventTime(
          event?.startTime,
          'Start time',
        ),

      endTime:
        validateEventTime(
          event?.endTime,
          'End time',
        ),

      allDay:
        event?.allDay ===
          undefined ||
        event?.allDay ===
          null
          ? false
          : Boolean(
              event.allDay,
            ),

      location:
        event?.location ??
        null,

      category:
        String(
          event?.category ??
            'general',
        ).trim() ||
        'general',

      reminderMinutes:
        validateEventReminder(
          event?.reminderMinutes,
        ),

      color:
        event?.color ??
        null,

      createdAt:
        now,

      updatedAt:
        now,
    })
    .returning()
    .get()
}

function updateEvent(
  id,
  updates,
) {
  const current =
    db
      .select()
      .from(
        schema.events,
      )
      .where(
        eq(
          schema.events.id,
          id,
        ),
      )
      .get()

  if (!current) {
    throw new Error(
      'Event not found.',
    )
  }

  const data = {
    updatedAt:
      Date.now(),
  }

  if (
    updates?.title !==
    undefined
  ) {
    data.title =
      validateEventTitle(
        updates.title,
      )
  }

  if (
    updates?.description !==
    undefined
  ) {
    data.description =
      updates.description
  }

  if (
    updates?.eventDate !==
    undefined
  ) {
    data.eventDate =
      validateEventDate(
        updates.eventDate,
      )
  }

  if (
    updates?.startTime !==
    undefined
  ) {
    data.startTime =
      validateEventTime(
        updates.startTime,
        'Start time',
      )
  }

  if (
    updates?.endTime !==
    undefined
  ) {
    data.endTime =
      validateEventTime(
        updates.endTime,
        'End time',
      )
  }

  if (
    updates?.allDay !==
    undefined
  ) {
    data.allDay =
      updates.allDay ===
        null
        ? false
        : Boolean(
            updates.allDay,
          )
  }

  if (
    updates?.location !==
    undefined
  ) {
    data.location =
      updates.location
  }

  if (
    updates?.category !==
    undefined
  ) {
    data.category =
      String(
        updates.category ??
          '',
      ).trim() ||
      'general'
  }

  if (
    updates?.reminderMinutes !==
    undefined
  ) {
    data.reminderMinutes =
      validateEventReminder(
        updates.reminderMinutes,
      )
  }

  if (
    updates?.color !==
    undefined
  ) {
    data.color =
      updates.color
  }

  return db
    .update(
      schema.events,
    )
    .set(data)
    .where(
      eq(
        schema.events.id,
        id,
      ),
    )
    .returning()
    .get()
}

function deleteEvent(
  id,
) {
  const result =
    db
      .delete(
        schema.events,
      )
      .where(
        eq(
          schema.events.id,
          id,
        ),
      )
      .run()

  if (
    result.changes ===
    0
  ) {
    throw new Error(
      'Event not found.',
    )
  }

  return {
    success: true,
  }
}


/* -------------------------------------------------------------------------- */
/* Exports                                                                     */
/* -------------------------------------------------------------------------- */

module.exports = {
  getDatabase,

  getSettings,
  updateSettings,

  setServerTime,
  getServerNow,
  getServerClockStatus,
  getEffectiveNow,

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
}