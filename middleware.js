export default async function middleware(request) {
  const url = new URL(request.url)
  const { pathname, search } = url

  let targetUrl

  if (pathname.startsWith('/api/asia/')) {
    targetUrl = `https://asia.api.riotgames.com${pathname.replace('/api/asia', '')}${search}`
  } else if (pathname.startsWith('/api/kr/')) {
    targetUrl = `https://kr.api.riotgames.com${pathname.replace('/api/kr', '')}${search}`
  } else {
    return
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
    })

    const headers = new Headers({ 'content-type': 'application/json' })
    if (response.headers.has('retry-after')) {
      headers.set('retry-after', response.headers.get('retry-after'))
    }

    return new Response(response.body, { status: response.status, headers })
  } catch (error) {
    return new Response(
      JSON.stringify({ status: { message: error.message, status_code: 500 } }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

export const config = {
  matcher: '/api/:path*',
}
