'use client'

import { addFavorite } from '@/utils/supabase'

type ToiletCardProps = {
  id: string
  name: string
  rating: number
  washlet: boolean | null
}

export default function ToiletCard({
  id,
  name,
  rating,
  washlet,
}: ToiletCardProps) {
  return (
    <div className="border rounded p-4 shadow">
      {/* トイレ名 */}
      <h2 className="text-xl font-bold">{name}</h2>

      {/* 星評価 */}
      <p className="mt-2">⭐ {rating.toFixed(1)}</p>

      {/* ウォシュレット */}
      <p className="mt-1">
        {washlet ? 'ウォシュレットあり' : 'ウォシュレットなし'}
      </p>

      {/* お気に入りボタン */}
      <button
        onClick={async () => {
          const success = await addFavorite(id)

          if (success) {
            alert('お気に入り追加！')
          }
        }}
        className="mt-4 bg-pink-500 text-white px-4 py-2 rounded"
      >
        ❤️ お気に入り
      </button>
    </div>
  )
}
