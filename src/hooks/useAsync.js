import { useState, useCallback, useRef } from 'react'

export function useAsync(asyncFn) {
  const [state, setState] = useState({ isLoading: false, error: null, data: null })
  const mountedRef = useRef(true)

  const execute = useCallback(async (...args) => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await asyncFn(...args)
      if (mountedRef.current) setState({ isLoading: false, error: null, data })
      return data
    } catch (error) {
      if (mountedRef.current) setState({ isLoading: false, error, data: null })
      throw error
    }
  }, [asyncFn])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null })
  }, [])

  return { ...state, execute, reset }
}
