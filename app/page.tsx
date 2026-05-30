// app/page.tsx
// app/page.tsx (上部のimport部分)
import { supabase } from '@/utils/supabase'
import MapWrapper, { MapToilet } from '@/components/MapWrapper' // 🌟 型も一緒に読み込む

export default async function Home() {
  // 1. サーバー側でSupabaseからトイレ一覧を取得する
  const { data: toilets, error } = await supabase.from('toilets').select('*')

  if (error) {
    return (
      <div className="p-4 text-red-500">
        エラーが発生しました: {error.message}
      </div>
    )
  }

  // 2. 取得したデータをクライアントに渡す
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            🚽 名大トイレナビ
          </h1>
          <p className="text-gray-500 mt-1">
            一番近くて綺麗なトイレを瞬時に見つける
          </p>
        </header>

        {/* 🌟 as any をやめて、as unknown as MapToilet[] という正しい変換ルールにする！ */}
        <MapWrapper toilets={(toilets as unknown as MapToilet[]) || []} />
      </div>
    </main>
  )
}
