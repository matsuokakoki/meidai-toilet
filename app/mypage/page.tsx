"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import FavoriteCard from "@/components/FavoriteCard"
import ReviewCard from "@/components/ReviewCard"

import {
  getFavorites,
  getMyReviews,
  addReview,
  getToilets,
  removeFavorite,
  deleteReview,
} from "@/utils/supabase"

type Favorite = {
  id: string
  toilets: {
    name: string
  }
}

type Review = {
  id: string
  rating: number
  comment: string | null
  toilets: {
    name: string
  }
}

type Toilet = {
  id: string
  name: string
}

export default function MyPage() {

  // お気に入り
  const [favorites, setFavorites] = useState<Favorite[]>([])

  // 口コミ履歴
  const [reviews, setReviews] = useState<Review[]>([])

  // トイレ一覧
  const [toilets, setToilets] = useState<Toilet[]>([])

  // 投稿用
  const [selectedToilet, setSelectedToilet] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  // 初回読み込み
  useEffect(() => {

    async function fetchData() {

      // お気に入り取得
      const favoriteData = await getFavorites()

      setFavorites(favoriteData)

      // 口コミ取得
      const reviewData = await getMyReviews()

      setReviews(reviewData)

      // トイレ一覧取得
      const toiletData = await getToilets()

      setToilets(toiletData)
    }

    fetchData()

  }, [])

  /**
   * 口コミ投稿
   */
  async function handleSubmitReview() {

    if (!selectedToilet) {
      alert("トイレを選択してください")
      return
    }

    const success = await addReview(
      selectedToilet,
      rating,
      rating,
      comment
    )

    if (success) {

      alert("口コミ投稿完了！")

      // 再取得
      const reviewData = await getMyReviews()

      setReviews(reviewData)

      // リセット
      setSelectedToilet("")
      setRating(5)
      setComment("")
    }
  }

  /**
   * お気に入り削除
   */
  async function handleRemoveFavorite(
    favoriteId: string
  ) {

    const success = await removeFavorite(
      favoriteId
    )

    if (success) {

      const favoriteData = await getFavorites()

      setFavorites(favoriteData)
    }
  }

  /**
   * 口コミ削除
   */
  async function handleDeleteReview(
    reviewId: string
  ) {

    const success = await deleteReview(
      reviewId
    )

    if (success) {

      const reviewData = await getMyReviews()

      setReviews(reviewData)
    }
  }

  return (

    <div className="p-4">

      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-4">
        マイページ
      </h1>

      {/* 一覧ページへ */}
      <Link
        href="/buildings"
        className="text-blue-500 underline"
      >
        トイレ一覧へ
      </Link>

      {/* お気に入り */}
      <div className="mt-8">

        <h2 className="text-2xl font-bold mb-4">
          お気に入り
        </h2>

        <div className="space-y-4">

          {favorites.length === 0 ? (

            <p>お気に入りがありません</p>

          ) : (

            favorites.map((favorite) => (

              <div
                key={favorite.id}
                className="flex items-center justify-between border p-4 rounded"
              >

                <FavoriteCard
                  name={favorite.toilets.name}
                />

                <button
                  onClick={() =>
                    handleRemoveFavorite(
                      favorite.id
                    )
                  }
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  削除
                </button>

              </div>

            ))

          )}

        </div>

      </div>

      {/* 口コミ投稿 */}
      <div className="mt-10">

        <h2 className="text-2xl font-bold mb-4">
          口コミ投稿
        </h2>

        <div className="space-y-4">

          {/* トイレ選択 */}
          <select
            value={selectedToilet}
            onChange={(e) =>
              setSelectedToilet(e.target.value)
            }
            className="border p-2 rounded w-full"
          >

            <option value="">
              トイレを選択
            </option>

            {toilets.map((toilet) => (

              <option
                key={toilet.id}
                value={toilet.id}
              >
                {toilet.name}
              </option>

            ))}

          </select>

          {/* 評価 */}
          <div>

            <p className="mb-2">
              評価（1〜5）
            </p>

            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) =>
                setRating(Number(e.target.value))
              }
              className="border p-2 rounded w-full"
            />

          </div>

          {/* コメント */}
          <textarea
            placeholder="口コミを書く"
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            className="border p-2 rounded w-full"
          />

          {/* 投稿ボタン */}
          <button
            onClick={handleSubmitReview}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            投稿
          </button>

        </div>

      </div>

      {/* 口コミ履歴 */}
      <div className="mt-10">

        <h2 className="text-2xl font-bold mb-4">
          口コミ履歴
        </h2>

        <div className="space-y-4">

          {reviews.length === 0 ? (

            <p>口コミがありません</p>

          ) : (

            reviews.map((review) => (

              <div
                key={review.id}
                className="border p-4 rounded"
              >

                <ReviewCard
                  toilet={review.toilets.name}
                  rating={review.rating}
                  comment={
                    review.comment ??
                    "コメントなし"
                  }
                />

                <button
                  onClick={() =>
                    handleDeleteReview(
                      review.id
                    )
                  }
                  className="bg-red-500 text-white px-3 py-1 rounded mt-2"
                >
                  削除
                </button>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  )
}