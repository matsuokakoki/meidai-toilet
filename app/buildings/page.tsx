'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import ToiletCard from '@/components/ToiletCard'

import { getToilets } from '@/utils/supabase'

type Toilet = {
  id: string
  name: string
  average_rating: number
  review_count: number
  has_washlet: boolean | null
  is_gender_neutral: boolean | null

  western_count?: number | null
  japanese_count?: number | null
}

export default function BuildingsPage() {
  // 検索
  const [search, setSearch] = useState('')

  // トイレ一覧
  const [toilets, setToilets] = useState<Toilet[]>([])

  // 読み込み
  const [loading, setLoading] = useState(true)

  // ウォシュレット
  const [washletOnly, setWashletOnly] = useState(false)

  // 多目的
  const [universalOnly, setUniversalOnly] = useState(false)

  // 洋式数
  const [westernCount, setWesternCount] = useState(0)

  // 和式数
  const [japaneseCount, setJapaneseCount] = useState(0)

  // 星
  const [minimumRating, setMinimumRating] = useState(0)

  // 初回読み込み
  useEffect(() => {
    async function fetchToilets() {
      const data = await getToilets()

      setToilets(data)

      setLoading(false)
    }

    fetchToilets()
  }, [])

  // フィルター
  const filteredToilets = toilets.filter((toilet) => {
    // 検索
    const matchesSearch = toilet.name.includes(search)

    // ウォシュレット
    const matchesWashlet = !washletOnly || toilet.has_washlet

    // 多目的
    const matchesUniversal = !universalOnly || toilet.is_gender_neutral

    // 洋式
    const matchesWestern = (toilet.western_count ?? 0) >= westernCount

    // 和式
    const matchesJapanese = (toilet.japanese_count ?? 0) >= japaneseCount

    // 星
    const matchesRating = toilet.average_rating >= minimumRating

    return (
      matchesSearch &&
      matchesWashlet &&
      matchesUniversal &&
      matchesWestern &&
      matchesJapanese &&
      matchesRating
    )
  })

  // 読み込み中
  if (loading) {
    return <p className="p-4">読み込み中...</p>
  }

  return (
    <div className="p-4">
      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-4">トイレ一覧</h1>

      {/* マイページリンク */}
      <Link href="/mypage" className="text-blue-500 underline">
        マイページへ
      </Link>

      {/* 検索 */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="トイレ検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* フィルター */}
      <div className="mt-4 space-y-4">
        {/* 星 */}
        <div>
          <p className="font-bold mb-1">星評価</p>

          <select
            value={minimumRating}
            onChange={(e) => setMinimumRating(Number(e.target.value))}
            className="border p-2 rounded w-full"
          >
            <option value={0}>指定なし</option>

            <option value={1}>★1以上</option>

            <option value={2}>★2以上</option>

            <option value={3}>★3以上</option>

            <option value={4}>★4以上</option>

            <option value={5}>★5のみ</option>
          </select>
        </div>

        {/* 洋式 */}
        <div>
          <p className="font-bold mb-1">洋式の数</p>

          <select
            value={westernCount}
            onChange={(e) => setWesternCount(Number(e.target.value))}
            className="border p-2 rounded w-full"
          >
            <option value={0}>指定なし</option>

            <option value={1}>1個以上</option>

            <option value={2}>2個以上</option>

            <option value={3}>3個以上</option>
          </select>
        </div>

        {/* 和式 */}
        <div>
          <p className="font-bold mb-1">和式の数</p>

          <select
            value={japaneseCount}
            onChange={(e) => setJapaneseCount(Number(e.target.value))}
            className="border p-2 rounded w-full"
          >
            <option value={0}>指定なし</option>

            <option value={1}>1個以上</option>

            <option value={2}>2個以上</option>

            <option value={3}>3個以上</option>
          </select>
        </div>

        {/* ウォシュレット */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={washletOnly}
            onChange={(e) => setWashletOnly(e.target.checked)}
          />
          ウォシュレットあり
        </label>

        {/* 多目的 */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={universalOnly}
            onChange={(e) => setUniversalOnly(e.target.checked)}
          />
          多目的あり
        </label>
      </div>

      {/* 一覧 */}
      <div className="space-y-4 mt-6">
        {filteredToilets.map((toilet) => (
          <ToiletCard
            key={toilet.id}
            id={toilet.id}
            name={toilet.name}
            rating={toilet.average_rating}
            washlet={toilet.has_washlet ?? false}
          />
        ))}
      </div>
    </div>
  )
}

// "use client"

// import Link from "next/link"
// import { useEffect, useState } from "react"

// import ToiletCard from "@/components/ToiletCard"

// import { getToilets } from "@/utils/supabase"

// type Toilet = {
//   id: string
//   name: string
//   average_rating: number
//   review_count: number
//   has_washlet: boolean | null
//   is_gender_neutral: boolean | null
//   western_count: number
//   japanese_count: number
// }

// export default function BuildingsPage() {

//   // 検索
//   const [search, setSearch] = useState("")

//   // トイレ一覧
//   const [toilets, setToilets] = useState<Toilet[]>([])

//   // 読み込み
//   const [loading, setLoading] = useState(true)

//   // ウォシュレット
//   const [washletOnly, setWashletOnly] =
//     useState(false)

//   // 多目的
//   const [universalOnly, setUniversalOnly] =
//     useState(false)

//   // 洋式数
//   const [westernCount, setWesternCount] =
//     useState(0)

//   // 和式数
//   const [japaneseCount, setJapaneseCount] =
//     useState(0)

//   // 星
//   const [minimumRating, setMinimumRating] =
//     useState(0)

//   // 初回読み込み
//   useEffect(() => {

//     async function fetchToilets() {

//       const data = await getToilets()

//       setToilets(data)

//       setLoading(false)
//     }

//     fetchToilets()

//   }, [])

//   // フィルター
//   const filteredToilets = toilets.filter(
//     (toilet) => {

//       // 検索
//       const matchesSearch =
//         toilet.name.includes(search)

//       // ウォシュレット
//       const matchesWashlet =
//         !washletOnly ||
//         toilet.has_washlet

//       // 多目的
//       const matchesUniversal =
//         !universalOnly ||
//         toilet.is_gender_neutral

//       // 洋式
//       const matchesWestern =
//         toilet.western_count >=
//         westernCount

//       // 和式
//       const matchesJapanese =
//         toilet.japanese_count >=
//         japaneseCount

//       // 星
//       const matchesRating =
//         toilet.average_rating >=
//         minimumRating

//       return (
//         matchesSearch &&
//         matchesWashlet &&
//         matchesUniversal &&
//         matchesWestern &&
//         matchesJapanese &&
//         matchesRating
//       )
//     }
//   )

//   // 読み込み中
//   if (loading) {
//     return (
//       <p className="p-4">
//         読み込み中...
//       </p>
//     )
//   }

//   return (

//     <div className="p-4">

//       {/* タイトル */}
//       <h1 className="text-3xl font-bold mb-4">
//         トイレ一覧
//       </h1>

//       {/* マイページリンク */}
//       <Link
//         href="/mypage"
//         className="text-blue-500 underline"
//       >
//         マイページへ
//       </Link>

//       {/* 検索 */}
//       <div className="mt-4">

//         <input
//           type="text"
//           placeholder="トイレ検索"
//           value={search}
//           onChange={(e) =>
//             setSearch(e.target.value)
//           }
//           className="border p-2 rounded w-full"
//         />

//       </div>

//       {/* フィルター */}
//       <div className="mt-4 space-y-4">

//         {/* 星 */}
//         <div>

//           <p className="font-bold mb-1">
//             星評価
//           </p>

//           <select
//             value={minimumRating}
//             onChange={(e) =>
//               setMinimumRating(
//                 Number(e.target.value)
//               )
//             }
//             className="border p-2 rounded w-full"
//           >

//             <option value={0}>
//               指定なし
//             </option>

//             <option value={1}>
//               ★1以上
//             </option>

//             <option value={2}>
//               ★2以上
//             </option>

//             <option value={3}>
//               ★3以上
//             </option>

//             <option value={4}>
//               ★4以上
//             </option>

//             <option value={5}>
//               ★5のみ
//             </option>

//           </select>

//         </div>

//         {/* 洋式 */}
//         <div>

//           <p className="font-bold mb-1">
//             洋式の数
//           </p>

//           <select
//             value={westernCount}
//             onChange={(e) =>
//               setWesternCount(
//                 Number(e.target.value)
//               )
//             }
//             className="border p-2 rounded w-full"
//           >

//             <option value={0}>
//               指定なし
//             </option>

//             <option value={1}>
//               1個以上
//             </option>

//             <option value={2}>
//               2個以上
//             </option>

//             <option value={3}>
//               3個以上
//             </option>

//           </select>

//         </div>

//         {/* 和式 */}
//         <div>

//           <p className="font-bold mb-1">
//             和式の数
//           </p>

//           <select
//             value={japaneseCount}
//             onChange={(e) =>
//               setJapaneseCount(
//                 Number(e.target.value)
//               )
//             }
//             className="border p-2 rounded w-full"
//           >

//             <option value={0}>
//               指定なし
//             </option>

//             <option value={1}>
//               1個以上
//             </option>

//             <option value={2}>
//               2個以上
//             </option>

//             <option value={3}>
//               3個以上
//             </option>

//           </select>

//         </div>

//         {/* ウォシュレット */}
//         <label className="flex items-center gap-2">

//           <input
//             type="checkbox"
//             checked={washletOnly}
//             onChange={(e) =>
//               setWashletOnly(
//                 e.target.checked
//               )
//             }
//           />

//           ウォシュレットあり

//         </label>

//         {/* 多目的 */}
//         <label className="flex items-center gap-2">

//           <input
//             type="checkbox"
//             checked={universalOnly}
//             onChange={(e) =>
//               setUniversalOnly(
//                 e.target.checked
//               )
//             }
//           />

//           多目的あり

//         </label>

//       </div>

//       {/* 一覧 */}
//       <div className="space-y-4 mt-6">

//         {filteredToilets.map((toilet) => (

//           <ToiletCard
//             key={toilet.id}
//             id={toilet.id}
//             name={toilet.name}
//             rating={toilet.average_rating}
//             washlet={toilet.has_washlet ?? false}
//           />

//         ))}

//       </div>

//     </div>
//   )
// }

// // 'use client'

// // import Link from 'next/link'
// // import { useEffect, useState } from 'react'

// // import ToiletCard from '@/components/ToiletCard'

// // import { getToilets } from '@/utils/supabase'

// // type Toilet = {
// //   id: string
// //   name: string
// //   average_rating: number
// //   has_washlet: boolean | null
// // }

// // export default function BuildingsPage() {
// //   // 検索文字
// //   const [search, setSearch] = useState('')

// //   // トイレ一覧
// //   const [toilets, setToilets] = useState<Toilet[]>([])

// //   // 読み込み状態
// //   const [loading, setLoading] = useState(true)

// //   // 初回読み込み
// //   useEffect(() => {
// //     async function fetchToilets() {
// //       const data = await getToilets()

// //       setToilets(data)

// //       setLoading(false)
// //     }

// //     fetchToilets()
// //   }, [])

// //   // 検索
// //   const filteredToilets = toilets.filter((toilet) =>
// //     toilet.name.includes(search)
// //   )

// //   // 読み込み中
// //   if (loading) {
// //     return <p className="p-4">読み込み中...</p>
// //   }

// //   return (
// //     <div className="p-4">
// //       {/* タイトル */}
// //       <h1 className="text-3xl font-bold mb-4">トイレ一覧</h1>

// //       {/* マイページリンク */}
// //       <Link href="/mypage" className="text-blue-500 underline">
// //         マイページへ
// //       </Link>

// //       {/* 検索欄 */}
// //       <div className="mt-4">
// //         <input
// //           type="text"
// //           placeholder="トイレ検索"
// //           value={search}
// //           onChange={(e) => setSearch(e.target.value)}
// //           className="border p-2 rounded w-full"
// //         />
// //       </div>

// //       {/* 一覧 */}
// //       <div className="space-y-4 mt-6">
// //         {filteredToilets.map((toilet) => (
// //           <ToiletCard
// //             key={toilet.id}
// //             id={toilet.id}
// //             name={toilet.name}
// //             rating={toilet.average_rating}
// //             washlet={toilet.has_washlet}
// //           />
// //         ))}
// //       </div>
// //     </div>
// //   )
// // }
