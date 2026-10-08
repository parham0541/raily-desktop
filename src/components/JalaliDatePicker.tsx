import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'
import {
  toGregorian,
  toJalaali,
} from 'jalaali-js'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type JalaliDatePickerProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

const monthNames = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const weekDays = [
  'ش',
  'ی',
  'د',
  'س',
  'چ',
  'پ',
  'ج',
]

function pad(value: number) {
  return String(value).padStart(
    2,
    '0',
  )
}

function formatDate(
  year: number,
  month: number,
  day: number,
) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function parseDate(
  value: string,
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    )

  if (!match) {
    return null
  }

  const year =
    Number(match[1])

  const month =
    Number(match[2])

  const day =
    Number(match[3])

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day >
      getMonthLength(
        year,
        month,
      )
  ) {
    return null
  }

  return {
    year,
    month,
    day,
  }
}

function getMonthLength(
  year: number,
  month: number,
) {
  if (month <= 6) {
    return 31
  }

  if (month <= 11) {
    return 30
  }

  return isJalaliLeapYear(year)
    ? 30
    : 29
}

function isJalaliLeapYear(
  year: number,
) {
  const gregorian =
    toGregorian(
      year,
      12,
      29,
    )

  const nextJalali =
    toJalaali(
      gregorian.gy,
      gregorian.gm,
      gregorian.gd + 1,
    )

  return (
    nextJalali.jy !== year
  )
}

function getToday() {
  const now =
    new Date()

  return toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  )
}

