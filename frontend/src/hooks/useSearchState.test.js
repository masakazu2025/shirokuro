import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useSearchState from './useSearchState'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-26T09:00:00'))
})

describe('useSearchState', () => {
  it('defaults to the fixed demo date (当日OFF), no terminals selected, and detail search closed', () => {
    const { result } = renderHook(() => useSearchState())

    expect(result.current.date).toBe('2026-07-14')
    expect(result.current.todayChecked).toBe(false)
    expect(result.current.terminals).toEqual([])
    expect(result.current.detailOpen).toBe(false)
    expect(result.current.pinned).toBe(false)
    expect(result.current.canSearch).toBe(false)
  })

  describe('端末の選択', () => {
    it('toggleTerminal adds an ip when not selected', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))

      expect(result.current.terminals).toEqual(['10.0.0.1'])
      expect(result.current.canSearch).toBe(true)
    })

    it('toggleTerminal removes an ip when already selected', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleTerminal('10.0.0.1'))

      expect(result.current.terminals).toEqual([])
      expect(result.current.canSearch).toBe(false)
    })

  })

  describe('端末選択のlocalStorage永続化', () => {
    it('toggleTerminalで選択すると、選択状態がlocalStorageに保存される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))

      expect(JSON.parse(localStorage.getItem('shirokuro:selectedTerminals'))).toEqual([
        '10.0.0.1',
      ])
    })

    it('解除すると、localStorageからもそのIPが取り除かれる', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleTerminal('10.0.0.2'))
      act(() => result.current.toggleTerminal('10.0.0.1'))

      expect(JSON.parse(localStorage.getItem('shirokuro:selectedTerminals'))).toEqual([
        '10.0.0.2',
      ])
    })

    it('保存された選択状態があれば、起動時にそれを復元する', () => {
      localStorage.setItem(
        'shirokuro:selectedTerminals',
        JSON.stringify(['10.0.0.1', '10.0.0.2'])
      )

      const { result } = renderHook(() => useSearchState())

      expect(result.current.terminals).toEqual(['10.0.0.1', '10.0.0.2'])
      expect(result.current.canSearch).toBe(true)
    })

    it('保存が壊れたJSONでも、空の選択状態として起動する', () => {
      localStorage.setItem('shirokuro:selectedTerminals', 'not-json')

      const { result } = renderHook(() => useSearchState())

      expect(result.current.terminals).toEqual([])
    })
  })

  describe('グレーアウトの判定', () => {
    it('複数端末を選択しても、取引番号の入力欄(単一・範囲とも)は無効化されない', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleTerminal('10.0.0.2'))

      expect(result.current.txnQuickDisabled).toBe(false)
      expect(result.current.txnRangeDisabled).toBe(false)
    })

    it('詳細検索を開くと、単一入力欄(日付・取引番号・当日チェック)が無効化される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleDetail())

      expect(result.current.quickDisabled).toBe(true)
      expect(result.current.dateInputDisabled).toBe(true)
      expect(result.current.txnQuickDisabled).toBe(true)
      // 範囲入力(取引番号)は、詳細検索を開いても無効化されない
      expect(result.current.txnRangeDisabled).toBe(false)
    })

    it('詳細検索を開くとき、日付に値が入っていれば、その日の範囲(00:00〜23:59)を初期値としてセットする', () => {
      const { result } = renderHook(() => useSearchState())

      // date はデフォルトでデモデータの日付('2026-07-14')が入っている
      act(() => result.current.toggleDetail())

      expect(result.current.dateFrom).toBe('2026-07-14T00:00')
      expect(result.current.dateTo).toBe('2026-07-14T23:59')
    })

    it('詳細検索を閉じてから日付を変えて再度開くと、新しい日付の範囲に更新される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleDetail()) // 開く
      act(() => result.current.toggleDetail()) // 閉じる
      act(() => result.current.toggleTodayChecked()) // 当日チェックOFF
      act(() => result.current.setDate('2026-01-01'))
      act(() => result.current.toggleDetail()) // 再度開く

      expect(result.current.dateFrom).toBe('2026-01-01T00:00')
      expect(result.current.dateTo).toBe('2026-01-01T23:59')
    })

  })

  describe('📌固定とlocalStorageの復元', () => {
    it('togglePinで固定すると、detailOpenの状態がlocalStorageに保存される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleDetail()) // 開く
      act(() => result.current.togglePin()) // 固定する

      expect(result.current.pinned).toBe(true)
      expect(localStorage.getItem('shirokuro:searchDetailPinned')).toBe('true')
    })

    it('固定された状態を復元すると、detailOpenがtrueで初期化される', () => {
      localStorage.setItem('shirokuro:searchDetailPinned', 'true')

      const { result } = renderHook(() => useSearchState())

      expect(result.current.detailOpen).toBe(true)
      expect(result.current.pinned).toBe(true)
    })

    it('固定された状態を復元すると、単一入力欄のグレーアウトも連動して復元される', () => {
      localStorage.setItem('shirokuro:searchDetailPinned', 'true')

      const { result } = renderHook(() => useSearchState())

      // detailOpenの復元だけでなく、それに依存するグレーアウト判定も正しく効いていること
      expect(result.current.quickDisabled).toBe(true)
      expect(result.current.dateInputDisabled).toBe(true)
      expect(result.current.txnQuickDisabled).toBe(true)
    })

    it('固定されていない場合は、detailOpenがfalseで初期化される', () => {
      const { result } = renderHook(() => useSearchState())

      expect(result.current.detailOpen).toBe(false)
      expect(result.current.quickDisabled).toBe(false)
    })
  })

  describe('クエリパラメータの組み立て', () => {
    it('詳細検索が閉じているときは、日付は終日・取引番号は完全一致として組み立てる', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.setTxn('1042'))

      const params = result.current.buildQueryParams()

      expect(params.getAll('ipaddress')).toEqual(['10.0.0.1'])
      expect(params.get('created_at_from')).toBe('2026-07-14T00:00')
      expect(params.get('created_at_to')).toBe('2026-07-14T23:59')
      expect(params.get('transaction_no_from')).toBe('1042')
      expect(params.get('transaction_no_to')).toBe('1042')
    })

    it('詳細検索が開いているときは、範囲入力の値をそのまま使う', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleDetail())
      act(() => result.current.setDateFrom('2026-07-01T00:00'))
      act(() => result.current.setDateTo('2026-07-20T23:59'))
      act(() => result.current.setTxnFrom('10'))
      act(() => result.current.setTxnTo('20'))

      const params = result.current.buildQueryParams()

      expect(params.get('created_at_from')).toBe('2026-07-01T00:00')
      expect(params.get('created_at_to')).toBe('2026-07-20T23:59')
      expect(params.get('transaction_no_from')).toBe('10')
      expect(params.get('transaction_no_to')).toBe('20')
    })

    it('複数端末を選択していても、取引番号を入力していればクエリに含める', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleTerminal('10.0.0.2'))
      act(() => result.current.setTxn('1042'))

      const params = result.current.buildQueryParams()

      expect(params.get('transaction_no_from')).toBe('1042')
      expect(params.get('transaction_no_to')).toBe('1042')
      expect(params.getAll('ipaddress')).toEqual(['10.0.0.1', '10.0.0.2'])
    })

    it('取引番号が未入力のときは、クエリに含めない', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))

      const params = result.current.buildQueryParams()

      expect(params.has('transaction_no_from')).toBe(false)
      expect(params.has('transaction_no_to')).toBe(false)
    })
  })

  describe('範囲入力のバリデーション(開始 > 終了)', () => {
    it('日時範囲がfrom > toのとき、dateRangeInvalidがtrueになり検索できない', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleDetail())
      act(() => result.current.setDateFrom('2026-07-20T00:00'))
      act(() => result.current.setDateTo('2026-07-01T00:00'))

      expect(result.current.dateRangeInvalid).toBe(true)
      expect(result.current.canSearch).toBe(false)
    })

    it('取引番号範囲がfrom > toのとき、txnRangeInvalidがtrueになり検索できない', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleDetail())
      act(() => result.current.setTxnFrom('20'))
      act(() => result.current.setTxnTo('10'))

      expect(result.current.txnRangeInvalid).toBe(true)
      expect(result.current.canSearch).toBe(false)
    })

    it('from <= toなら不正ではない', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleDetail())
      act(() => result.current.setDateFrom('2026-07-01T00:00'))
      act(() => result.current.setDateTo('2026-07-20T00:00'))
      act(() => result.current.setTxnFrom('10'))
      act(() => result.current.setTxnTo('10'))

      expect(result.current.dateRangeInvalid).toBe(false)
      expect(result.current.txnRangeInvalid).toBe(false)
      expect(result.current.canSearch).toBe(true)
    })

    it('片方だけ入力されている場合は不正としない', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleDetail())
      act(() => result.current.setDateFrom('2026-07-20T00:00'))
      act(() => result.current.setDateTo('')) // 詳細検索を開いた際の自動セット分をクリアし、片方だけ入力の状態にする
      act(() => result.current.setTxnTo('10'))

      expect(result.current.dateRangeInvalid).toBe(false)
      expect(result.current.txnRangeInvalid).toBe(false)
      expect(result.current.canSearch).toBe(true)
    })
  })

  describe('当日チェックボックス', () => {
    it('デフォルトはOFFで、日付はデモデータに合わせた固定値・入力欄は編集可能', () => {
      const { result } = renderHook(() => useSearchState())

      expect(result.current.todayChecked).toBe(false)
      expect(result.current.date).toBe('2026-07-14')
      expect(result.current.dateInputDisabled).toBe(false)
    })

    it('ONにすると日付が今日になり、入力欄が無効化される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTodayChecked()) // ON

      expect(result.current.todayChecked).toBe(true)
      expect(result.current.date).toBe('2026-07-26')
      expect(result.current.dateInputDisabled).toBe(true)
    })

    it('OFFの状態でsetDateすると、任意の日付に変更できる', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.setDate('2026-01-01'))

      expect(result.current.date).toBe('2026-01-01')
    })

    it('ONにしてから再度OFFにすると、日付は今日のまま編集可能になる', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTodayChecked()) // ON
      act(() => result.current.toggleTodayChecked()) // OFF

      expect(result.current.date).toBe('2026-07-26')
      expect(result.current.dateInputDisabled).toBe(false)
    })

    it('チェック状態と日付がlocalStorageに保存される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTodayChecked()) // ON
      act(() => result.current.toggleTodayChecked()) // OFF
      act(() => result.current.setDate('2026-01-01'))

      expect(localStorage.getItem('shirokuro:todayChecked')).toBe('false')
      expect(localStorage.getItem('shirokuro:date')).toBe('2026-01-01')
    })

    it('OFFで特定の日付を保存していた場合、そのまま復元される', () => {
      localStorage.setItem('shirokuro:todayChecked', 'false')
      localStorage.setItem('shirokuro:date', '2026-01-01')

      const { result } = renderHook(() => useSearchState())

      expect(result.current.todayChecked).toBe(false)
      expect(result.current.date).toBe('2026-01-01')
    })

    it('ONで保存されていた場合、保存されていた日付は使わず、今日の日付を計算し直す', () => {
      // 前回訪問時に保存された古い「今日」の日付(実際の今日とは異なる)
      localStorage.setItem('shirokuro:todayChecked', 'true')
      localStorage.setItem('shirokuro:date', '2026-01-01')

      const { result } = renderHook(() => useSearchState())

      expect(result.current.todayChecked).toBe(true)
      expect(result.current.date).toBe('2026-07-26') // 保存値ではなく、現在の日付
    })
  })

  describe('クリアボタン', () => {
    it('すべての検索条件がデフォルト状態(端末未選択・当日OFF・空)にリセットされる', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleTerminal('10.0.0.2'))
      act(() => result.current.toggleTodayChecked()) // ON
      act(() => result.current.setTxn('42'))
      act(() => result.current.toggleDetail())
      act(() => result.current.setDateFrom('2026-01-01T00:00'))
      act(() => result.current.setDateTo('2026-01-05T00:00'))
      act(() => result.current.setTxnFrom('1'))
      act(() => result.current.setTxnTo('2'))

      act(() => result.current.clearAll())

      expect(result.current.terminals).toEqual([])
      expect(result.current.todayChecked).toBe(false)
      expect(result.current.date).toBe('2026-07-14')
      expect(result.current.txn).toBe('')
      expect(result.current.dateFrom).toBe('')
      expect(result.current.dateTo).toBe('')
      expect(result.current.txnFrom).toBe('')
      expect(result.current.txnTo).toBe('')
      expect(result.current.canSearch).toBe(false)
      expect(result.current.detailOpen).toBe(false)
    })

    it('クリア後、端末選択・当日・日付のlocalStorageも初期状態で保存し直される', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleTerminal('10.0.0.1'))
      act(() => result.current.toggleTodayChecked()) // ON
      act(() => result.current.setDate('2026-01-01'))

      act(() => result.current.clearAll())

      expect(JSON.parse(localStorage.getItem('shirokuro:selectedTerminals'))).toEqual([])
      expect(localStorage.getItem('shirokuro:todayChecked')).toBe('false')
      expect(localStorage.getItem('shirokuro:date')).toBe('2026-07-14')
    })

    it('📌固定中にクリアしても、詳細検索は閉じずに開いたままになる', () => {
      const { result } = renderHook(() => useSearchState())

      act(() => result.current.toggleDetail()) // 開く
      act(() => result.current.togglePin()) // 固定する
      act(() => result.current.setTxnFrom('1'))

      act(() => result.current.clearAll())

      expect(result.current.pinned).toBe(true)
      expect(result.current.detailOpen).toBe(true)
      expect(result.current.txnFrom).toBe('')
    })
  })
})
