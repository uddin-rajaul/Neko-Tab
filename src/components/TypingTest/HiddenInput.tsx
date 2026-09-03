import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

interface HiddenInputProps {
  onInput: (value: string) => void
  disabled?: boolean
}

export interface HiddenInputHandle {
  focus: () => void
}

export const HiddenInput = forwardRef<HiddenInputHandle, HiddenInputProps>(({ onInput, disabled }, ref) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      onInput('Backspace')
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      onInput(' ')
      return
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      onInput(e.key)
    }
  }, [onInput, disabled])

  return (
    <textarea
      ref={inputRef}
      className="tt-hidden-input"
      onKeyDown={handleKeyDown}
      disabled={disabled}
      autoFocus
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      aria-label="Typing test input"
    />
  )
})