export default function JalaliDatePicker({
  value,
  onChange,
  label = 'تاریخ',
  placeholder = 'انتخاب تاریخ',
  disabled = false,
}: JalaliDatePickerProps) {
  const parsedValue =
    parseDate(value)

  const today =
    getToday()

  const initialYear =
    parsedValue?.year ??
    today.jy

  const initialMonth =
    parsedValue?.month ??
    today.jm

  const [year, setYear] =
    useState(initialYear)

  const [month, setMonth] =
    useState(initialMonth)

  const [open, setOpen] =
    useState(false)

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const calendarRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const [calendarPosition, setCalendarPosition] =
    useState({
      top: 0,
      left: 0,
      width: 320,
      visible: false,
    })

  function updateCalendarPosition() {
    if (!open || !wrapperRef.current) {
      return
    }

    const trigger =
      wrapperRef.current.querySelector<HTMLButtonElement>(
        '[data-jalali-trigger]',
      )

    if (!trigger) {
      return
    }

    const rect =
      trigger.getBoundingClientRect()

    const viewportPadding = 12
    const calendarWidth = Math.min(
      340,
      Math.max(
        280,
        window.innerWidth -
          viewportPadding * 2,
      ),
    )

    const calendarHeight =
      calendarRef.current?.getBoundingClientRect()
        .height ?? 380

    let left =
      rect.right - calendarWidth

    left = Math.max(
      viewportPadding,
      Math.min(
        left,
        window.innerWidth -
          calendarWidth -
          viewportPadding,
      ),
    )

    const spaceBelow =
      window.innerHeight -
      rect.bottom -
      viewportPadding

    const spaceAbove =
      rect.top -
      viewportPadding

    let top: number

    if (
      spaceBelow >= calendarHeight + 8 ||
      spaceBelow >= spaceAbove
    ) {
      top =
        rect.bottom + 8
    } else {
      top =
        rect.top -
        calendarHeight -
        8
    }

    top = Math.max(
      viewportPadding,
      Math.min(
        top,
        window.innerHeight -
          calendarHeight -
          viewportPadding,
      ),
    )

    setCalendarPosition({
      top,
      left,
      width: calendarWidth,
      visible: true,
    })
  }

  useEffect(() => {
    if (!open) {
      setCalendarPosition((current) => ({
        ...current,
        visible: false,
      }))
      return
    }

    updateCalendarPosition()

    const frame =
      window.requestAnimationFrame(() => {
        updateCalendarPosition()
      })

    function handleViewportChange() {
      updateCalendarPosition()
    }

    function handleOutsideClick(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node

      const clickedTrigger =
        wrapperRef.current?.contains(
          target,
        )

      const clickedCalendar =
        calendarRef.current?.contains(
          target,
        )

      if (
        !clickedTrigger &&
        !clickedCalendar
      ) {
        setOpen(false)
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener(
      'resize',
      handleViewportChange,
    )

    window.addEventListener(
      'scroll',
      handleViewportChange,
      true,
    )

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      window.cancelAnimationFrame(frame)

      window.removeEventListener(
        'resize',
        handleViewportChange,
      )

      window.removeEventListener(
        'scroll',
        handleViewportChange,
        true,
      )

      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )

      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [open, year, month])

  useEffect(() => {
    if (!parsedValue) {
      return
    }

    setYear(
      parsedValue.year,
    )

    setMonth(
      parsedValue.month,
    )
  }, [
    value,
  ])

  const calendarDays =
    useMemo(() => {
      const firstDay =
        toGregorian(
          year,
          month,
          1,
        )

      const firstDate =
        new Date(
          firstDay.gy,
          firstDay.gm - 1,
          firstDay.gd,
        )

      /*
        JavaScript:
        Sunday = 0
        Saturday = 6

        تقویم شمسی ما:
        شنبه = 0
        یکشنبه = 1
        ...
        جمعه = 6
      */
      const startOffset =
        (firstDate.getDay() + 1) %
        7

      const days =
        getMonthLength(
          year,
          month,
        )

      const result: Array<
        number | null
      > = []

      for (
        let index = 0;
        index < startOffset;
        index += 1
      ) {
        result.push(null)
      }

      for (
        let day = 1;
        day <= days;
        day += 1
      ) {
        result.push(day)
      }

      return result
    }, [
      year,
      month,
    ])

  function previousMonth() {
    if (month === 1) {
      setMonth(12)
      setYear(
        (current) =>
          current - 1,
      )
      return
    }

    setMonth(
      (current) =>
        current - 1,
    )
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1)
      setYear(
        (current) =>
          current + 1,
      )
      return
    }

    setMonth(
      (current) =>
        current + 1,
    )
  }

  function selectDay(
    day: number,
  ) {
    onChange(
      formatDate(
        year,
        month,
        day,
      ),
    )

    setOpen(false)
  }

  function selectToday() {
    onChange(
      formatDate(
        today.jy,
        today.jm,
        today.jd,
      ),
    )

    setYear(today.jy)
    setMonth(today.jm)
    setOpen(false)
  }

  const displayValue =
    parsedValue
      ? `${parsedValue.year}/${pad(
          parsedValue.month,
        )}/${pad(
          parsedValue.day,
        )}`
      : ''

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      dir="rtl"
    >
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        data-jalali-trigger="true"
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-right text-sm text-slate-700 transition hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <span
          className={
            displayValue
              ? ''
              : 'text-slate-400 dark:text-slate-500'
          }
        >
          {displayValue ||
            placeholder}
        </span>

        <CalendarDays
          size={18}
          className="text-slate-400"
        />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={calendarRef}
            dir="rtl"
            style={{
              position: 'fixed',
              top: calendarPosition.top,
              left: calendarPosition.left,
              width: calendarPosition.width,
              zIndex: 9999,
              visibility: calendarPosition.visible
                ? 'visible'
                : 'hidden',
            }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15 animate-in fade-in-0 zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-950"
          >
            <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={
                previousMonth
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="ماه قبل"
            >
              <ChevronRight
                size={18}
              />
            </button>

            <div className="text-center">
              <div className="font-semibold text-slate-900 dark:text-white">
                {monthNames[
                  month - 1
                ]}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                {year}
              </div>
            </div>

            <button
              type="button"
              onClick={
                nextMonth
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="ماه بعد"
            >
              <ChevronLeft
                size={18}
              />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
            {weekDays.map(
              (day) => (
                <div
                  key={day}
                  className="py-2"
                >
                  {day}
                </div>
              ),
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(
              (
                day,
                index,
              ) => {
                if (
                  day === null
                ) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-9"
                    />
                  )
                }

                const selected =
                  parsedValue?.year ===
                    year &&
                  parsedValue?.month ===
                    month &&
                  parsedValue?.day ===
                    day

                const isToday =
                  today.jy ===
                    year &&
                  today.jm ===
                    month &&
                  today.jd ===
                    day

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      selectDay(
                        day,
                      )
                    }
                    className={[
                      'h-9 rounded-lg text-sm transition',
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-800',
                      isToday &&
                      !selected
                        ? 'font-bold ring-1 ring-blue-400'
                        : '',
                    ].join(
                      ' ',
                    )}
                  >
                    {day}
                  </button>
                )
              },
            )}
          </div>

            <button
              type="button"
              onClick={
                selectToday
              }
              className="mt-4 w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              امروز
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}