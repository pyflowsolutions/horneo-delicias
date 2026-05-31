import LocationMap, { HORNEO_DELICIAS_LOCATION } from '@/components/LocationMap'
import { createClient } from '@/lib/supabase/server'

export default async function LocationPage() {
  const supabase = await createClient()
  
  // Obtener fotos geolocalizadas cerca de la tienda
  const { data: nearbyPhotos } = await supabase.rpc('get_photos_nearby', {
    target_lat: HORNEO_DELICIAS_LOCATION.lat,
    target_lng: HORNEO_DELICIAS_LOCATION.lng,
    radius_km: 2, // 2km de radio
    limit_count: 10,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">
        📍 Nuestra Ubicación
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Visítanos en Horneo Delicias o descubre fotos tomadas cerca de aquí
      </p>

      {/* Mapa principal */}
      <div className="mb-8">
        <LocationMap 
          center={HORNEO_DELICIAS_LOCATION}
          height="500px"
          showMarker={true}
        />
      </div>

      {/* Información de contacto */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-orange-50 p-6 rounded-xl">
          <h3 className="font-bold text-lg mb-3">🥐 Horneo Delicias</h3>
          <ul className="space-y-2 text-gray-700">
            <li>📍 {HORNEO_DELICIAS_LOCATION.address}</li>
            <li>🕐 Lunes - Sábado: 7:00 - 21:00</li>
            <li>📞 +34 XXX XXX XXX</li>
            <li>
              <a 
                href={HORNEO_DELICIAS_LOCATION.googleMapsUrl}
                target="_blank"
                className="text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                Abrir en Google Maps →
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-cream-50 p-6 rounded-xl">
          <h3 className="font-bold text-lg mb-3">🗺️ Fotos Cercanas</h3>
          {nearbyPhotos && nearbyPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {nearbyPhotos.map((photo: any) => (
                <img
                  key={photo.id}
                  src={photo.public_url}
                  alt={photo.description || 'Foto'}
                  className="w-full aspect-square object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Aún no hay fotos geolocalizadas cerca. ¡Sé el primero en subir una! 📸
            </p>
          )}
        </div>
      </div>

      {/* Botón para subir foto con ubicación */}
      <div className="text-center">
        <a
          href="/upload?location=true"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-8 rounded-full transition-colors"
        >
          📸 Subir Foto desde esta Ubicación
        </a>
      </div>
    </div>
  )
}