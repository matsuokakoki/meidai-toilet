// src/app/page.tsx
import { supabase } from '@/utils/supabase'

export default async function Home() {
  // Supabaseから toilets テーブルのデータを全て取得
  const { data: toilets, error } = await supabase.from('toilets').select('*')

  if (error) {
    return <div className="p-4 text-red-500">エラー: {error.message}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🚽 名大トイレナビ（テスト接続）</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Supabaseから取得したデータ：</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(toilets, null, 2)}
        </pre>
      </div>
    </div>
  )
}