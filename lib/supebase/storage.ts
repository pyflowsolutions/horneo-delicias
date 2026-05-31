import { createClient } from './server'

export const BUCKET_NAME = 'photos'
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function uploadPhoto(
  file: File,
  metadata: {
    description?: string
    tags?: string[]
    lat?: number
    lng?: number
  }
) {
  const supabase = await createClient()
  
  // Validaciones
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('El archivo supera el límite de 10MB')
  }

  // Generar path único: photos/YYYY-MM-DD/uuid-filename.ext
  const date = new Date().toISOString().split('T')[0]
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const path = `${date}/${fileName}`

  // Subir a Supabase Storage
  const { error: uploadError, data } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) throw uploadError

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return {
    path,
    publicUrl,
    fileName: file.name,
  }
}

export async function deletePhoto(storagePath: string) {
  const supabase = await createClient()
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])
  if (error) throw error
}

export function getPublicUrl(path: string): string {
  const { data } = createClient().storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  return data.publicUrl
}