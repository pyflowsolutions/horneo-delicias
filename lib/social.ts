export interface ShareOptions {
  platforms: ('instagram' | 'facebook' | 'twitter' | 'pinterest' | 'whatsapp')[]
  imageUrl: string
  caption: string
  location?: { name: string; lat: number; lng: number }
  link?: string
}

// Enlaces nativos de compartir (sin API keys - recomendado para empezar)
export function getShareLinks({ imageUrl, caption, location, link }: ShareOptions) {
  const encodedCaption = encodeURIComponent(
    location 
      ? `${caption}\n\n📍 ${location.name}` 
      : caption
  )
  const encodedUrl = encodeURIComponent(link || imageUrl)
  const encodedImage = encodeURIComponent(imageUrl)

  return {
    instagram: `https://www.instagram.com/create/post/?source_url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedCaption}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedCaption}`,
    whatsapp: `https://wa.me/?text=${encodedCaption}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedCaption}`,
  }
}

// Para publicación automática real, usa servicios intermediarios como Ayrshare
export async function shareViaAyrshare({
  apiKey,
  platforms,
  post,
  mediaUrls,
}: {
  apiKey: string
  platforms: string[]
  post: string
  mediaUrls: string[]
}) {
  const response = await fetch('https://api.ayrshare.com/api/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      post,
      platforms,
      mediaUrls,
      scheduleDate: null,
    }),
  })
  return response.json()
}