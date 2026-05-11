import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCalendarEvents } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const timeMin = searchParams.get('timeMin')
  const timeMax = searchParams.get('timeMax')

  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: 'Missing timeMin or timeMax' }, { status: 400 })
  }

  if (isNaN(Date.parse(timeMin)) || isNaN(Date.parse(timeMax))) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  const events = await getCalendarEvents(user.id, timeMin, timeMax)
  return NextResponse.json({ events })
}
