import { useState } from 'react'

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2 text-gray-800 dark:text-gray-200">
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ItemViewer({ item }) {
  const [selectedTableKey, setSelectedTableKey] = useState(null)

  if (item.type === 'text') {
    return (
      <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-4">
        {item.data}
      </pre>
    )
  }

  if (item.type === 'table') {
    return <DataTable columns={item.data.columns} rows={item.data.rows} />
  }

  if (item.type === 'tables') {
    const keys = Object.keys(item.data)
    // 直前に選んでいたタブが、切り替わった取引データに存在しない場合は先頭に戻す
    const activeKey = keys.includes(selectedTableKey) ? selectedTableKey : keys[0]
    const activeTable = item.data[activeKey]

    return (
      <div>
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-4">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedTableKey(key)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                key === activeKey
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {item.data[key].label}
            </button>
          ))}
        </div>
        {activeTable && <DataTable columns={activeTable.columns} rows={activeTable.rows} />}
      </div>
    )
  }

  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      未対応のtypeです: {item.type}
    </p>
  )
}
