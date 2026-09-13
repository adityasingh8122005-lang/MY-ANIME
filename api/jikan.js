export default async function handler(req, res) {
  const { endpoint, ...queryParams } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  // Construct Jikan URL
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    searchParams.append(key, value);
  }
  
  const targetUrl = `https://api.jikan.moe/v4${endpoint}?${searchParams.toString()}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'MyAnime Tracker (Vercel Proxy)',
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Jikan API error: ${response.statusText}` });
    }
    
    const data = await response.json();
    
    // Cache on Vercel's Edge Network for 5 minutes (300s), stale-while-revalidate for 1 day
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    // Enable CORS for our app
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Jikan API' });
  }
}
