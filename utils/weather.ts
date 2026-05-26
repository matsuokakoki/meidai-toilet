// utils/weather.ts

/**
 * Open-Meteo API（キー不要）を叩いて、現在の名大キャンパスの天気を取得する関数
 * 返り値: 'Sunny' | 'Cloudy' | 'Rain'
 */
export async function fetchCurrentWeather(): Promise<string> {
  // 名古屋大学（全学教育棟付近）の座標
  const lat = 35.1543
  const lon = 136.9625

  try {
    // 🌟 変更：APIキー不要の「Open-Meteo」のURLを使用
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FTokyo`
    const res = await fetch(url)

    if (!res.ok) {
      throw new Error('天気の取得に失敗しました')
    }

    const data = await res.json()

    // Open-Meteoは、天気を「WMO weather code (0〜99の数字)」で返してきます
    const weatherCode = data.current_weather.weathercode

    // 天気コードをアプリ用の3種類（Sunny, Cloudy, Rain）に翻訳する
    // 参考: 0=快晴, 1〜3=曇り, 50番台〜=雨や雪
    if (weatherCode >= 50) {
      return 'Rain' // 雨や雪なら「Rain」
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      return 'Cloudy' // 曇り
    } else {
      return 'Sunny' // 0（快晴）は「Sunny」
    }
  } catch (error) {
    console.error('天気APIエラー:', error)
    return 'Sunny' // 通信エラー時などは安全のため晴れ扱いにする
  }
}
