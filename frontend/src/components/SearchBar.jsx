import { useId } from 'react'
import useSearchState from '../hooks/useSearchState'
import TerminalSelect from './TerminalSelect'

export default function SearchBar({ transactions, onSearch }) {
  const dateId = useId()
  const txnId = useId()
  const state = useSearchState()

  const handleSearch = () => {
    onSearch(state.buildQueryParams())
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-end gap-3 px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">端末</span>
          <TerminalSelect
            transactions={transactions}
            selected={state.terminals}
            onToggle={state.toggleTerminal}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={dateId} className="text-xs text-gray-500 dark:text-gray-400">
            日付
          </label>
          <div className="flex items-center gap-2">
            <input
              id={dateId}
              type="date"
              value={state.date}
              onChange={(e) => state.setDate(e.target.value)}
              disabled={state.dateInputDisabled}
              className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 disabled:opacity-40"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={state.todayChecked}
                onChange={state.toggleTodayChecked}
                disabled={state.quickDisabled}
              />
              当日
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={txnId} className="text-xs text-gray-500 dark:text-gray-400">
            取引番号
          </label>
          <input
            id={txnId}
            type="number"
            min="1"
            max="9999"
            placeholder="例: 1042"
            value={state.txn}
            onChange={(e) => state.setTxn(e.target.value)}
            disabled={state.txnQuickDisabled}
            className="w-24 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 disabled:opacity-40"
          />
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={state.clearAll}
          className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5"
        >
          クリア
        </button>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!state.canSearch}
          className="text-sm font-bold bg-blue-600 text-white rounded-md px-4 py-1.5 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700"
        >
          検索
        </button>
        <button
          type="button"
          onClick={state.toggleDetail}
          aria-expanded={state.detailOpen}
          className={`text-sm rounded-md px-3 py-1.5 border ${
            state.detailOpen
              ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
          }`}
        >
          {state.detailOpen ? '簡易検索 ▴' : '詳細検索 ▾'}
        </button>
      </div>

      {state.detailOpen && (
        <div className="flex flex-wrap items-start gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">日時範囲</span>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                aria-label="日時範囲(開始)"
                value={state.dateFrom}
                onChange={(e) => state.setDateFrom(e.target.value)}
                className={`text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border rounded-md px-2 py-1.5 ${
                  state.dateRangeInvalid
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              />
              <span className="text-gray-400 dark:text-gray-500">〜</span>
              <input
                type="datetime-local"
                aria-label="日時範囲(終了)"
                value={state.dateTo}
                onChange={(e) => state.setDateTo(e.target.value)}
                className={`text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border rounded-md px-2 py-1.5 ${
                  state.dateRangeInvalid
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              />
            </div>
            <span
              className={`text-xs ${
                state.dateRangeInvalid ? 'text-red-600 dark:text-red-400' : 'invisible'
              }`}
            >
              開始日時は終了日時より前にしてください
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">取引番号範囲</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="9999"
                aria-label="取引番号範囲(開始)"
                value={state.txnFrom}
                onChange={(e) => state.setTxnFrom(e.target.value)}
                disabled={state.txnRangeDisabled}
                className={`w-16 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border rounded-md px-2 py-1.5 disabled:opacity-40 ${
                  state.txnRangeInvalid
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              />
              <span className="text-gray-400 dark:text-gray-500">〜</span>
              <input
                type="number"
                min="1"
                max="9999"
                aria-label="取引番号範囲(終了)"
                value={state.txnTo}
                onChange={(e) => state.setTxnTo(e.target.value)}
                disabled={state.txnRangeDisabled}
                className={`w-16 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border rounded-md px-2 py-1.5 disabled:opacity-40 ${
                  state.txnRangeInvalid
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              />
            </div>
            <span
              className={`text-xs ${
                state.txnRangeInvalid ? 'text-red-600 dark:text-red-400' : 'invisible'
              }`}
            >
              開始番号は終了番号より前にしてください
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-1">
            <span className="invisible text-xs">固定</span>
            <button
              type="button"
              onClick={state.togglePin}
              aria-pressed={state.pinned}
              title={
                state.pinned
                  ? '固定を解除する(次回は単一入力で開きます)'
                  : '次回もこの状態(展開)で開くように固定する'
              }
              className={`text-xs font-semibold rounded-md px-3 py-1.5 border ${
                state.pinned
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              📌 {state.pinned ? '固定中' : '固定'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
