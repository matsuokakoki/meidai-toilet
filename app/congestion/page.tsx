// app/congestion/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getToilets } from '@/utils/supabase'
import { calculateCongestion, getCongestionStatus, getDistanceFromLatLonInM } from '@/utils/algorithm'
import { fetchCurrentWeather } from '@/utils/weather'
import { ToiletData } from '@/utils/algorithm';

export default function CongestionTestPage() {
  const [toilets, setToilets] = useState<ToiletData[]>([])
  
  const [testTimeInMinutes, setTestTimeInMinutes] = useState<number>(() => {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 15) * 15;
    return now.getHours() * 60 + minutes;
  })
  
  const [testWeather, setTestWeather] = useState<string>('Sunny')
  const [loading, setLoading] = useState(true)
  const [expandedToiletId, setExpandedToiletId] = useState<string | null>(null)

  const [sortOption, setSortOption] = useState<string>('default')
  const [filterWashlet, setFilterWashlet] = useState<boolean>(false)
  const [filterMultipurpose, setFilterMultipurpose] = useState<boolean>(false)
  const [filterGender, setFilterGender] = useState<string>('all')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    async function fetchToilets() {
      const data = await getToilets()
      setToilets(data)
      const currentWeather = await fetchCurrentWeather()
      setTestWeather(currentWeather)
      setLoading(false)
    }
    fetchToilets()
  }, [])

  const resetToCurrentTime = () => {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 15) * 15;
    setTestTimeInMinutes(now.getHours() * 60 + minutes);
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("お使いのブラウザは現在地取得に対応していません。")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setSortOption('distance_close')
      },
      (error) => {
        alert("現在地の取得に失敗しました。スマホの設定を確認してください。")
      }
    )
  }

  const resetFilters = () => {
    setSortOption('default')
    setFilterWashlet(false)
    setFilterMultipurpose(false)
    setFilterGender('all')
  }

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getAlgorithmHour = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours + (mins / 100); 
  };

  const formatFloor = (floor: number | null | undefined) => {
    if (floor === null || floor === undefined) return '1階';
    if (floor < 0) return `B${Math.abs(floor)}階`;
    return `${floor}階`;
  };

  let displayedToilets = [...toilets]

  if (filterWashlet) displayedToilets = displayedToilets.filter(t => t.has_washlet)
  if (filterMultipurpose) displayedToilets = displayedToilets.filter(t => t.is_multipurpose)
  if (filterGender !== 'all') {
    if (filterGender === 'neutral') displayedToilets = displayedToilets.filter(t => t.is_gender_neutral)
    else displayedToilets = displayedToilets.filter(t => t.gender === filterGender || t.gender === 'all')
  }

  displayedToilets.sort((a, b) => {
    if (sortOption === 'rating_high') return (b.average_rating || 0) - (a.average_rating || 0)
    if (sortOption === 'congestion_low') {
      const scoreA = calculateCongestion(a, getAlgorithmHour(testTimeInMinutes), testWeather)
      const scoreB = calculateCongestion(b, getAlgorithmHour(testTimeInMinutes), testWeather)
      return scoreA - scoreB
    }
    if (sortOption === 'name') return a.name.localeCompare(b.name, 'ja')
    if (sortOption === 'distance_close' && userLocation) {
      const distA = getDistanceFromLatLonInM(userLocation.lat, userLocation.lng, Number(a.lat), Number(a.lng))
      const distB = getDistanceFromLatLonInM(userLocation.lat, userLocation.lng, Number(b.lat), Number(b.lng))
      return distA - distB
    }
    return 0 
  })

  const generateDailyCongestionData = (toilet: ToiletData, currentAlgorithmHour: number, currentWeather: string) => {
    const data = [];
    const currentHourOnly = Math.floor(currentAlgorithmHour);

    for (let h = 8; h <= 20; h++) {
      const hourToCalculate = (h === currentHourOnly) ? currentAlgorithmHour : h;
      const score = calculateCongestion(toilet, hourToCalculate, currentWeather); 
      data.push({ hour: h, score: score });
    }
    return data;
  }

  if (loading) return <div className="p-8 text-center text-gray-500">データを読み込み中...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📊 混雑予測・シミュレーター
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-4 grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-gray-700 font-bold text-lg flex items-center gap-2">
                🕒 時間: <span className="text-3xl font-extrabold text-blue-600">{formatTime(testTimeInMinutes)}</span>
              </label>
              <button onClick={resetToCurrentTime} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition-colors shadow-sm">
                現在に戻す
              </button>
            </div>
            <input
              type="range" min="0" max="1425" step="15" value={testTimeInMinutes}
              onChange={(e) => setTestTimeInMinutes(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <label className="text-gray-700 font-bold text-lg flex items-center gap-2 mb-4">
              ⛅ 天気: 
              <span className={`text-xl font-extrabold ${testWeather === 'Sunny' ? 'text-orange-500' : testWeather === 'Rain' ? 'text-blue-500' : 'text-gray-500'}`}>
                {testWeather === 'Sunny' ? '晴れ' : testWeather === 'Rain' ? '雨' : '曇り'}
              </span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setTestWeather('Sunny')} className={`flex-1 py-2 rounded-lg font-bold transition-colors ${testWeather === 'Sunny' ? 'bg-orange-100 text-orange-700 border-2 border-orange-400' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>☀️ 晴れ</button>
              <button onClick={() => setTestWeather('Cloudy')} className={`flex-1 py-2 rounded-lg font-bold transition-colors ${testWeather === 'Cloudy' ? 'bg-gray-200 text-gray-700 border-2 border-gray-400' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>☁️ 曇り</button>
              <button onClick={() => setTestWeather('Rain')} className={`flex-1 py-2 rounded-lg font-bold transition-colors ${testWeather === 'Rain' ? 'bg-blue-100 text-blue-700 border-2 border-blue-400' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>☔ 雨</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">⚙️ 絞り込み ＆ 並び替え</h2>
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800 font-bold">
              ↻ 条件をリセット
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">▼ 表示順</label>
              <div className="flex gap-2">
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-bold"
                >
                  <option value="default">デフォルト</option>
                  <option value="congestion_low">🟢 混雑度が低い順 (空いてる順)</option>
                  <option value="rating_high">⭐ 評価が高い順</option>
                  <option value="name">🏢 建物名順 (あいうえお順)</option>
                  {userLocation && <option value="distance_close">📍 現在地から近い順</option>}
                </select>
                
                <button 
                  onClick={handleGetLocation}
                  className={`shrink-0 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${userLocation ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {userLocation ? '📍 取得済' : '📍 現在地取得'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">▼ 設備で絞り込む</label>
              <div className="flex flex-wrap gap-2">
                <select 
                  value={filterGender} 
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 font-bold"
                >
                  <option value="all">🚻 すべての対象</option>
                  <option value="men">🚹 男子トイレを含む</option>
                  <option value="women">🚺 女子トイレを含む</option>
                  <option value="neutral">🌈 だれでもトイレ</option>
                </select>

                <label className="flex items-center gap-1 cursor-pointer bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  <input type="checkbox" checked={filterWashlet} onChange={(e) => setFilterWashlet(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                  🚿 ウォシュレット
                </label>
                
                <label className="flex items-center gap-1 cursor-pointer bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  <input type="checkbox" checked={filterMultipurpose} onChange={(e) => setFilterMultipurpose(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                  ♿ 多目的
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-2 font-bold">該当: {displayedToilets.length} 件</div>
        
        <div className="grid gap-4">
          {displayedToilets.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-xl border border-gray-200 text-gray-500">
              条件に合うトイレが見つかりませんでした。
            </div>
          ) : (
            displayedToilets.map((toilet) => {
              const currentAlgorithmHour = getAlgorithmHour(testTimeInMinutes);
              const score = calculateCongestion(toilet, currentAlgorithmHour, testWeather)
              const status = getCongestionStatus(score)
              const isExpanded = expandedToiletId === toilet.id

              let distanceText = ''
              if (userLocation) {
                const dist = getDistanceFromLatLonInM(userLocation.lat, userLocation.lng, Number(toilet.lat), Number(toilet.lng))
                distanceText = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`
              }

              const dailyData = isExpanded ? generateDailyCongestionData(toilet, currentAlgorithmHour, testWeather) : [];

              return (
                <div 
                  key={toilet.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
                  onClick={() => setExpandedToiletId(isExpanded ? null : toilet.id)}
                >
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {formatFloor(toilet.floor)}
                        </span>
                        <h3 className="font-bold text-gray-800 text-lg">{toilet.name}</h3>
                        
                        {/* 🌟 修正：!= null を追加して安全に星を表示！ */}
                        {toilet.average_rating != null && toilet.average_rating > 0 && (
                          <span className="text-sm font-bold text-yellow-500 flex items-center">
                            ★ {toilet.average_rating.toFixed(1)} <span className="text-xs text-gray-400 ml-1">({toilet.review_count})</span>
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        {distanceText && <span className="font-bold text-blue-600">📍 距離: {distanceText}</span>}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.color} shadow-sm`}>
                        {status.text} ({score}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className={`h-1.5 ${score >= 80 ? 'bg-red-500' : score >= 50 ? 'bg-orange-500' : 'bg-green-500'}`} 
                      style={{ width: `${score}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    ></div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50 p-5 border-t border-gray-100 grid gap-4 md:grid-cols-2 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🚽 トイレ設備詳細</h4>
                        <ul className="text-sm text-gray-600 space-y-1 bg-white p-3 rounded-xl border border-gray-200">
                          <li>🔹 洋式便器: <span className="font-bold text-gray-800">{toilet.western_style_count || 0} 個</span></li>
                          <li>🔹 和式便器: <span className="font-bold text-gray-800">{toilet.japanese_style_count || 0} 個</span></li>
                          <li>🔹 小便器 (男性用): <span className="font-bold text-gray-800">{toilet.urinal_count || 0} 個</span></li>
                          <li className="pt-1 mt-1 border-t border-gray-100 text-xs text-blue-600 flex gap-2">
                            {toilet.has_washlet && <span>✓ ウォシュレット</span>}
                            {toilet.has_otohime && <span>✓ 音姫</span>}
                            {toilet.is_multipurpose && <span>✓ 多目的</span>}
                          </li>
                        </ul>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📊 時間帯の混雑傾向 (8時〜20時)</h4>
                          
                          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-end justify-between h-32 gap-1">
                            {dailyData.map((data) => {
                              const currentHourOnly = Math.floor(testTimeInMinutes / 60);
                              const isCurrentHour = data.hour === currentHourOnly;
                              
                              return (
                                <div key={data.hour} className="flex flex-col items-center justify-end flex-1 h-full group relative">
                                  
                                  <div className="w-full flex-1 flex items-end relative">
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                                      {isCurrentHour ? formatTime(testTimeInMinutes) : `${data.hour}:00`} ～ , {data.score}%
                                    </div>
                                    
                                    <div 
                                      className={`w-full rounded-t-sm transition-all duration-300 ${isCurrentHour ? 'bg-blue-500' : 'bg-blue-200'}`}
                                      style={{ height: `${Math.max(5, data.score)}%` }}
                                    ></div>
                                  </div>

                                  <span className="text-[10px] text-gray-400 mt-1 font-mono leading-none h-3">
                                    {data.hour % 2 === 0 ? `${data.hour}` : '\u00A0'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Link 
                          href={`/toilets/${toilet.id}`}
                          className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors text-center shadow-md block"
                        >
                          🔍 口コミ・マップを詳しく見る
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}