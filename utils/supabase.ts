// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// .env.local に設定したキーを読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// どこからでも使えるように export する
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function getToilets() {
  // toiletsテーブルから全データと、それに紐づくreviewsテーブルのrating（星）を一緒に取得
  const { data: toilets, error } = await supabase
    .from('toilets')
    .select('*, reviews(rating)')

  if (error) {
    console.error('トイレ取得エラー:', error)
    return []
  }

  // 取ってきたデータに「平均星評価」と「口コミ件数」を計算して合体させる
  const formattedToilets = toilets.map((toilet) => {
    // 紐づいている口コミの配列
    const reviews = toilet.reviews || []

    // 星評価の合計を計算
    const totalRating = reviews.reduce(
      (sum, review) => sum + (review.rating || 0),
      0
    )

    // 平均を計算（口コミが0件なら 0 にする）
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    return {
      ...toilet,
      average_rating: averageRating, // 🌟 これで「☆4.5以上」の絞り込みができる！
      review_count: reviews.length, // 🌟 「口コミ3件」などの表示に使える！
    }
  })

  return formattedToilets
}

/**
 * 2. 新しい口コミを投稿する関数（担当5向け）
 */
export async function addReview(
  toiletId: string,
  rating: number,
  cleanRating: number,
  comment: string
) {
  const { error } = await supabase.from('reviews').insert([
    {
      toilet_id: toiletId,
      user_id: 'local_user_1', // 本来はスマホ固有のIDなど。今回は仮置き
      rating: rating,
      cleanliness_rating: cleanRating,
      comment: comment,
    },
  ])

  if (error) {
    console.error('口コミ投稿エラー:', error)
    return false
  }
  return true
}
