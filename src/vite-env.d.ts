interface RailySettings {
  id: number
  theme: string
  language: 'en' | 'fa'
  dateMode: string
  manualDate: string | null
  manualTime: string | null
  createdAt: number
  updatedAt: number
}

interface RailyTodo {
  id: number
  title: string
  description: string | null
  completed: boolean
  priority:
    | 'low'
    | 'medium'
    | 'high'
  dueDate: string | null
  dueTime: string | null
  completedAt: number | null
  status:
    | 'pending'
    | 'completed'
    | 'overdue'
  createdAt: number
  updatedAt: number
}

interface CreateTodoInput {
  title: string
  description?: string | null
  priority?:
    | 'low'
    | 'medium'
    | 'high'
  dueDate?: string | null
  dueTime?: string | null
}

interface UpdateTodoInput {
  title?: string
  description?: string | null
  completed?: boolean
  priority?:
    | 'low'
    | 'medium'
    | 'high'
  dueDate?: string | null
  dueTime?: string | null
}

interface RailyClock {
  timestamp: number
  iso: string
  dateMode: string
}

interface RailyGoal {
  id: number
  title: string
  description: string | null
  category: string
  progress: number

  startDate: string | null
  startTime: string | null

  targetDate: string | null
  targetTime: string | null

  status:
    | 'active'
    | 'completed'
    | 'cancelled'

  createdAt: number
  updatedAt: number
}

interface CreateGoalInput {
  title: string
  description?: string | null
  category?: string
  progress?: number

  startDate?: string | null
  startTime?: string | null

  targetDate?: string | null
  targetTime?: string | null

  status?:
    | 'active'
    | 'completed'
    | 'cancelled'
}

interface UpdateGoalInput {
  title?: string
  description?: string | null
  category?: string
  progress?: number

  startDate?: string | null
  startTime?: string | null

  targetDate?: string | null
  targetTime?: string | null

  status?:
    | 'active'
    | 'completed'
    | 'cancelled'
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                  */
/* -------------------------------------------------------------------------- */

interface RailyActivity {
  id: number

  title: string

  description: string | null

  category: string

  activityDate: string

  startTime: string | null

  endTime: string | null

  duration: number

  completed: boolean

  createdAt: number

  updatedAt: number
}

interface CreateActivityInput {
  title: string

  description?: string | null

  category?: string

  activityDate: string

  startTime?: string | null

  endTime?: string | null

  duration?: number

  completed?: boolean
}

interface UpdateActivityInput {
  title?: string

  description?: string | null

  category?: string

  activityDate?: string

  startTime?: string | null

  endTime?: string | null

  duration?: number

  completed?: boolean
}


/* -------------------------------------------------------------------------- */
/* Mind                                                                         */
/* -------------------------------------------------------------------------- */

interface RailyMindRecord {
  id: number
  checkInDate: string
  mood: number
  cried: boolean | null
  sadness: number | null
  anger: number | null
  anxiety: number | null
  energy: number | null
  sleepQuality: number | null
  happiness: number | null
  selfCare: number | null
  feelingSafe: boolean | null
  bothering: string | null
  note: string | null
  createdAt: number
  updatedAt: number
}

interface CreateMindRecordInput {
  checkInDate: string
  mood: number
  cried?: boolean | null
  sadness?: number | null
  anger?: number | null
  anxiety?: number | null
  energy?: number | null
  sleepQuality?: number | null
  happiness?: number | null
  selfCare?: number | null
  feelingSafe?: boolean | null
  bothering?: string | null
  note?: string | null
}

interface UpdateMindRecordInput {
  checkInDate?: string
  mood?: number
  cried?: boolean | null
  sadness?: number | null
  anger?: number | null
  anxiety?: number | null
  energy?: number | null
  sleepQuality?: number | null
  happiness?: number | null
  selfCare?: number | null
  feelingSafe?: boolean | null
  bothering?: string | null
  note?: string | null
}


/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

interface RailyEvent {
  id: number
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location: string | null
  category: string
  reminderMinutes: number | null
  color: string | null
  createdAt: number
  updatedAt: number
}

interface CreateEventInput {
  title: string
  description?: string | null
  eventDate: string
  startTime?: string | null
  endTime?: string | null
  allDay?: boolean
  location?: string | null
  category?: string
  reminderMinutes?: number | null
  color?: string | null
}

interface UpdateEventInput {
  title?: string
  description?: string | null
  eventDate?: string
  startTime?: string | null
  endTime?: string | null
  allDay?: boolean
  location?: string | null
  category?: string
  reminderMinutes?: number | null
  color?: string | null
}

/* -------------------------------------------------------------------------- */
/* Raily API                                                                   */
/* -------------------------------------------------------------------------- */

interface RailyAPI {
  settings: {
    get: () =>
      Promise<RailySettings | null>

    update: (
      settings: Partial<RailySettings>,
    ) =>
      Promise<RailySettings>
  }

  clock: {
    get: () =>
      Promise<RailyClock>
  }

  todos: {
    get: () =>
      Promise<RailyTodo[]>

    create: (
      todo: CreateTodoInput,
    ) =>
      Promise<RailyTodo>

    update: (
      id: number,
      updates: UpdateTodoInput,
    ) =>
      Promise<RailyTodo>

    delete: (
      id: number,
    ) =>
      Promise<{
        success: boolean
      }>
  }

  goals: {
    get: () =>
      Promise<RailyGoal[]>

    create: (
      goal: CreateGoalInput,
    ) =>
      Promise<RailyGoal>

    update: (
      id: number,
      updates: UpdateGoalInput,
    ) =>
      Promise<RailyGoal>

    delete: (
      id: number,
    ) =>
      Promise<{
        success: boolean
      }>
  }

  activities: {
    get: () =>
      Promise<RailyActivity[]>

    create: (
      activity: CreateActivityInput,
    ) =>
      Promise<RailyActivity>

    update: (
      id: number,
      updates: UpdateActivityInput,
    ) =>
      Promise<RailyActivity>

    delete: (
      id: number,
    ) =>
      Promise<{
        success: boolean
      }>
  }


  events: {
    get: () =>
      Promise<RailyEvent[]>

    create: (
      event: CreateEventInput,
    ) =>
      Promise<RailyEvent>

    update: (
      id: number,
      updates: UpdateEventInput,
    ) =>
      Promise<RailyEvent>

    delete: (
      id: number,
    ) =>
      Promise<{
        success: boolean
      }>
  }

  mind: {
    get: () =>
      Promise<RailyMindRecord[]>

    create: (
      mind: CreateMindRecordInput,
    ) =>
      Promise<RailyMindRecord>

    update: (
      id: number,
      updates: UpdateMindRecordInput,
    ) =>
      Promise<RailyMindRecord>

    delete: (
      id: number,
    ) =>
      Promise<{
        success: boolean
      }>
  }
}

interface Window {
  raily: RailyAPI
}