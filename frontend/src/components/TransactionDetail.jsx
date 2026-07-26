import { useEffect, useState } from 'react'
import { ApiError, getItemContent, getTransactionItems } from '../api'
import ItemViewer from './ItemViewer'

export default function TransactionDetail({ transactionId }) {
  const [items, setItems] = useState([])
  const [selectedName, setSelectedName] = useState(null)
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setItems([])
    setSelectedName(null)
    setContent(null)
    setError(null)

    getTransactionItems(transactionId)
      .then((data) => {
        setItems(data)
        if (data.length > 0) {
          setSelectedName(data[0].name)
        }
      })
      .catch((err) => setError(err))
  }, [transactionId])

  useEffect(() => {
    const selected = items.find((item) => item.name === selectedName)
    if (!selected) return

    setLoading(true)
    setError(null)
    setContent(null)

    getItemContent(selected.url)
      .then((data) => setContent(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [selectedName, items])

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        取引: {transactionId}
      </h2>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-4">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setSelectedName(item.name)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              item.name === selectedName
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          エラー ({error instanceof ApiError ? error.status : '不明'}): {error.message}
        </p>
      )}

      {!loading && !error && content && <ItemViewer item={content} />}
    </div>
  )
}
