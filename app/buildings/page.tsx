"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import ToiletCard from "@/components/ToiletCard"

import { getToilets } from "@/utils/supabase"

type Toilet = {
  id: string
  name: string
  average_rating: number
  has_washlet: boolean | null
}

export default function BuildingsPage() {

  // 検索文字
  const [search, setSearch] = useState("")

  // トイレ一覧
  const [toilets, setToilets] = useState<Toilet[]>([])

  // 読み込み状態
  const [loading, setLoading] = useState(true)

  // 初回読み込み
  useEffect(() => {

    async function fetchToilets() {

      const data = await getToilets()

      setToilets(data)

      setLoading(false)
    }

    fetchToilets()

  }, [])

  // 検索
  const filteredToilets = toilets.filter((toilet) =>
    toilet.name.includes(search)
  )

  // 読み込み中
  if (loading) {
    return <p className="p-4">読み込み中...</p>
  }

  return (
    <div className="p-4">

      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-4">
        トイレ一覧
      </h1>

      {/* マイページリンク */}
      <Link
        href="/mypage"
        className="text-blue-500 underline"
      >
        マイページへ
      </Link>

      {/* 検索欄 */}
      <div className="mt-4">

        <input
          type="text"
          placeholder="トイレ検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full"
        />

      </div>

      {/* 一覧 */}
      <div className="space-y-4 mt-6">

        {filteredToilets.map((toilet) => (

          <ToiletCard
            key={toilet.id}
            id={toilet.id}
            name={toilet.name}
            rating={toilet.average_rating}
            washlet={toilet.has_washlet}
          />

        ))}

      </div>

    </div>
  )
}