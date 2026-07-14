function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ja-JP')
}

export default function TransactionList({ transactions, selectedId, onSelect }) {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {transactions.map((transaction) => {
        const isSelected = transaction.transaction_id === selectedId
        return (
          <li key={transaction.transaction_id}>
            <button
              type="button"
              onClick={() => onSelect(transaction.transaction_id)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                取引 No.{transaction.transaction_no}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                店舗{transaction.shop_no} / レジ{transaction.register_no}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {formatDateTime(transaction.created_at)}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
