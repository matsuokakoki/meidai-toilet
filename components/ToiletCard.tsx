'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  addFavorite,
  isFavorite,
  removeFavoriteByToilet,
} from '@/utils/supabase'

type ToiletCardProps = {
  id: string
  name: string
  rating: number
  washlet: boolean | null

  westernCount: number | null
  japaneseCount: number | null
}

export default function ToiletCard({
  id,
  name,
  rating,
  washlet,
  westernCount,
  japaneseCount,
}: ToiletCardProps) {
  const [favorite, setFavorite] = useState(false)

  useEffect(() => {
    async function checkFavorite() {
      const result = await isFavorite(id)

      setFavorite(result)
    }

    checkFavorite()
  }, [id])

  async function handleFavorite() {
    if (favorite) {
      const success = await removeFavoriteByToilet(id)

      if (success) {
        setFavorite(false)
      }

      return
    }

    const success = await addFavorite(id)

    if (success) {
      setFavorite(true)
    }
  }

  return (
    <div
      className="
        border
        rounded-lg
        p-4
        shadow
        bg-white
      "
    >
      <Link href={`/buildings/${id}`}>
        <div className="cursor-pointer">
          <h2 className="text-xl font-bold">{name}</h2>

          <p className="mt-2">評価：★ {rating.toFixed(1)}</p>

          <p>
            ウォシュレット：
            {washlet ? 'あり' : 'なし'}
          </p>

          <p>
            洋式：
            {westernCount ?? 0}個
          </p>

          <p>
            和式：
            {japaneseCount ?? 0}個
          </p>

          <p className="text-blue-500 underline mt-2">詳細を見る</p>
        </div>
      </Link>

      <button
        onClick={handleFavorite}
        className="
          mt-4
          px-4
          py-2
          rounded
          text-white
          bg-yellow-500
        "
      >
        {favorite ? 'お気に入り解除' : 'お気に入り追加'}
      </button>
    </div>
  )
}

// 'use client'

// import Link from 'next/link'
// import { useEffect, useState } from 'react'

// import {
//   addFavorite,
//   isFavorite,
//   removeFavoriteByToilet,
// } from '@/utils/supabase'

// type ToiletCardProps = {
//   id: string
//   name: string
//   rating: number
//   washlet: boolean | null
// }

// export default function ToiletCard({
//   id,
//   name,
//   rating,
//   washlet,
// }: ToiletCardProps) {
//   const [favorite, setFavorite] = useState(false)

//   useEffect(() => {
//     async function checkFavorite() {
//       const result = await isFavorite(id)

//       setFavorite(result)
//     }

//     checkFavorite()
//   }, [id])

//   async function handleFavorite() {
//     if (favorite) {
//       const success = await removeFavoriteByToilet(id)

//       if (success) {
//         setFavorite(false)
//       }

//       return
//     }

//     const success = await addFavorite(id)

//     if (success) {
//       setFavorite(true)
//     }
//   }

//   return (
//     <div
//       className="
//         border
//         rounded-lg
//         p-4
//         shadow
//         bg-white
//       "
//     >
//       <Link href={`/buildings/${id}`}>
//         <div className="cursor-pointer">
//           <h2 className="text-xl font-bold">{name}</h2>

//           <p className="mt-2">評価： ★ {rating.toFixed(1)}</p>

//           <p>
//             ウォシュレット：
//             {washlet ? 'あり' : 'なし'}
//           </p>

//           <p className="text-blue-500 underline mt-2">詳細を見る</p>
//         </div>
//       </Link>

//       <button
//         onClick={handleFavorite}
//         className="
//           mt-4
//           px-4
//           py-2
//           rounded
//           text-white
//           bg-yellow-500
//           disabled:bg-gray-400
//         "
//       >
//         {favorite ? 'お気に入り解除' : 'お気に入り追加'}
//       </button>
//     </div>
//   )
// }
