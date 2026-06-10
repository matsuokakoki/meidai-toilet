import { supabase } from '@/utils/supabase'
import MapV4App from '@/components/MapV4App'
import type { SupabaseToiletWithReviews } from '@/components/ToiletMapApp'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: toilets, error } = await supabase
    .from('toilets')
    .select(
      '*, reviews(id, rating, cleanliness_rating, comment, user_id, created_at)'
    )

  if (error) {
    return (
      <div className="p-4 text-red-500">
        エラーが発生しました: {error.message}
      </div>
    )
  }

  const enriched: SupabaseToiletWithReviews[] = (toilets ?? []).map((t) => {
    const reviews = (t.reviews ?? []) as SupabaseToiletWithReviews['reviews']
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
        : 0
    return {
      ...t,
      average_rating: avg,
      review_count: reviews.length,
      reviews,
    } as SupabaseToiletWithReviews
  })

  return (
    <main style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <MapV4App toilets={enriched} />
    </main>
  )
}
