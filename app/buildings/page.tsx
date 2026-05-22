'use client'

import Link from 'next/link'
import { useState } from 'react'
import ToiletCard from '@/components/ToiletCard'

export default function BuildingsPage() {
  // 検索文字
  const [search, setSearch] = useState('')

  // ダミーデータ
  const toilets = [
    {
      id: 1,
      name: '工学部3号館 1F',
      rating: 4.3,
      washlet: true,
    },
    {
      id: 2,
      name: '全学教育棟 B館',
      rating: 4.0,
      washlet: false,
    },
    {
      id: 3,
      name: '中央図書館 2F',
      rating: 4.8,
      washlet: true,
    },
  ]

  // 検索処理
  const filteredToilets = toilets.filter((toilet) =>
    toilet.name.includes(search)
  )

  return (
    <div className="p-4">
      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-4">トイレ一覧</h1>

      {/* ページ移動 */}
      <Link href="/mypage" className="text-blue-500 underline">
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

      {/* トイレ一覧 */}
      <div className="space-y-4 mt-6">
        {filteredToilets.map((toilet) => (
          <ToiletCard
            key={toilet.id}
            name={toilet.name}
            rating={toilet.rating}
            washlet={toilet.washlet}
          />
        ))}
      </div>
    </div>
  )
}
