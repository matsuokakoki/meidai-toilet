// utils/algorithm.ts

export type ToiletData = {
  id: string
  name: string
  western_style_count?: number | null
  japanese_style_count?: number | null
  urinal_count?: number | null
  gender?: string | null
  lat?: number | string | null // 🌟 修正：number を追加
  lng?: number | string | null // 🌟 修正：number を追加
  average_rating?: number | null
  review_count?: number | null
  floor?: number | null
  opening_hours?: string | null
  has_washlet?: boolean | null
  has_otohime?: boolean | null
  is_multipurpose?: boolean | null
  is_gender_neutral?: boolean | null
}

// 🌟 混雑地点（ホットスポット）を管理する型と配列
export type CongestionHotspot = {
  name: string // 管理用の名前（例: "全学教育棟"）
  lat: number // 緯度
  lng: number // 経度
  radiusM: number // 影響を与える半径（メートル）
  maxScore: number // 中心地点での最大混雑度アップ量
  activeStartTime?: number // 例: 1130 (11時30分スタート)
  activeEndTime?: number // 例: 1330 (13時30分終了)
}

// 🌟 ここに混雑する場所をいくつでも追加・変更できます！
export const HOTSPOTS: CongestionHotspot[] = [
  {
    name: '全学教育棟',
    lat: 35.15438129958642,
    lng: 136.96258674355286,
    radiusM: 75,
    maxScore: 20,
    activeStartTime: 1000,
    activeEndTime: 1630,
  },
  {
    name: '北部食堂',
    lat: 35.1562149936452,
    lng: 136.96610859165958,
    radiusM: 30,
    maxScore: 30,
    activeStartTime: 1130,
    activeEndTime: 1330,
  },
  {
    name: '北部食堂 (夜)',
    lat: 35.1562149936452,
    lng: 136.96610859165958,
    radiusM: 30,
    maxScore: 30,
    activeStartTime: 1700,
    activeEndTime: 1900,
  },
  {
    name: '南部食堂',
    lat: 35.15332378570869,
    lng: 136.96267971423129,
    radiusM: 35,
    maxScore: 30,
    activeStartTime: 1145,
    activeEndTime: 1240,
  },
  {
    name: 'コモネ東',
    lat: 35.15429439127925,
    lng: 136.96565273546037,
    radiusM: 40,
    maxScore: 20,
    activeStartTime: 900,
    activeEndTime: 1700,
  },
  {
    name: 'コモネ西',
    lat: 35.15459030510764,
    lng: 136.96487146912142,
    radiusM: 40,
    maxScore: 20,
    activeStartTime: 900,
    activeEndTime: 1700,
  },
  {
    name: '図書館',
    lat: 35.15510662051771,
    lng: 136.9637812581192,
    radiusM: 30,
    maxScore: 15,
    activeStartTime: 1015,
    activeEndTime: 1430,
  },
  {
    name: '駅',
    lat: 35.15400309655455,
    lng: 136.9665380545961,
    radiusM: 40,
    maxScore: 40,
    activeStartTime: 830,
    activeEndTime: 900,
  },
]

/**
 * トイレの設備と現在の時間から、0〜100の混雑度を計算する関数
 */
