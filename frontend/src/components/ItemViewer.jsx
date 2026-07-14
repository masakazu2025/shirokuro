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
  if (item.type === 'text') {
    return (
      <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-4">
        {item.data}
      </pre>
    )
  }

  if (item.type === 'table') {
    return <DataTable columns={item.data.columns} rows={item.data.rows} />
  }

  if (item.type === 'tables') {
    return (
      <div className="space-y-6">
        {Object.entries(item.data).map(([key, table]) => (
          <div key={key}>
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
              {key}
            </h3>
            <DataTable columns={table.columns} rows={table.rows} />
          </div>
        ))}
      </div>
    )
  }

  return <p className="text-sm text-gray-500">未対応のtypeです: {item.type}</p>
}
