import { useCallback, useState } from 'react'

const PIN_STORAGE_KEY = 'shirokuro:searchDetailPinned'
const TERMINALS_STORAGE_KEY = 'shirokuro:selectedTerminals'
const TODAY_CHECKED_STORAGE_KEY = 'shirokuro:todayChecked'
const DATE_STORAGE_KEY = 'shirokuro:date'
// デモデータ(demo_transactions_data.py)が固定でこの日付のため、初回訪問時に検索してすぐ結果が出るようデフォルト値にする
const DEFAULT_DEMO_DATE = '2026-07-14'

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
  // 未保存(初回)はデフォルトでOFF扱い(当日を検索してもデモデータの日付とズレて0件になるため)
  return saved === null ? false : saved === 'true'
}

function readInitialDate() {
  // 当日チェックがONなら、保存されていた日付は使わず必ず現在の日付を計算し直す
  if (readTodayChecked()) return todayDateString()
  return localStorage.getItem(DATE_STORAGE_KEY) || DEFAULT_DEMO_DATE
}

function appendRange(params, fromKey, toKey, fromValue, toValue) {
  if (fromValue) params.append(fromKey, fromValue)
  if (toValue) params.append(toKey, toValue)
}

// useStateと同じ初期値の渡し方(値 or 遅延初期化関数)をサポートしつつ、
// setterを呼ぶとlocalStorageへの書き込みも自動で行う
function useLocalStorageState(key, initialValue, serialize = String) {
  const [value, setValue] = useState(initialValue)

  const setPersistedValue = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        localStorage.setItem(key, serialize(resolved))
        return resolved
      })
    },
    [key, serialize]
  )

  return [value, setPersistedValue]
}

export default function useSearchState() {
  const [terminals, setTerminals] = useLocalStorageState(
    TERMINALS_STORAGE_KEY,
    readSavedTerminals,
    JSON.stringify
  )
  const [date, setDate] = useLocalStorageState(DATE_STORAGE_KEY, readInitialDate)
  const [todayChecked, setTodayChecked] = useLocalStorageState(
    TODAY_CHECKED_STORAGE_KEY,
    readTodayChecked
  )
  const [txn, setTxn] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [txnFrom, setTxnFrom] = useState('')
  const [txnTo, setTxnTo] = useState('')
  const [detailOpen, setDetailOpen] = useState(readPinnedPreference)
  const [pinned, setPinned] = useLocalStorageState(PIN_STORAGE_KEY, readPinnedPreference)

  const toggleTerminal = useCallback(
    (ip) => {
      setTerminals((prev) => (prev.includes(ip) ? prev.filter((t) => t !== ip) : [...prev, ip]))
    },
    [setTerminals]
  )

  const toggleTodayChecked = useCallback(() => {
    setTodayChecked((prev) => {
      const next = !prev
      if (next) setDate(todayDateString())
      return next
    })
  }, [setTodayChecked, setDate])

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
    setTodayChecked(false)
    setDate(DEFAULT_DEMO_DATE)

    setTxn('')
    setDateFrom('')
    setDateTo('')
    setTxnFrom('')
    setTxnTo('')
    // 📌固定中は、クリアしてもリロードでどうせ開き直るだけなので、そのまま開いた状態を維持する
    setDetailOpen(pinned)
  }, [pinned, setTerminals, setTodayChecked, setDate])

  const togglePin = useCallback(() => {
    setPinned((prev) => !prev)
  }, [setPinned])

  const dateInputDisabled = detailOpen || todayChecked
  const dateRangeInvalid = Boolean(detailOpen && dateFrom && dateTo && dateFrom > dateTo)
  const txnRangeInvalid = Boolean(
    detailOpen && txnFrom !== '' && txnTo !== '' && Number(txnFrom) > Number(txnTo)
  )
  const canSearch = terminals.length > 0 && !dateRangeInvalid && !txnRangeInvalid

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    terminals.forEach((ip) => params.append('ipaddress', ip))

    if (detailOpen) {
      appendRange(params, 'created_at_from', 'created_at_to', dateFrom, dateTo)
      appendRange(params, 'transaction_no_from', 'transaction_no_to', txnFrom, txnTo)
    } else {
      appendRange(
        params,
        'created_at_from',
        'created_at_to',
        date && `${date}T00:00`,
        date && `${date}T23:59`
      )
      appendRange(params, 'transaction_no_from', 'transaction_no_to', txn, txn)
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
    dateRangeInvalid,
    txnRangeInvalid,
    canSearch,
    buildQueryParams,
  }
}
