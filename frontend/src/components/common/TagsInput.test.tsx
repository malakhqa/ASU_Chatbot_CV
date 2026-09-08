import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { TagsInput } from './TagsInput'

function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = useState(initial)
  return (
    <>
      <TagsInput label="Skills" value={tags} onChange={setTags} />
      <output data-testid="value">{tags.join('|')}</output>
    </>
  )
}

const value = () => screen.getByTestId('value').textContent

describe('<TagsInput />', () => {
  it('adds a tag on Enter and on comma', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Skills')
    await user.type(input, 'Python{Enter}')
    await user.type(input, 'SQL,')
    expect(value()).toBe('Python|SQL')
  })

  it('ignores duplicates', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Python']} />)
    await user.type(screen.getByLabelText('Skills'), 'Python{Enter}')
    expect(value()).toBe('Python')
  })

  it('removes a tag with its × button', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Python', 'SQL']} />)
    await user.click(screen.getByRole('button', { name: 'Remove Python' }))
    expect(value()).toBe('SQL')
  })

  it('Backspace on an empty input removes the last tag', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Python', 'SQL']} />)
    const input = screen.getByLabelText('Skills')
    input.focus()
    await user.keyboard('{Backspace}')
    expect(value()).toBe('Python')
  })
})
