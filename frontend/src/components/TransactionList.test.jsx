import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionList from './TransactionList'

const TRANSACTIONS = [
  {
    transaction_id: 'tx-1',
    transaction_no: 1,
    shop_no: 1,
    register_no: 2,
    created_at: '2026-07-14T18:40:32',
  },
  {
    transaction_id: 'tx-2',
    transaction_no: 2,
    shop_no: 1,
    register_no: 3,
    created_at: '2026-07-14T18:47:32',
  },
]

describe('TransactionList', () => {
  it('renders a row for each transaction', () => {
    render(
      <TransactionList
        transactions={TRANSACTIONS}
        selectedId={null}
        onSelect={() => {}}
      />
    )

    expect(screen.getByText('取引 No.1')).toBeInTheDocument()
    expect(screen.getByText('取引 No.2')).toBeInTheDocument()
  })

  it('calls onSelect with the clicked transaction id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <TransactionList
        transactions={TRANSACTIONS}
        selectedId={null}
        onSelect={onSelect}
      />
    )

    await user.click(screen.getByText('取引 No.2'))

    expect(onSelect).toHaveBeenCalledWith('tx-2')
  })

  it('selectedIdと一致する行だけがハイライト表示される', () => {
    render(
      <TransactionList
        transactions={TRANSACTIONS}
        selectedId="tx-2"
        onSelect={() => {}}
      />
    )

    expect(screen.getByText('取引 No.2').closest('button')).toHaveClass('bg-blue-50')
    expect(screen.getByText('取引 No.1').closest('button')).not.toHaveClass('bg-blue-50')
  })
})
