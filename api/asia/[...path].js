export default async function handler(req, res) {
  const { path: pathArr, ...queryParams } = req.query

  const pathStr = (Array.isArray(pathArr) ? pathArr : [pathArr || ''])
    .map(encodeURIComponent)
    .join('/')

  const qs = new URLSearchParams(queryParams).toString()
  const url = `https://asia.api.riotgames.com/${pathStr}${qs ? `?${qs}` : ''}`

  try {
    const response = await fetch(url, {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
    })
    if (response.headers.has('Retry-After')) {
      res.setHeader('Retry-After', response.headers.get('Retry-After'))
    }
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (e) {
    res.status(500).json({ status: { message: e.message, status_code: 500 } })
  }
}
