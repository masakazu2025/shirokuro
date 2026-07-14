import { useEffect, useState } from 'react'
import { getTransactions } from './api'
import TransactionList from './components/TransactionList'
import TransactionDetail from './components/TransactionDetail'

function App() {
  const [transactions, setTransactions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getTransactions()
      .then((data) => {
        setTransactions(data)
        if (data.length > 0) {
          setSelectedId(data[0].transaction_id)
        }
      })
      .catch((err) => setError(err))
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Shirokuro
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          取引データ閲覧
        </p>
      </header>

      {error && (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">
          取引一覧の取得に失敗しました: {error.message}
        </p>
      )}

      <div className="flex">
        <aside className="w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-73px)] overflow-y-auto">
          <TransactionList
            transactions={transactions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        <main className="flex-1">
          {selectedId ? (
            <TransactionDetail transactionId={selectedId} />
          ) : (
            <p className="p-6 text-sm text-gray-500">取引を選択してください</p>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
