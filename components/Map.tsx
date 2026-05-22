'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapToilet } from './MapWrapper' // 🌟 先ほど作った型を読み込む


// --- 外側：計算の「ルール（道具）」を定義 ---
// 三平方の定理を使って2点間の「平面的な距離」を計算します。
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dy = lat2 - lat1; // 緯度の差
  const dx = lng2 - lng1; // 経度の差
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)); // √ (x² + y²)
};

// 🌟 受け取るデータの型を MapToilet[] に変更！
export default function MapComponent({ toilets }: { toilets: MapToilet[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)


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

    // 🌟 ここから「現在地」の処理
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = position.coords
        setUserPos([longitude, latitude]) // 位置を保存する 
         // 1. 変数の用意
        let nearestId: string | number | null = null; // 一番近いトイレのIDを覚える箱
        let minDistance = Infinity; // 最小距離を記録する箱（最初は「無限大」を入れておく）
        toilets.forEach((toilet) => {
          if (toilet.lat === undefined || toilet.lng === undefined) return;

          const distance = getDistance(latitude, longitude, toilet.lat, toilet.lng); // 現在地とトイレの距離を計算
          if (distance < minDistance) { // もしこのトイレの方が近ければ
            minDistance = distance; // 最小距離を更新
            nearestId = toilet.id; // 一番近いトイレのIDを更新
          }
        });
        console.log('一番近いトイレのID:', nearestId); // 結果をコンソールに表示

        // 🌟 現在地用の「赤いピン」を作成して地図に追加
        // 今のコードにある「toilets.forEach...」と同じ書き方です！
        new maplibregl.Marker({ color: '#ff0000' }) // 自分は赤
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup().setHTML('現在地'))
          .addTo(map.current!) // ここで地図に追加

        // 🌟 地図の真ん中を現在地までスッと動かす（おまけ機能）
        map.current?.flyTo({ center: [longitude, latitude] })

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

            if (!toilet.lat || !toilet.lng) return;
            const isNearest = toilet.id === nearestId;
            const markerColor = isNearest ? '#ff9900' : '#3b82f6'; // 最寄りはオレンジ

          // マーカー（ピン）を生成して地図に追加
          new maplibregl.Marker({ color: markerColor }) // 爽やかなブルー
            .setLngLat([lng, lat]) // 経度(lng), 緯度(lat)の順！
            .setPopup(popup)
            .addTo(map.current!)
        })
      })
    }
  }, [toilets])


  return (
    // 地図を表示するための枠（サイズや角丸などをTailwindで指定）
    <div
      ref={mapContainer}
      className="w-full h-[70vh] min-h-[400px] rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden"
    />
  )
}
