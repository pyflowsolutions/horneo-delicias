-- ============================================
-- TABLA: photos
-- ============================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  original_name text not null,
  storage_path text not null, -- path en Supabase Storage
  public_url text not null,   -- URL pública de la imagen
  description text,
  tags text[] default '{}',
  location_lat decimal(10, 8), -- Coordenadas para geolocalización
  location_lng decimal(11, 8),
  published boolean default true,
  shared_to text[] default '{}', -- ['instagram', 'facebook', 'twitter']
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para rendimiento
create index idx_photos_published on public.photos(published, created_at desc);
create index idx_photos_location on public.photos using gist (
  point(location_lat, location_lng)
) where location_lat is not null and location_lng is not null;
create index idx_photos_tags on public.photos using gin(tags);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.photos enable row level security;

-- Política: Cualquiera puede ver fotos publicadas (lectura pública)
create policy "public can view published photos"
  on public.photos for select
  using (published = true);

-- Política: Solo usuarios autenticados pueden insertar (admin de la tienda)
create policy "authenticated users can insert photos"
  on public.photos for insert
  with check (auth.role() = 'authenticated');

-- Política: Solo el creador puede actualizar/eliminar su foto
create policy "owners can update their photos"
  on public.photos for update
  using (auth.uid() = (select user_id from auth.users where id = auth.uid()));

create policy "owners can delete their photos"
  on public.photos for delete
  using (auth.uid() = (select user_id from auth.users where id = auth.uid()));

-- ============================================
-- SUPABASE STORAGE: Bucket 'photos'
-- ============================================
-- Nota: El bucket se crea desde el dashboard o con la CLI:
-- supabase storage buckets create photos --public

-- Políticas RLS para el bucket 'photos'
insert into storage.buckets (id, name, public) 
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Política: Cualquiera puede leer imágenes públicas
create policy "public can read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

-- Política: Solo usuarios autenticados pueden subir
create policy "authenticated users can upload photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos' 
    and auth.role() = 'authenticated'
    and (lower(right(name, 4)) in ('.jpg', '.png', '.webp', '.jpeg'))
  );

-- Política: Solo el uploader puede actualizar/eliminar su archivo
create policy "owners can update their photos"
  on storage.objects for update
  using (bucket_id = 'photos' and auth.uid() = owner);

create policy "owners can delete their photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid() = owner);

-- ============================================
-- FUNCIONES UTILITARIAS
-- ============================================
-- Función para obtener fotos cerca de una ubicación
create or replace function public.get_photos_nearby(
  target_lat decimal,
  target_lng decimal,
  radius_km decimal default 5,
  limit_count integer default 20
)
returns table (
  id uuid,
  filename text,
  public_url text,
  description text,
  distance_km decimal,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.id,
    p.filename,
    p.public_url,
    p.description,
    -- Fórmula Haversine simplificada para distancia en km
    (6371 * acos(
      cos(radians(target_lat)) * cos(radians(p.location_lat)) * 
      cos(radians(p.location_lng) - radians(target_lng)) + 
      sin(radians(target_lat)) * sin(radians(p.location_lat))
    )) as distance_km,
    p.created_at
  from public.photos p
  where p.published = true
    and p.location_lat is not null
    and p.location_lng is not null
  order by distance_km asc
  limit limit_count;
end;
$$;