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
}

export default function ToiletCard({
  id,
  name,
  rating,
  washlet,
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

          <p className="mt-2">評価： ★ {rating.toFixed(1)}</p>

          <p>
            ウォシュレット：
            {washlet ? 'あり' : 'なし'}
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
          disabled:bg-gray-400
        "
      >
        {favorite ? 'お気に入り解除' : 'お気に入り追加'}
      </button>
    </div>
  )
}

// "use client"

// import Link from "next/link"
// import { addFavorite } from "@/utils/supabase"

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

//   async function handleFavorite() {

//     const success = await addFavorite(id)

//     if (success) {
//       alert("お気に入りに追加しました")
//     } else {
//       alert("お気に入り追加に失敗しました")
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

//       {/* 詳細ページへのリンク */}
//       <Link href={`/buildings/${id}`}>

//         <div className="cursor-pointer">

//           <h2 className="text-xl font-bold">
//             {name}
//           </h2>

//           <p className="mt-2">
//             評価：
//             ★ {rating.toFixed(1)}
//           </p>

//           <p>
//             ウォシュレット：
//             {washlet ? "あり" : "なし"}
//           </p>

//           <p className="text-blue-500 underline mt-2">
//             詳細を見る
//           </p>

//         </div>

//       </Link>

//       {/* お気に入りボタン */}
//       <button
//         onClick={handleFavorite}
//         className="
//           mt-4
//           bg-yellow-500
//           text-white
//           px-4
//           py-2
//           rounded
//         "
//       >
//         お気に入り追加
//       </button>

//     </div>
//   )
// }

// 'use client'

// import { addFavorite } from '@/utils/supabase'

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
//   return (
//     <div className="border rounded p-4 shadow">
//       {/* トイレ名 */}
//       <h2 className="text-xl font-bold">{name}</h2>

//       {/* 星評価 */}
//       <p className="mt-2">⭐ {rating.toFixed(1)}</p>

//       {/* ウォシュレット */}
//       <p className="mt-1">
//         {washlet ? 'ウォシュレットあり' : 'ウォシュレットなし'}
//       </p>

//       {/* お気に入りボタン */}
//       <button
//         onClick={async () => {
//           const success = await addFavorite(id)

//           if (success) {
//             alert('お気に入り追加！')
//           }
//         }}
//         className="mt-4 bg-pink-500 text-white px-4 py-2 rounded"
//       >
//         ❤️ お気に入り
//       </button>
//     </div>
//   )
// }
