import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

const TRANSACTIONS = [
  { transaction_id: 'tx-1', ipaddress: '10.0.0.1', shop_no: 1, register_no: 1 },
  { transaction_id: 'tx-2', ipaddress: '10.0.0.2', shop_no: 1, register_no: 2 },
]

beforeEach(() => {
  localStorage.clear()
})

async function selectTerminal(user, ip) {
  // ドロップダウンは複数選択のため、一度開いたら選択のたびには閉じない。
  // 既に開いている場合はトリガーを再度クリックしない(クリックすると閉じてしまうため)。
  if (!screen.queryByRole('group')) {
    await user.click(
      screen.getByRole('button', { name: /端末を選択してください|他\d+件|^10\./ })
    )
  }
  await user.click(screen.getByText(ip))
}

describe('SearchBar', () => {
  it('端末を選択していない間は検索ボタンが無効', () => {
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    expect(screen.getByRole('button', { name: '検索' })).toBeDisabled()
  })

  it('端末を選択すると検索ボタンが有効になる', async () => {
    const user = userEvent.setup()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    await selectTerminal(user, '10.0.0.1')

    expect(screen.getByRole('button', { name: '検索' })).toBeEnabled()
  })

  it('検索ボタンを押すと、選択した端末を含むパラメータでonSearchが呼ばれる', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={onSearch} />)

    await selectTerminal(user, '10.0.0.1')
    await user.click(screen.getByRole('button', { name: '検索' }))

    expect(onSearch).toHaveBeenCalledTimes(1)
    const params = onSearch.mock.calls[0][0]
    expect(params.getAll('ipaddress')).toEqual(['10.0.0.1'])
  })

  it('「詳細検索」を開くと範囲入力が表示され、単一入力欄がグレーアウトする', async () => {
    const user = userEvent.setup()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    await user.click(screen.getByRole('button', { name: /詳細検索/ }))

    expect(screen.getByLabelText('日時範囲(開始)')).toBeInTheDocument()
    expect(screen.getByLabelText('日時範囲(終了)')).toBeInTheDocument()
    expect(screen.getByLabelText('取引番号範囲(開始)')).toBeInTheDocument()
    expect(screen.getByLabelText('取引番号範囲(終了)')).toBeInTheDocument()

    expect(screen.getByLabelText('日付')).toBeDisabled()
    expect(screen.getByLabelText('取引番号')).toBeDisabled()
  })

  it('複数端末を選択しても取引番号の範囲入力欄は無効にならない(単一入力欄は詳細検索を開いているため無効)', async () => {
    const user = userEvent.setup()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    await selectTerminal(user, '10.0.0.1')
    await selectTerminal(user, '10.0.0.2')
    await user.click(screen.getByRole('button', { name: /詳細検索/ }))

    expect(screen.getByLabelText('取引番号')).toBeDisabled()
    expect(screen.getByLabelText('取引番号範囲(開始)')).toBeEnabled()
    expect(screen.getByLabelText('取引番号範囲(終了)')).toBeEnabled()
  })

  it('取引番号の入力欄は1〜9999の範囲でのみ入力できる', () => {
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    const txnInput = screen.getByLabelText('取引番号')
    expect(txnInput).toHaveAttribute('min', '1')
    expect(txnInput).toHaveAttribute('max', '9999')
  })

  it('詳細検索の取引番号範囲の入力欄も1〜9999の範囲でのみ入力できる', async () => {
    const user = userEvent.setup()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    await user.click(screen.getByRole('button', { name: /詳細検索/ }))

    expect(screen.getByLabelText('取引番号範囲(開始)')).toHaveAttribute('min', '1')
    expect(screen.getByLabelText('取引番号範囲(開始)')).toHaveAttribute('max', '9999')
    expect(screen.getByLabelText('取引番号範囲(終了)')).toHaveAttribute('min', '1')
    expect(screen.getByLabelText('取引番号範囲(終了)')).toHaveAttribute('max', '9999')
  })

  it('当日チェックはデフォルトでON、日付入力欄は無効化されている', () => {
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    expect(screen.getByRole('checkbox', { name: '当日' })).toBeChecked()
    expect(screen.getByLabelText('日付')).toBeDisabled()
  })

  it('当日チェックを外すと、日付入力欄が編集可能になる', async () => {
    const user = userEvent.setup()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    await user.click(screen.getByRole('checkbox', { name: '当日' }))

    expect(screen.getByRole('checkbox', { name: '当日' })).not.toBeChecked()
    expect(screen.getByLabelText('日付')).toBeEnabled()
  })

  it('詳細検索を開いている間は、当日チェックボックス自体も無効になる', async () => {
    const user = userEvent.setup()
    render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

    await user.click(screen.getByRole('button', { name: /詳細検索/ }))

    expect(screen.getByRole('checkbox', { name: '当日' })).toBeDisabled()
  })

  describe('範囲入力のバリデーション', () => {
    it('日時範囲がfrom > toのとき、エラーメッセージを表示し検索ボタンを無効化する', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      await selectTerminal(user, '10.0.0.1')
      await user.click(screen.getByRole('button', { name: /詳細検索/ }))
      fireEvent.change(screen.getByLabelText('日時範囲(開始)'), { target: { value: '2026-07-20T00:00' } })
      fireEvent.change(screen.getByLabelText('日時範囲(終了)'), { target: { value: '2026-07-01T00:00' } })

      expect(screen.getByText('開始日時は終了日時より前にしてください')).not.toHaveClass('invisible')
      expect(screen.getByRole('button', { name: '検索' })).toBeDisabled()
    })

    it('取引番号範囲がfrom > toのとき、エラーメッセージを表示し検索ボタンを無効化する', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      await selectTerminal(user, '10.0.0.1')
      await user.click(screen.getByRole('button', { name: /詳細検索/ }))
      fireEvent.change(screen.getByLabelText('取引番号範囲(開始)'), { target: { value: '20' } })
      fireEvent.change(screen.getByLabelText('取引番号範囲(終了)'), { target: { value: '10' } })

      expect(screen.getByText('開始番号は終了番号より前にしてください')).not.toHaveClass('invisible')
      expect(screen.getByRole('button', { name: '検索' })).toBeDisabled()
    })

    it('from <= toに直すとエラーメッセージが消え、検索ボタンが有効に戻る', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      await selectTerminal(user, '10.0.0.1')
      await user.click(screen.getByRole('button', { name: /詳細検索/ }))
      fireEvent.change(screen.getByLabelText('取引番号範囲(開始)'), { target: { value: '20' } })
      fireEvent.change(screen.getByLabelText('取引番号範囲(終了)'), { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText('取引番号範囲(終了)'), { target: { value: '30' } })

      expect(screen.getByText('開始番号は終了番号より前にしてください')).toHaveClass('invisible')
      expect(screen.getByRole('button', { name: '検索' })).toBeEnabled()
    })

    it('エラーが無いときも、メッセージ表示欄の高さは常に確保されている(レイアウトが動かないように)', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      await selectTerminal(user, '10.0.0.1')
      await user.click(screen.getByRole('button', { name: /詳細検索/ }))

      expect(screen.getByText('開始日時は終了日時より前にしてください')).toHaveClass('invisible')
      expect(screen.getByText('開始番号は終了番号より前にしてください')).toHaveClass('invisible')
    })
  })

  describe('クリアボタン', () => {
    it('クリアボタンを押すと、選択済みの端末・入力値がすべてリセットされる', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      await selectTerminal(user, '10.0.0.1')
      await user.type(screen.getByLabelText('取引番号'), '42')
      expect(screen.getByRole('button', { name: '検索' })).toBeEnabled()

      await user.click(screen.getByRole('button', { name: 'クリア' }))

      expect(screen.getByLabelText('取引番号')).toHaveValue(null)
      expect(screen.getByRole('button', { name: '検索' })).toBeDisabled()
      expect(screen.getByRole('checkbox', { name: '当日' })).toBeChecked()
    })
  })

  describe('詳細検索/簡易検索ボタンの表示切り替え', () => {
    it('開いていないときは「詳細検索」、開くと「簡易検索」に文言が変わる', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      expect(screen.getByRole('button', { name: /詳細検索/ })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /詳細検索/ }))

      expect(screen.getByRole('button', { name: /簡易検索/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /詳細検索/ })).not.toBeInTheDocument()
    })

    it('開いている間は、ボタンの見た目が変わる(強調色のクラスが付く)', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      const button = screen.getByRole('button', { name: /詳細検索/ })
      expect(button).not.toHaveClass('border-blue-500')

      await user.click(button)

      expect(screen.getByRole('button', { name: /簡易検索/ })).toHaveClass('border-blue-500')
    })

    it('簡易検索ボタンを押すと単一入力に戻る', async () => {
      const user = userEvent.setup()
      render(<SearchBar transactions={TRANSACTIONS} onSearch={() => {}} />)

      await user.click(screen.getByRole('button', { name: /詳細検索/ }))
      await user.click(screen.getByRole('button', { name: /簡易検索/ }))

      expect(screen.getByRole('button', { name: /詳細検索/ })).toBeInTheDocument()
      expect(screen.queryByLabelText('日時範囲(開始)')).not.toBeInTheDocument()
    })
  })
})
