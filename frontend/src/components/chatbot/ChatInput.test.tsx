import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChatInput } from './ChatInput'

describe('<ChatInput />', () => {
  it('sends on Enter and clears the field', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} />)

    const field = screen.getByLabelText('Message')
    await user.type(field, 'add python to my skills{Enter}')

    expect(onSend).toHaveBeenCalledWith('add python to my skills')
    expect(field).toHaveValue('')
  })

  it('Shift+Enter inserts a newline instead of sending', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} />)

    const field = screen.getByLabelText('Message')
    await user.type(field, 'line one{Shift>}{Enter}{/Shift}line two')

    expect(onSend).not.toHaveBeenCalled()
    expect(field).toHaveValue('line one\nline two')
  })

  it('does not send an empty message', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} />)
    await user.type(screen.getByLabelText('Message'), '   {Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables the Send button while disabled', () => {
    render(<ChatInput onSend={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })
})
