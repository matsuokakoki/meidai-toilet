import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'
import { getUserId } from './user'

// .env.local に設定したキーを読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabase接続
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * 1. トイレ一覧取得
 */
export async function getToilets() {
  // toiletsテーブル + reviews取得
  const { data: toilets, error } = await supabase
    .from('toilets')
    .select('*, reviews(rating)')

  if (error) {
    console.error('トイレ取得エラー:', error)
    return []
  }

  // 平均評価計算
  const formattedToilets = toilets.map((toilet) => {
    const reviews = toilet.reviews || []

    const totalRating = reviews.reduce(
      (sum, review) => sum + (review.rating || 0),
      0
    )

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    return {
      ...toilet,
      average_rating: averageRating,
      review_count: reviews.length,
    }
  })

  return formattedToilets
}

/**
 * 2. 口コミ投稿
 */

export async function addReview(
  toiletId: string,
  rating: number,
  cleanRating: number,
  comment: string
) {
  const userId = getUserId()

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', fiveMinutesAgo)

  if (recentReviews && recentReviews.length > 0) {
    alert('5分以内は再投稿できません')
    return false
  }

  const { error } = await supabase.from('reviews').insert([
    {
      toilet_id: toiletId,
      user_id: userId,
      rating,
      cleanliness_rating: cleanRating,
      comment,
    },
  ])

  if (error) {
    console.error('口コミ投稿エラー:', error)
    return false
  }

  return true
}

/**
 * 3. お気に入り追加
 */

export async function addFavorite(toiletId: string) {
  const userId = getUserId()

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('toilet_id', toiletId)

  if (data && data.length > 0) {
    return true
  }

  const { error } = await supabase.from('favorites').insert([
    {
      user_id: userId,
      toilet_id: toiletId,
    },
  ])

  if (error) {
    console.error('お気に入り追加エラー:', error)
    return false
  }

  return true
}

/**
 * 4. お気に入り取得
 */
export async function getFavorites() {
  const userId = getUserId()

  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
      id,
      toilets (
        id,
        name
      )
    `
    )
    .eq('user_id', userId)

  if (error) {
    console.error('お気に入り取得エラー:', error)
    return []
  }

  return data
}

export async function getMyReviews() {
  const userId = getUserId()

  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      id,
      rating,
      comment,
      toilets (
        name
      )
    `
    )
    .eq('user_id', userId)

  if (error) {
    console.error('口コミ取得エラー:', error)
    return []
  }

  return data
}

/**
 * 5. お気に入り削除
 */
export async function removeFavorite(favoriteId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('id', favoriteId)

  if (error) {
    console.error('お気に入り削除エラー:', error)
    return false
  }

  return true
}

/**
 * 6. 口コミ削除
 */
export async function deleteReview(reviewId: string) {
  const userId = getUserId()

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)

  if (error) {
    console.error('口コミ削除エラー:', error)
    return false
  }

  return true
}

export async function getToiletById(id: string) {
  const { data, error } = await supabase
    .from('toilets')
    .select(
      `
      *,
      reviews (
        id,
        rating,
        comment
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('トイレ詳細取得エラー:', error)
    return null
  }

  return data
}

export async function isFavorite(toiletId: string) {
  const userId = getUserId()

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('toilet_id', toiletId)

  if (error) {
    return false
  }

  return data.length > 0
}

export async function removeFavoriteByToilet(toiletId: string) {
  const userId = getUserId()

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('toilet_id', toiletId)

  if (error) {
    console.error('お気に入り削除エラー:', error)
    return false
  }

  return true
}
