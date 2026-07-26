import { useEffect, useState } from 'react'
import { getTransactions } from './api'
import useTheme from './hooks/useTheme'
import SearchBar from './components/SearchBar'
import TransactionList from './components/TransactionList'
import TransactionDetail from './components/TransactionDetail'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [allTransactions, setAllTransactions] = useState([])
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 端末選択ドロップダウンの候補を作るための、無条件の全件取得
    getTransactions()
      .then((data) => setAllTransactions(data))
      .catch((err) => setError(err))
  }, [])

  const handleSearch = (params) => {
    setError(null)
    getTransactions(params)
      .then((data) => {
        setResults(data)
        setHasSearched(true)
        setSelectedId(data.length > 0 ? data[0].transaction_id : null)
      })
      .catch((err) => setError(err))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Shirokuro
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            取引データ閲覧
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5"
        >
          {theme === 'dark' ? '☀️ ライト' : '🌙 ダーク'}
        </button>
      </header>

      <SearchBar transactions={allTransactions} onSearch={handleSearch} />

      {error && (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">
          取引の取得に失敗しました: {error.message}
        </p>
      )}

      {!error && !hasSearched && (
        <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
          検索条件を指定して、検索ボタンを押してください
        </p>
      )}

      {!error && hasSearched && (
        <div className="flex">
          <aside className="w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-140px)] overflow-y-auto">
            {results.length > 0 ? (
              <TransactionList
                transactions={results}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400">該当する取引がありません</p>
            )}
          </aside>

          <main className="flex-1">
            {selectedId ? (
              <TransactionDetail transactionId={selectedId} />
            ) : (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400">取引を選択してください</p>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default App
