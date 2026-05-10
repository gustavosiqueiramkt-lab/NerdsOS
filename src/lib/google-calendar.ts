import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

function makeOAuth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  )
}

export function getGoogleAuthUrl(): string {
  const client = makeOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  })
}

export async function exchangeCodeForTokens(code: string) {
  const client = makeOAuth2Client()
  const { tokens } = await client.getToken(code)
  return tokens
}

export interface GoogleCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  htmlLink?: string
}

async function getAuthenticatedClient(userId: string): Promise<OAuth2Client | null> {
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!row) return null

  const client = makeOAuth2Client()
  client.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: row.token_expiry ? new Date(row.token_expiry).getTime() : undefined,
  })

  // Refresh proactively if token expires within 60 s
  const expiresAt = row.token_expiry ? new Date(row.token_expiry).getTime() : 0
  if (expiresAt && expiresAt - Date.now() < 60_000) {
    try {
      const { credentials } = await client.refreshAccessToken()
      await supabase
        .from('google_tokens')
        .update({
          access_token: credentials.access_token!,
          token_expiry: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : null,
        })
        .eq('user_id', userId)
      client.setCredentials(credentials)
    } catch {
      // Refresh token revoked — force reconnect
      await supabase.from('google_tokens').delete().eq('user_id', userId)
      return null
    }
  }

  return client
}

export async function getCalendarEvents(
  userId: string,
  timeMin: string,
  timeMax: string,
): Promise<GoogleCalendarEvent[]> {
  const client = await getAuthenticatedClient(userId)
  if (!client) return []

  try {
    const calendar = google.calendar({ version: 'v3', auth: client })
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })

    return (data.items ?? []).map((e) => ({
      id: e.id!,
      title: e.summary || '(sem título)',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      allDay: !e.start?.dateTime,
      htmlLink: e.htmlLink ?? undefined,
    }))
  } catch {
    return []
  }
}

export async function createCalendarEvent(
  userId: string,
  event: { title: string; description?: string; start: string; end?: string },
): Promise<string | null> {
  const client = await getAuthenticatedClient(userId)
  if (!client) return null

  try {
    const calendar = google.calendar({ version: 'v3', auth: client })
    const endTime =
      event.end ??
      new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString()

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: new Date(event.start).toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: new Date(endTime).toISOString(), timeZone: 'America/Sao_Paulo' },
      },
    })

    return data.id ?? null
  } catch {
    return null
  }
}

export async function deleteCalendarEvent(
  userId: string,
  googleEventId: string,
): Promise<void> {
  const client = await getAuthenticatedClient(userId)
  if (!client) return

  try {
    const calendar = google.calendar({ version: 'v3', auth: client })
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId })
  } catch {
    // Ignore — event may already be deleted
  }
}
