const APIFY_BASE = 'https://api.apify.com/v2'
const ACTOR_ID = 'compass~crawler-google-places'

export interface ApifyPlaceResult {
  title: string
  address: string | null
  city: string | null
  phone: string | null
  website: string | null
  url: string | null
  totalScore: number | null
  reviewsCount: number | null
  categoryName: string | null
  imageUrl: string | null
  socialMedia?: { instagram?: string }
  openingHours?: unknown[]
  additionalInfo?: Record<string, unknown>
}

export async function runApifyScraper(
  searchTerm: string,
  city: string,
  maxResults = 100,
): Promise<string> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN não configurado.')

  const query = city ? `${searchTerm} em ${city}` : searchTerm

  const res = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: maxResults,
        language: 'pt-BR',
        countryCode: 'br',
        includeHistogram: false,
        includeOpeningHours: false,
        includePeopleAlsoSearch: false,
        maxImages: 0,
        exportPlaceUrls: false,
      }),
    },
  )

  if (!res.ok) throw new Error(`Apify error: ${res.status}`)
  const data = await res.json()
  return data.data.id as string
}

export async function getApifyRunStatus(runId: string): Promise<{
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED'
  defaultDatasetId: string | null
}> {
  const token = process.env.APIFY_API_TOKEN
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`)
  if (!res.ok) throw new Error(`Apify status error: ${res.status}`)
  const data = await res.json()
  return {
    status: data.data.status,
    defaultDatasetId: data.data.defaultDatasetId ?? null,
  }
}

export async function getApifyDataset(datasetId: string): Promise<ApifyPlaceResult[]> {
  const token = process.env.APIFY_API_TOKEN
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json&clean=true`,
  )
  if (!res.ok) throw new Error(`Apify dataset error: ${res.status}`)
  return res.json()
}

export function calcScore(place: ApifyPlaceResult): number {
  let score = 0
  if (!place.website) score += 4
  if (place.reviewsCount !== null && place.reviewsCount < 10) score += 2
  if (place.totalScore !== null && place.totalScore < 4.0) score += 1
  if (!place.openingHours || (place.openingHours as unknown[]).length === 0) score += 1
  return score
}
