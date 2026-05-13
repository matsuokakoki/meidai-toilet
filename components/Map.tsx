'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapToilet } from './MapWrapper' // 🌟 先ほど作った型を読み込む

// 🌟 受け取るデータの型を MapToilet[] に変更！
export default function MapComponent({ toilets }: { toilets: MapToilet[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    // すでに地図が描画されていたら何もしない（Reactの2重描画防止）
    if (map.current || !mapContainer.current) return

    // 地図の初期化（名大の座標を中心に設定）
    const NU_CENTER: [number, number] = [136.9661, 35.1549]

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // 無料・登録不要で使えるOpenStreetMapのスタイルを利用
      style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      center: NU_CENTER,
      zoom: 15, // ズーム倍率（数字が大きいほど拡大）
    })

    // 右上にズームボタン（＋ー）を追加
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // データベースから取得したトイレデータの数だけピンを立てる
    toilets.forEach((toilet) => {
      // 🌟 Supabaseが自動計算してくれた lat と lng をそのまま使う！
      const lat = toilet.lat
      const lng = toilet.lng

      // 念のため、データがない場合はスキップ
      if (!lat || !lng) return

      // ピンをクリックした時に出る吹き出し（ポップアップ）を作成
      const popupHTML = `
        <div class="p-1">
          <h3 class="font-bold text-gray-800">${toilet.name}</h3>
          <p class="text-sm text-gray-600 mt-1">洋式: ${toilet.western_style_count} / 和式: ${toilet.japanese_style_count}</p>
        </div>
      `
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML)

      // マーカー（ピン）を生成して地図に追加
      new maplibregl.Marker({ color: '#3b82f6' }) // 爽やかなブルー
        .setLngLat([lng, lat]) // 経度(lng), 緯度(lat)の順！
        .setPopup(popup)
        .addTo(map.current!)
    })
  }, [toilets])

  return (
    // 地図を表示するための枠（サイズや角丸などをTailwindで指定）
    <div
      ref={mapContainer}
      className="w-full h-[70vh] min-h-[400px] rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden"
    />
  )
}
