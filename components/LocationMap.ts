'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Coordenadas de Horneo Delicias (de tu enlace de Google Maps)
export const HORNEO_DELICIAS_LOCATION = {
  name: 'Horneo Delicias',
  lat: 40.1042313,
  lng: -3.6943979,
  address: 'Madrid, España',
  googleMapsUrl: 'https://www.google.com/maps/place/Horneo+Delicias/@40.1042354,-3.6969728,17z',
}

interface LocationMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  showMarker?: boolean
  height?: string
  onLocationSelect?: (lat: number, lng: number) => void
}

export default function LocationMap({
  center = HORNEO_DELICIAS_LOCATION,
  zoom = 15,
  showMarker = true,
  height = '400px',
  onLocationSelect,
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Inicializar mapa con Mapbox (gratuito hasta 50k cargas/mes)
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
    })

    // Añadir marcador de la tienda
    if (showMarker) {
      new mapboxgl.Marker({ color: '#E67E22' }) // Color naranja de marca
        .setLngLat([center.lng, center.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <strong>🥐 ${center.name}</strong><br/>
              <small>${center.address}</small><br/>
              <a href="${center.googleMapsUrl}" target="_blank" 
                 class="text-orange-600 hover:underline text-sm">
                Ver en Google Maps →
              </a>
            </div>
          `)
        )
        .addTo(map.current)
    }

    // Permitir selección de ubicación para nuevas fotos
    if (onLocationSelect) {
      map.current.on('click', (e) => {
        const { lat, lng } = e.lngLat.wrap()
        onLocationSelect(lat, lng)
        
        // Añadir marcador temporal
        new mapboxgl.Marker({ color: '#22C55E' })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setText('📍 Ubicación seleccionada'))
          .addTo(map.current!)
      })
    }

    // Controles de navegación
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
    }
  }, [center.lat, center.lng, zoom, showMarker, onLocationSelect])

  return (
    <div 
      ref={mapContainer} 
      className="w-full rounded-xl overflow-hidden shadow-lg"
      style={{ height }}
    />
  )
}