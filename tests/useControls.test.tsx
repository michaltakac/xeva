import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React, { useMemo } from 'react'
import { useControls, useXrevaStore } from '../src/core/useControls'

describe('useControls hook', () => {
  beforeEach(() => {
    useXrevaStore.getState().reset()
    cleanup()
  })

  function NestedControlComponent() {
    const schema = useMemo(
      () => ({
        geometry: {
          size: { value: 2, min: 0, max: 10 },
        },
      }),
      [],
    )

    const { geometry } = useControls('Nested', schema)

    return (
      <button data-testid="size" onClick={() => geometry.setSize(5)}>
        {geometry.size}
      </button>
    )
  }

  it('returns nested objects with functional setters', () => {
    render(<NestedControlComponent />)

    const button = screen.getByTestId('size')
    expect(button.textContent).toBe('2')

    fireEvent.click(button)
    expect(button.textContent).toBe('5')
  })

  function UnnamedControls({ label, initial }: { label: string; initial: number }) {
    const schema = useMemo(
      () => ({
        value: initial,
      }),
      [initial],
    )

    const values = useControls(schema)

    return <span data-testid={`value-${label}`}>{values.value}</span>
  }

  function UnnamedWrapper({ showSecond }: { showSecond: boolean }) {
    return (
      <div>
        <UnnamedControls label="one" initial={1} />
        {showSecond && <UnnamedControls label="two" initial={2} />}
      </div>
    )
  }

  it('isolates unnamed schemas per component instance', () => {
    const { rerender } = render(<UnnamedWrapper showSecond={true} />)

    expect(screen.getByTestId('value-one').textContent).toBe('1')
    expect(screen.getByTestId('value-two').textContent).toBe('2')

    rerender(<UnnamedWrapper showSecond={false} />)

    expect(screen.getByTestId('value-one').textContent).toBe('1')
    expect(useXrevaStore.getState().getAllControls()).toHaveLength(1)
  })

  it('cleans up controls on unmount', () => {
    const { unmount } = render(<NestedControlComponent />)

    expect(useXrevaStore.getState().getAllControls().length).toBeGreaterThan(0)

    unmount()

    expect(useXrevaStore.getState().getAllControls().length).toBe(0)
  })
})
