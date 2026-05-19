import Link from 'next/link'

import FavoriteCard from '@/components/FavoriteCard'
import ReviewCard from '@/components/ReviewCard'

export default function MyPage() {
  // お気に入りダミーデータ
  const favorites = [
    {
      id: 1,
      name: '工学部3号館 1F',
    },
    {
      id: 2,
      name: '中央図書館 2F',
    },
  ]

  // 口コミダミーデータ
  const reviews = [
    {
      id: 1,
      toilet: '工学部3号館 1F',
      rating: 5,
      comment: 'とても綺麗だった',
    },
    {
      id: 2,
      toilet: '全学教育棟 B館',
      rating: 4,
      comment: '少し混んでいた',
    },
  ]

  return (
    <div className="p-4">
      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-4">マイページ</h1>

      {/* ページ移動 */}
      <Link href="/buildings" className="text-blue-500 underline">
        トイレ一覧へ
      </Link>

      {/* お気に入り */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">お気に入り</h2>

        <div className="space-y-4">
          {favorites.map((favorite) => (
            <FavoriteCard key={favorite.id} name={favorite.name} />
          ))}
        </div>
      </div>

      {/* 口コミ履歴 */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">口コミ履歴</h2>

        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              toilet={review.toilet}
              rating={review.rating}
              comment={review.comment}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
