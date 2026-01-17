import type { Article } from "@/lib/types/news"

export type NewsSearchParams = {
  query: string
  providers?: string[]
  limit?: number
  signal?: AbortSignal
}

/**
 * Calls GET /news/search
 * - MUST throw on network failure
 * - MUST return Article[]
 * - MUST support AbortController
 */
export async function fetchNews(
  params: NewsSearchParams
): Promise<Article[]> {
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || "http://localhost:8000"
  
  const searchParams = new URLSearchParams()
  searchParams.append("q", params.query)
  
  if (params.providers) {
    params.providers.forEach((provider) => {
      searchParams.append("providers", provider)
    })
  }
  
  if (params.limit !== undefined) {
    searchParams.append("limit", String(params.limit))
  }
  
  const url = `${baseUrl}/news/search?${searchParams.toString()}`
  
  const response = await fetch(url, {
    signal: params.signal,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  return data as Article[]
}
