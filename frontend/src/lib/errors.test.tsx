import { render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { ErrorMessage } from '@/components/common/ErrorMessage'
import { toErrorMessage } from './errors'

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const err = new AxiosError('Request failed')
  // Only the fields toErrorMessage reads; cast keeps the test terse.
  err.response = { status, data } as AxiosError['response']
  return err
}

describe('toErrorMessage', () => {
  it('reads FastAPI string detail', () => {
    expect(toErrorMessage(axiosErrorWith(409, { detail: 'Email already registered' }))).toBe(
      'Email already registered',
    )
  })

  it('reads FastAPI validation detail arrays', () => {
    const err = axiosErrorWith(422, { detail: [{ msg: 'value is not a valid email address' }] })
    expect(toErrorMessage(err)).toBe('value is not a valid email address')
  })

  it('falls back for plain errors', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom')
    expect(toErrorMessage('nope', 'fallback')).toBe('fallback')
  })
})

describe('<ErrorMessage />', () => {
  it('renders nothing without an error', () => {
    const { container } = render(<ErrorMessage error={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message with an alert role', () => {
    render(<ErrorMessage error={new Error('Something broke')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something broke')
  })
})
