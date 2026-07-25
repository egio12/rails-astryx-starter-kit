import { useCallback, useEffect, useRef, useState } from "react"

export function useObjectUrl() {
  const [url, setUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  const replaceFile = useCallback((file: File | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)

    const nextUrl = file ? URL.createObjectURL(file) : null
    urlRef.current = nextUrl
    setUrl(nextUrl)
  }, [])

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  return [url, replaceFile] as const
}
