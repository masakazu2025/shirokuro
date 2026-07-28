import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemViewer from './ItemViewer'

const TABLES_ITEM = {
  type: 'tables',
  data: {
    cash: {
      label: '現金',
      columns: [
        { key: 'No', label: 'No' },
        { key: 'name', label: '項目名' },
        { key: 'value', label: '値' },
      ],
      rows: [
        { No: 1, name: '金額', value: 10000 },
        { No: 2, name: '釣り', value: 500 },
      ],
    },
    codepay: {
      label: 'コード決済',
      columns: [
        { key: 'No', label: 'No' },
        { key: 'name', label: '項目名' },
        { key: 'value', label: '値' },
      ],
      rows: [
        { No: 1, name: '金額', value: 5000 },
        { No: 2, name: 'ブランド', value: 'PayPay' },
      ],
    },
  },
}

describe('ItemViewer (tables type)', () => {
  it('支払手段ごとのタブを表示し、デフォルトで先頭のタブの内容を表示する', () => {
    render(<ItemViewer item={TABLES_ITEM} />)

    expect(screen.getByRole('button', { name: '現金' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'コード決済' })).toBeInTheDocument()

    expect(screen.getByText('釣り')).toBeInTheDocument()
    expect(screen.queryByText('ブランド')).not.toBeInTheDocument()
  })

  it('タブをクリックすると、その支払手段の内容に切り替わる', async () => {
    const user = userEvent.setup()
    render(<ItemViewer item={TABLES_ITEM} />)

    await user.click(screen.getByRole('button', { name: 'コード決済' }))

    expect(screen.getByText('ブランド')).toBeInTheDocument()
    expect(screen.queryByText('釣り')).not.toBeInTheDocument()
  })

  it('textタイプは引き続きそのまま表示する', () => {
    render(<ItemViewer item={{ type: 'text', data: 'レシート本文' }} />)

    expect(screen.getByText('レシート本文')).toBeInTheDocument()
  })
})

const TABLE_ITEM = {
  type: 'table',
  data: {
    columns: [
      { key: 'category_name', label: 'カテゴリ名' },
      { key: 'amount', label: '金額' },
      { key: 'quantity', label: '点数' },
    ],
    rows: [
      { category_name: '食品', amount: 600, quantity: 2 },
      { category_name: '飲料', amount: 300, quantity: 1 },
    ],
  },
}

describe('ItemViewer (table type)', () => {
  it('単一テーブルとして列見出し・行の内容を表示する(タブは表示しない)', () => {
    render(<ItemViewer item={TABLE_ITEM} />)

    expect(screen.getByRole('columnheader', { name: 'カテゴリ名' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '金額' })).toBeInTheDocument()
    expect(screen.getByText('食品')).toBeInTheDocument()
    expect(screen.getByText('飲料')).toBeInTheDocument()
    // tables型と違い、決済手段タブのような切り替えボタンは存在しない
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ItemViewer (未対応のtype)', () => {
  it('未知のtypeはフォールバックメッセージを表示する', () => {
    render(<ItemViewer item={{ type: 'unknown', data: null }} />)

    expect(screen.getByText('未対応のtypeです: unknown')).toBeInTheDocument()
  })
})
