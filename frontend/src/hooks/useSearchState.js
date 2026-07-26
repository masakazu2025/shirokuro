import { useCallback, useState } from 'react'

const PIN_STORAGE_KEY = 'shirokuro:searchDetailPinned'
const TERMINALS_STORAGE_KEY = 'shirokuro:selectedTerminals'
const TODAY_CHECKED_STORAGE_KEY = 'shirokuro:todayChecked'
const DATE_STORAGE_KEY = 'shirokuro:date'

function todayDateString() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function readPinnedPreference() {
  return localStorage.getItem(PIN_STORAGE_KEY) === 'true'
}

function readSavedTerminals() {
  const saved = localStorage.getItem(TERMINALS_STORAGE_KEY)
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readTodayChecked() {
  const saved = localStorage.getItem(TODAY_CHECKED_STORAGE_KEY)
  // 未保存(初回)はデフォルトでON扱い
  return saved === null ? true : saved === 'true'
}

function readInitialDate() {
  // 当日チェックがONなら、保存されていた日付は使わず必ず現在の日付を計算し直す
  if (readTodayChecked()) return todayDateString()
  return localStorage.getItem(DATE_STORAGE_KEY) || todayDateString()
}

export default function useSearchState() {
  const [terminals, setTerminals] = useState(readSavedTerminals)
  const [date, setDateState] = useState(readInitialDate)
  const [todayChecked, setTodayChecked] = useState(readTodayChecked)
  const [txn, setTxn] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [txnFrom, setTxnFrom] = useState('')
  const [txnTo, setTxnTo] = useState('')
  const [detailOpen, setDetailOpen] = useState(readPinnedPreference)
  const [pinned, setPinned] = useState(readPinnedPreference)

  const toggleTerminal = useCallback((ip) => {
    setTerminals((prev) => {
      const next = prev.includes(ip) ? prev.filter((t) => t !== ip) : [...prev, ip]
      localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setDate = useCallback((value) => {
    setDateState(value)
    localStorage.setItem(DATE_STORAGE_KEY, value)
  }, [])

  const toggleTodayChecked = useCallback(() => {
    setTodayChecked((prev) => {
      const next = !prev
      localStorage.setItem(TODAY_CHECKED_STORAGE_KEY, String(next))
      if (next) {
        const today = todayDateString()
        setDateState(today)
        localStorage.setItem(DATE_STORAGE_KEY, today)
      }
      return next
    })
  }, [])

  const toggleDetail = useCallback(() => {
    setDetailOpen((prev) => {
      const next = !prev
      if (next && date) {
        setDateFrom(`${date}T00:00`)
        setDateTo(`${date}T23:59`)
      }
      return next
    })
  }, [date])

  const clearAll = useCallback(() => {
    setTerminals([])
    localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify([]))

    const today = todayDateString()
    setTodayChecked(true)
    localStorage.setItem(TODAY_CHECKED_STORAGE_KEY, 'true')
    setDateState(today)
    localStorage.setItem(DATE_STORAGE_KEY, today)

    setTxn('')
    setDateFrom('')
    setDateTo('')
    setTxnFrom('')
    setTxnTo('')
    setDetailOpen(false)
  }, [])

  const togglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev
      localStorage.setItem(PIN_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const quickDisabled = detailOpen
  const dateInputDisabled = detailOpen || todayChecked
  const txnQuickDisabled = detailOpen
  const txnRangeDisabled = false
  const dateRangeInvalid = Boolean(detailOpen && dateFrom && dateTo && dateFrom > dateTo)
  const txnRangeInvalid = Boolean(
    detailOpen && txnFrom !== '' && txnTo !== '' && Number(txnFrom) > Number(txnTo)
  )
  const canSearch = terminals.length > 0 && !dateRangeInvalid && !txnRangeInvalid

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    terminals.forEach((ip) => params.append('ipaddress', ip))

    if (detailOpen) {
      if (dateFrom) params.append('created_at_from', dateFrom)
      if (dateTo) params.append('created_at_to', dateTo)
      if (txnFrom) params.append('transaction_no_from', txnFrom)
      if (txnTo) params.append('transaction_no_to', txnTo)
    } else {
      if (date) {
        params.append('created_at_from', `${date}T00:00`)
        params.append('created_at_to', `${date}T23:59`)
      }
      if (txn) {
        params.append('transaction_no_from', txn)
        params.append('transaction_no_to', txn)
      }
    }

    return params
  }, [terminals, detailOpen, dateFrom, dateTo, txnFrom, txnTo, date, txn])

  return {
    terminals,
    toggleTerminal,
    date,
    setDate,
    todayChecked,
    toggleTodayChecked,
    dateInputDisabled,
    txn,
    setTxn,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    txnFrom,
    setTxnFrom,
    txnTo,
    setTxnTo,
    detailOpen,
    toggleDetail,
    pinned,
    togglePin,
    clearAll,
    quickDisabled,
    txnQuickDisabled,
    txnRangeDisabled,
    dateRangeInvalid,
    txnRangeInvalid,
    canSearch,
    buildQueryParams,
  }
}
