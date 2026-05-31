import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadPhoto } from '@/lib/supabase/storage'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const lat = formData.get('lat') as string
    const lng = formData.get('lng') as string

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Subir a Supabase Storage
    const { path, publicUrl, fileName } = await uploadPhoto(file, {
      description,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
    })

    // Guardar metadatos en la tabla 'photos'
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        filename: fileName,
        original_name: fileName,
        storage_path: path,
        public_url: publicUrl,
        description: description || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        location_lat: lat ? parseFloat(lat) : null,
        location_lng: lng ? parseFloat(lng) : null,
        published: true,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ 
      success: true, 
      photo: {
        id: photo.id,
        url: publicUrl,
        description: photo.description,
        tags: photo.tags,
        created_at: photo.created_at,
      }
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir la imagen' }, 
      { status: 500 }
    )
  }
}