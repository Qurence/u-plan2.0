"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

type ActionState<TOutput> = {
  fieldErrors?: Record<string, string[] | undefined>
  error?: string | null
  data?: TOutput
}

type Action<TInput, TOutput> = (data: TInput) => Promise<ActionState<TOutput>>

interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void
  onError?: (error: string) => void
  onComplete?: () => void
}

export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: UseActionOptions<TOutput> = {},
) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined> | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [data, setData] = useState<TOutput | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true)

      try {
        const result = await action(input)

        if (!result) {
          return
        }

        setFieldErrors(result.fieldErrors)

        if (result.error) {
          setError(result.error)
          options.onError?.(result.error)
          toast.error(result.error)
        }

        if (result.data) {
          setData(result.data)
          options.onSuccess?.(result.data)
        }
      } catch (error) {
        setError("Something went wrong!")
        options.onError?.("Something went wrong!")
        toast.error("Something went wrong!")
      } finally {
        setIsLoading(false)
        options.onComplete?.()
      }
    },
    [action, options],
  )

  return {
    execute,
    fieldErrors,
    error,
    data,
    isLoading,
  }
}
