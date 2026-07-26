import { useEffect, useMemo, useRef, useState } from 'react'

function uniqueTerminals(transactions) {
  const seen = new Map()
  transactions.forEach((t) => {
    if (!seen.has(t.ipaddress)) {
      seen.set(t.ipaddress, {
        ipaddress: t.ipaddress,
        shop_no: t.shop_no,
        register_no: t.register_no,
      })
    }
  })
  return Array.from(seen.values())
}

function summaryText(selected) {
  if (selected.length === 0) return '端末を選択してください'
  if (selected.length === 1) return selected[0]
  return `${selected[0]} 他${selected.length - 1}件`
}

export default function TerminalSelect({ transactions, selected, onToggle }) {
  const [open, setOpen] = useState(false)
  const options = useMemo(() => uniqueTerminals(transactions), [transactions])
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`flex items-center gap-2 min-w-[220px] text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 ${
          selected.length === 0
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        <span>{summaryText(selected)}</span>
        <span aria-hidden="true" className="ml-auto text-gray-400 dark:text-gray-500">▾</span>
      </button>

      {open && (
        <div
          role="group"
          aria-label="端末候補"
          className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-1.5 z-10"
        >
          {options.map((option) => (
            <label
              key={option.ipaddress}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.ipaddress)}
                onChange={() => onToggle(option.ipaddress)}
              />
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {option.ipaddress}
              </span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                店{option.shop_no} / レジ{option.register_no}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
