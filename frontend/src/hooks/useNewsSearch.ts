import { useEffect, useRef, useState } from "react"
import { fetchNews } from "@/lib/api/news"
import type { Article } from "@/lib/types/news"

type State =
  | { status: "idle"; articles: [] }
  | { status: "loading"; articles: [] }
  | { status: "success"; articles: Article[] }
  | { status: "error"; articles: []; error: string }

export function useNewsSearch(query: string) {
  const [state, setState] = useState<State>({ status: "idle", articles: [] })
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Skip if query is empty
    if (!query.trim()) {
      setState({ status: "idle", articles: [] })
      return
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Set loading state
    setState({ status: "loading", articles: [] })

    // Fetch news
    fetchNews({ query, signal: controller.signal })
      .then((articles) => {
        // Ignore if aborted
        if (controller.signal.aborted) {
          return
        }
        setState({ status: "success", articles })
      })
      .catch((error) => {
        // Ignore if aborted
        if (controller.signal.aborted || error.name === "AbortError") {
          return
        }
        setState({
          status: "error",
          articles: [],
          error: error.message || "Failed to fetch news",
        })
      })

    // Cleanup: abort on unmount or query change
    return () => {
      controller.abort()
    }
  }, [query])

  return state
}
