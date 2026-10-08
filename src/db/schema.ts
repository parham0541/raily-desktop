import {
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
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

export const settings = sqliteTable(
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

export const todos = sqliteTable(
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

export const goals = sqliteTable(
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

    startTime: text(
      'start_time',
    ),

    targetDate: text(
      'target_date',
    ),

    targetTime: text(
      'target_time',
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

export const activities = sqliteTable(
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

export const sleepRecords = sqliteTable(
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

export const mindRecords = sqliteTable(
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

export const events = sqliteTable(
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
