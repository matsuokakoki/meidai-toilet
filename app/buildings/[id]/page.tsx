'use client'

import { use, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { getToiletById } from '@/utils/supabase'

type Review = {
  id: string
  rating: number
  comment: string | null
}

type Toilet = {
  id: string
  name: string
  has_washlet: boolean | null
  is_gender_neutral: boolean | null
  western_style_count?: number | null
  japanese_style_count?: number | null
  reviews: Review[]
}

export default function ToiletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const router = useRouter()

  const [toilet, setToilet] = useState<Toilet | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchToilet() {
      const data = await getToiletById(id)

      setToilet(data)

      setLoading(false)
    }

    fetchToilet()
  }, [id])

  // ローディング
  if (loading) {
    return <p className="p-4">読み込み中...</p>
  }

  // データなし
  if (!toilet) {
    return <p className="p-4">トイレが見つかりません</p>
  }

  const averageRating =
    toilet.reviews.length > 0
      ? (
          toilet.reviews.reduce((sum, review) => sum + review.rating, 0) /
          toilet.reviews.length
        ).toFixed(1)
      : '0'

  return (
    <div className="p-4">
      {/* 戻る */}
      <button
        onClick={() => router.back()}
        className="
          text-blue-500
          underline
        "
      >
        ← 戻る
      </button>

      {/* タイトル */}
      <h1 className="text-3xl font-bold mt-4">{toilet.name}</h1>

      {/* 基本情報 */}
      <div className="mt-6 space-y-2">
        <p>平均評価： ★ {averageRating}</p>

        <p>
          ウォシュレット：
          {toilet.has_washlet ? 'あり' : 'なし'}
        </p>

        <p>
          多目的トイレ：
          {toilet.is_gender_neutral ? 'あり' : 'なし'}
        </p>

        <p>
          洋式：
          {toilet.western_style_count ?? 0}個
        </p>

        <p>
          和式：
          {toilet.japanese_style_count ?? 0}個
        </p>
      </div>

      {/* 口コミ */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">口コミ</h2>

        <div className="space-y-4">
          {toilet.reviews.length === 0 ? (
            <p>口コミなし</p>
          ) : (
            toilet.reviews.map((review) => (
              <div
                key={review.id}
                className="
                    border
                    rounded
                    p-4
                  "
              >
                <p>★ {review.rating}</p>

                <p className="mt-2">{review.comment ?? 'コメントなし'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}