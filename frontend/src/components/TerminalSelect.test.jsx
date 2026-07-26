import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TerminalSelect from './TerminalSelect'

const TRANSACTIONS = [
  {
    transaction_id: 'tx-1',
    ipaddress: '10.0.0.1',
    shop_no: 1,
    register_no: 1,
  },
  {
    transaction_id: 'tx-2',
    ipaddress: '10.0.0.1',
    shop_no: 1,
    register_no: 1,
  }, // 同じ端末の重複データ(重複排除の確認用)
  {
    transaction_id: 'tx-3',
    ipaddress: '10.0.0.2',
    shop_no: 1,
    register_no: 2,
  },
]

describe('TerminalSelect', () => {
  it('端末候補をIP+店舗+レジで重複排除して表示する', async () => {
    const user = userEvent.setup()
    render(
      <TerminalSelect transactions={TRANSACTIONS} selected={[]} onToggle={() => {}} />
    )

    await user.click(screen.getByRole('button', { name: /端末を選択してください/ }))

    const options = screen.getAllByRole('checkbox')
    expect(options).toHaveLength(2)
  })

  it('チェックボックスをクリックするとonToggleがそのIPで呼ばれる', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <TerminalSelect transactions={TRANSACTIONS} selected={[]} onToggle={onToggle} />
    )

    await user.click(screen.getByRole('button', { name: /端末を選択してください/ }))
    const dropdown = screen.getByRole('group')
    await user.click(within(dropdown).getByText('10.0.0.2'))

    expect(onToggle).toHaveBeenCalledWith('10.0.0.2')
  })

  it('未選択のときは「端末を選択してください」と表示する', () => {
    render(
      <TerminalSelect transactions={TRANSACTIONS} selected={[]} onToggle={() => {}} />
    )

    expect(screen.getByText('端末を選択してください')).toBeInTheDocument()
  })

  it('1件選択時はそのIPを表示する', () => {
    render(
      <TerminalSelect
        transactions={TRANSACTIONS}
        selected={['10.0.0.1']}
        onToggle={() => {}}
      />
    )

    expect(screen.getByText('10.0.0.1')).toBeInTheDocument()
  })

  it('ドロップダウンの外側をクリックすると閉じる', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <TerminalSelect transactions={TRANSACTIONS} selected={[]} onToggle={() => {}} />
        <p>外側の要素</p>
      </div>
    )

    await user.click(screen.getByRole('button', { name: /端末を選択してください/ }))
    expect(screen.getByRole('group')).toBeInTheDocument()

    await user.click(screen.getByText('外側の要素'))

    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('複数選択時は「先頭IP 他N件」と表示する', () => {
    render(
      <TerminalSelect
        transactions={TRANSACTIONS}
        selected={['10.0.0.1', '10.0.0.2']}
        onToggle={() => {}}
      />
    )

    expect(screen.getByText('10.0.0.1 他1件')).toBeInTheDocument()
  })
})