export function calculateCongestion(
  toilet: ToiletData,
  hour: number,
  weather: string = 'Sunny'
): number {
  let score: number = 0 // 基準となる初期混雑度（20%）

  const times: number = hour * 100 // 例: 12.45 なら 1245 になる

  // ==========================================
  // 🌟 追加：営業時間による強制0点ロジック
  // ==========================================
  const hoursStr = toilet.opening_hours || '24h'
  let isOpen = true

  // "24h" や "不明" など特殊な記述ではない場合、時間を解析する
  if (hoursStr !== '24h' && !hoursStr.includes('不明')) {
    // 例: "09:00-21:00" または "07:00 - 23:00" から数字を抽出
    const match = hoursStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
    if (match) {
      // 抽出した時間を 900 や 2100 のような比較しやすい数値形式に変換
      const startTime = parseInt(match[1], 10) * 100 + parseInt(match[2], 10)
      const endTime = parseInt(match[3], 10) * 100 + parseInt(match[4], 10)

      // スライダーの時間(times)が、営業時間外なら「閉まっている」と判定
      if (times < startTime || times >= endTime) {
        isOpen = false
      }
    }
  }

  // もし閉まっている時間帯なら、これ以降の計算はせずに即座に 0 を返す！
  if (!isOpen) {
    return 0
  }
  // ==========================================

  const now = new Date()

  // 日本語ロケールでフォーマットオプションを指定（日付や曜日の判定用）
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = formatter.formatToParts(now)
  const year2 = parts.find((part) => part.type === 'year')?.value
  const month2 = parts.find((part) => part.type === 'month')?.value
  const day2 = parts.find((part) => part.type === 'day')?.value
  const weekday2 = parts.find((part) => part.type === 'weekday')?.value

  let timescore: number = 40
  if (times < 600) {
    timescore = -1000
  } else if (times < 800) {
    timescore = -20
  } else if (times < 830) {
    timescore = -10
  } else if (times <= 845) {
    timescore = 12
  } else if (times < 1015) {
    timescore = 6
  } else if (times <= 1030) {
    timescore = 30
  } else if (times < 1200) {
    timescore = 15
  } else if (times <= 1245) {
    timescore = 20
  } else if (times <= 1300) {
    timescore = 40
  } else if (times < 1430) {
    timescore = 12
  } else if (times <= 1445) {
    timescore = 40
  } else if (times < 1615) {
    timescore = 12
  } else if (times <= 1630) {
    timescore = 20
  } else if (times <= 1800) {
    timescore = 4
  } else if (times < 1900) {
    timescore = -10
  } else if (times < 2000) {
    timescore = -20
  } else {
    timescore = -1000
  }

  if (year2 == '2026' && month2 == '6' && (day2 == '13' || day2 == '14')) {
    timescore *= 1.5
  } else if (weekday2 == '土' || weekday2 == '日') {
    timescore *= 0.25
  }

  // 設備による分析
  let Setubisore: number = 30

  // ② 設備数による減算ロジック（個数が多いほど行列ができにくい）
  const wCount = toilet.western_style_count || 0
  const jCount = toilet.japanese_style_count || 0
  //const uCount = toilet.urinal_count || 0

  Setubisore -= wCount * 3 + jCount * 2 * 0.5
  const isfemale = toilet.gender || 0
  if (isfemale == 'women') {
    Setubisore *= 1.25
  }

  // ==========================================
  // ③ 場所による分析（複数のホットスポットに対応！）
  // ==========================================
  let LocationScore: number = 0

  const tLat = Number(toilet.lat)
  const tLng = Number(toilet.lng)

  // 座標が正しく取得できている場合のみ計算
  if (!isNaN(tLat) && !isNaN(tLng) && tLat !== 0 && tLng !== 0) {
    // 登録されている全てのホットスポットに対して距離を計算する
    for (const hotspot of HOTSPOTS) {
      // ホットスポットの有効時間が設定されている場合は時間チェック
      if (
        hotspot.activeStartTime !== undefined &&
        hotspot.activeEndTime !== undefined
      ) {
        if (times < hotspot.activeStartTime || times > hotspot.activeEndTime) {
          continue // 時間外ならスキップ
        }
      }

      const distance = getDistanceFromLatLonInM(
        hotspot.lat,
        hotspot.lng,
        tLat,
        tLng
      )

      if (distance <= hotspot.radiusM) {
        // そのホットスポットによるスコアを計算（中心に近いほど高い）
        const currentHotspotScore =
          hotspot.maxScore * (1 - distance / hotspot.radiusM)

        // 🌟 もし複数の混雑エリアが重なっている場合は、一番高いスコアを採用する
        if (currentHotspotScore > LocationScore) {
          LocationScore = currentHotspotScore
        }
      }
    }
  }

  //階数による比較
  let floorscore: number = 0
  const floors: number = Number(toilet.floor)
  if (floors <= 1) {
    floorscore = 10
  } else if (floors <= 3) {
    floorscore = 8
  } else if (floors <= 4) {
    floorscore = 5
  } else {
    floorscore = 10 - floors
  }

  // ==========================================
  // ④ 天気による分析（MAX 10点）
  // ==========================================
  let WeatherScore: number = 10 // 基本は晴れ（人が多いので+10点）

  const w = weather.toLowerCase()
  if (w.includes('rain') || w.includes('雨')) {
    WeatherScore = 0 // 雨の日はキャンパスに来る人が減るため、混雑度が上がらない（0点）
  } else if (w.includes('cloud') || w.includes('曇')) {
    WeatherScore = 5 // 曇りは中間
  }

  // ==========================================
  // ⑤ レビュー（綺麗さ・星評価）による分析（MAX 10点）
  // ==========================================
  let ReviewScore: number = 5 // レビューがない場合の標準値（中間）

  // utils/supabase.ts の getToilets 関数で作った average_rating を利用
  const avgRating = toilet.average_rating

  if (avgRating !== undefined && avgRating !== null && avgRating > 0) {
    // 星1〜5 の評価を、0点〜10点 に変換する計算式
    // (例: 星5なら10点、星3なら5点、星1なら0点)
    ReviewScore = ((avgRating - 1) / 4) * 10
  }

  score =
    timescore +
    Setubisore +
    LocationScore +
    WeatherScore +
    ReviewScore +
    floorscore

  // ③ 最終的なスコアを 0 〜 100 の間に収める（Clamp処理）
  return parseFloat(Math.max(0, Math.min(100, score)).toFixed(2))
}

/**
 * 混雑度（0〜100）に応じて、UI表示用の「色」と「テキスト」を返す便利関数
 */
export function getCongestionStatus(score: number) {
  if (score >= 80)
    return { text: '激混み', color: 'text-red-600', bg: 'bg-red-100' }
  if (score >= 50)
    return { text: 'やや混雑', color: 'text-orange-600', bg: 'bg-orange-100' }
  if (score === 0)
    return { text: '空き/閉館', color: 'text-blue-600', bg: 'bg-blue-100' } // 🌟 0%の時のテキストを微調整
  return { text: '空きあり', color: 'text-green-600', bg: 'bg-green-100' }
}

/**
 * 【補助関数】2つの緯度・経度から、距離（メートル）を計算する関数 (Haversine公式)
 */
export function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R: number = 6371000 // 地球の半径 (メートル)
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
