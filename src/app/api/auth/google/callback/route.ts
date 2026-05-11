import { type NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/agenda?error=${error ?? 'no_code'}`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    // Replace any existing token for this user
    await supabase.from('google_tokens').delete().eq('user_id', user.id)
    await supabase.from('google_tokens').insert({
      user_id: user.id,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? null,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    })

    return NextResponse.redirect(`${origin}/agenda?connected=true`)
  } catch {
    return NextResponse.redirect(`${origin}/agenda?error=oauth_failed`)
  }
}
