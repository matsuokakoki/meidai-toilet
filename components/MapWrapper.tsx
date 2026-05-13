// components/MapWrapper.tsx
'use client'

import dynamic from 'next/dynamic'
import { Database } from '@/types/supabase'

// 🌟 これを追加！データベースの型に lat と lng を継ぎ足した「地図用トイレ型」
export type MapToilet = Database['public']['Tables']['toilets']['Row'] & {
  lat?: number
  lng?: number
}

const MapComponent = dynamic(() => import('./Map').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[70vh] min-h-[400px] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center text-gray-500">
      地図を読み込み中...
    </div>
  ),
})

export default function MapWrapper({ toilets }: { toilets: MapToilet[] }) {
  return <MapComponent toilets={toilets} />
}
