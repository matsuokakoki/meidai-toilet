'use client'

import { useEffect, useState } from 'react'
import { getToilets } from '@/utils/supabase'
import {
  calculateCongestion,
  getCongestionStatus,
  getDistanceFromLatLonInM,
} from '@/utils/algorithm'
import { fetchCurrentWeather } from '@/utils/weather'
import { ToiletData } from '@/utils/algorithm'
import SharedBottomNav from '@/components/SharedBottomNav'

const BRAND = '#C41E5A'
const GREEN = '#1EBE7A'

const CONGESTION_COLOR = {
  low: '#1EBE7A',
  medium: '#E8940F',
  high: '#D93025',
}

function formatTime(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

function getAlgorithmHour(totalMinutes: number) {
  return Math.floor(totalMinutes / 60) + (totalMinutes % 60) / 100
}

function formatFloor(floor: number | null | undefined) {
  if (floor == null) return '1F'
  if (floor < 0) return `B${Math.abs(floor)}F`
  return `${floor}F`
}

function congestionColor(score: number) {
  if (score < 40) return CONGESTION_COLOR.low
  if (score < 70) return CONGESTION_COLOR.medium
  return CONGESTION_COLOR.high
}

function congestionLabel(score: number) {
  if (score < 40) return '空き'
  if (score < 70) return 'やや混雑'
  return '混雑中'
}

export default function CongestionPage() {
  const [toilets, setToilets] = useState<ToiletData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [timeInMinutes, setTimeInMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + Math.floor(now.getMinutes() / 15) * 15
  })
  const [weather, setWeather] = useState('Sunny')
  const [sortOption, setSortOption] = useState('default')
  const [filterWashlet, setFilterWashlet] = useState(false)
  const [filterMultipurpose, setFilterMultipurpose] = useState(false)
  const [filterGender, setFilterGender] = useState('all')
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [controlsOpen, setControlsOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const [data, w] = await Promise.all([getToilets(), fetchCurrentWeather()])
      setToilets(data)
      setWeather(w)
      setLoading(false)
    }
    load()
  }, [])

  const handleGetLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude })
        setSortOption('distance_close')
      },
      () => {}
    )
  }

  const resetToNow = () => {
    const now = new Date()
    setTimeInMinutes(
      now.getHours() * 60 + Math.floor(now.getMinutes() / 15) * 15
    )
  }

  let displayed = [...toilets]
  if (filterWashlet) displayed = displayed.filter((t) => t.has_washlet)
  if (filterMultipurpose) displayed = displayed.filter((t) => t.is_multipurpose)
  if (filterGender !== 'all') {
    if (filterGender === 'neutral')
      displayed = displayed.filter((t) => t.is_gender_neutral)
    else
      displayed = displayed.filter(
        (t) => t.gender === filterGender || t.gender === 'all'
      )
  }

  const algHour = getAlgorithmHour(timeInMinutes)
  displayed.sort((a, b) => {
    if (sortOption === 'rating_high')
      return (b.average_rating || 0) - (a.average_rating || 0)
    if (sortOption === 'congestion_low')
      return (
        calculateCongestion(a, algHour, weather) -
        calculateCongestion(b, algHour, weather)
      )
    if (sortOption === 'name') return a.name.localeCompare(b.name, 'ja')
    if (sortOption === 'distance_close' && userLocation) {
      return (
        getDistanceFromLatLonInM(
          userLocation.lat,
          userLocation.lng,
          Number(a.lat),
          Number(a.lng)
        ) -
        getDistanceFromLatLonInM(
          userLocation.lat,
          userLocation.lng,
          Number(b.lat),
          Number(b.lng)
        )
      )
    }
    return 0
  })

  const weatherLabel =
    weather === 'Sunny' ? '☀️ 晴れ' : weather === 'Rain' ? '☔ 雨' : '☁️ 曇り'

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          color: '#AAA',
          fontSize: 15,
          fontFamily: "'Noto Sans JP', 'Hiragino Sans', system-ui",
        }}
      >
        読み込み中...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F5F7',
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', system-ui",
      }}
    >
      {/* ── Fixed header ──────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'rgba(255,255,255,.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,.08)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>🚽</span>
        <div
          style={{
            width: 22,
            height: 22,
            background: BRAND,
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          名
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#111',
            letterSpacing: '-.3px',
            flex: 1,
          }}
        >
          混雑予測
        </span>
        {/* 設定トグル */}
        <button
          onClick={() => setControlsOpen((p) => !p)}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: `1.5px solid ${controlsOpen ? BRAND : '#C6C6C6'}`,
            background: controlsOpen ? '#FBF0F4' : '#fff',
            color: controlsOpen ? BRAND : '#333',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke={controlsOpen ? BRAND : '#555'}
              strokeWidth="2"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke={controlsOpen ? BRAND : '#555'}
              strokeWidth="2"
            />
          </svg>
          設定
        </button>
      </div>

      {/* ── Scrollable content ─────────────────────────── */}
      <div style={{ paddingTop: 66, paddingBottom: 95 }}>
        {/* Controls panel */}
        {controlsOpen && (
          <div
            style={{
              background: '#fff',
              margin: '12px 12px 8px',
              borderRadius: 20,
              padding: '18px',
              boxShadow: '0 2px 12px rgba(0,0,0,.08)',
              animation: 'slideUp .25s ease',
            }}
          >
            {/* Time slider */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>
                  🕒 時間
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#111',
                      letterSpacing: '-1px',
                    }}
                  >
                    {formatTime(timeInMinutes)}
                  </span>
                  <button
                    onClick={resetToNow}
                    style={{
                      padding: '5px 10px',
                      background: '#F0F0F0',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#555',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                    }}
                  >
                    現在に戻す
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1425"
                step="15"
                value={timeInMinutes}
                onChange={(e) => setTimeInMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: BRAND,
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Weather */}
            <div style={{ marginBottom: 18 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: 8,
                }}
              >
                ⛅ 天気
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { v: 'Sunny', label: '☀️ 晴れ', color: '#E8940F' },
                  { v: 'Cloudy', label: '☁️ 曇り', color: '#888' },
                  { v: 'Rain', label: '☔ 雨', color: '#4A92D9' },
                ].map(({ v, label, color }) => (
                  <button
                    key={v}
                    onClick={() => setWeather(v)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: `1.5px solid ${weather === v ? color : '#EAEAEA'}`,
                      background: weather === v ? `${color}18` : '#FAFAFA',
                      color: weather === v ? color : '#666',
                      fontSize: 13,
                      fontWeight: weather === v ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: 8,
                }}
              >
                並び替え
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { v: 'default', label: 'デフォルト' },
                  { v: 'congestion_low', label: '🟢 空いてる順' },
                  { v: 'rating_high', label: '⭐ 評価順' },
                  { v: 'name', label: '🏢 名前順' },
                  ...(userLocation
                    ? [{ v: 'distance_close', label: '📍 近い順' }]
                    : []),
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => setSortOption(v)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 20,
                      border: `1.5px solid ${sortOption === v ? BRAND : '#EAEAEA'}`,
                      background: sortOption === v ? '#FBF0F4' : '#FAFAFA',
                      color: sortOption === v ? BRAND : '#666',
                      fontSize: 12,
                      fontWeight: sortOption === v ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: 8,
                }}
              >
                絞り込み
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { v: 'all', label: '🚻 すべて' },
                  { v: 'men', label: '🚹 男性用' },
                  { v: 'women', label: '🚺 女性用' },
                  { v: 'neutral', label: '⚧️ GNトイレ' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => setFilterGender(v)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 20,
                      border: `1.5px solid ${filterGender === v ? GREEN : '#EAEAEA'}`,
                      background: filterGender === v ? '#E5F8EF' : '#FAFAFA',
                      color: filterGender === v ? '#148E5A' : '#666',
                      fontSize: 12,
                      fontWeight: filterGender === v ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setFilterWashlet((p) => !p)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 20,
                    border: `1.5px solid ${filterWashlet ? GREEN : '#EAEAEA'}`,
                    background: filterWashlet ? '#E5F8EF' : '#FAFAFA',
                    color: filterWashlet ? '#148E5A' : '#666',
                    fontSize: 12,
                    fontWeight: filterWashlet ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  💦 ウォシュレット
                </button>
                <button
                  onClick={() => setFilterMultipurpose((p) => !p)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 20,
                    border: `1.5px solid ${filterMultipurpose ? GREEN : '#EAEAEA'}`,
                    background: filterMultipurpose ? '#E5F8EF' : '#FAFAFA',
                    color: filterMultipurpose ? '#148E5A' : '#666',
                    fontSize: 12,
                    fontWeight: filterMultipurpose ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  ♿ 多目的
                </button>
                <button
                  onClick={handleGetLocation}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 20,
                    border: `1.5px solid ${userLocation ? GREEN : '#EAEAEA'}`,
                    background: userLocation ? '#E5F8EF' : '#FAFAFA',
                    color: userLocation ? '#148E5A' : '#666',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  📍 {userLocation ? '現在地取得済' : '現在地取得'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px 6px',
          }}
        >
          <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
            <span style={{ color: BRAND, fontWeight: 700 }}>
              {displayed.length}
            </span>
            件 ·{' '}
            <span style={{ color: '#555' }}>
              {formatTime(timeInMinutes)} · {weatherLabel}
            </span>
          </span>
        </div>

        {/* Toilet list */}
        <div style={{ padding: '0 12px 8px' }}>
          {displayed.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#AAA',
                fontSize: 15,
              }}
            >
              条件に合うトイレが見つかりませんでした
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayed.map((toilet) => {
                const score = calculateCongestion(toilet, algHour, weather)
                const status = getCongestionStatus(score)
                const isExpanded = expandedId === toilet.id
                const cColor = congestionColor(score)
                const cLabel = congestionLabel(score)

                let distText = ''
                if (userLocation) {
                  const d = getDistanceFromLatLonInM(
                    userLocation.lat,
                    userLocation.lng,
                    Number(toilet.lat),
                    Number(toilet.lng)
                  )
                  distText =
                    d < 1000
                      ? `${Math.round(d)}m`
                      : `${(d / 1000).toFixed(1)}km`
                }

                const dailyData = isExpanded
                  ? Array.from({ length: 13 }, (_, i) => i + 8).map((h) => ({
                      hour: h,
                      score: calculateCongestion(
                        toilet,
                        h === Math.floor(algHour) ? algHour : h,
                        weather
                      ),
                    }))
                  : []

                return (
                  <div
                    key={toilet.id}
                    style={{
                      background: '#fff',
                      borderRadius: 18,
                      boxShadow: '0 2px 10px rgba(0,0,0,.07)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : toilet.id)}
                  >
                    {/* Card header */}
                    <div style={{ padding: '14px 16px 10px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: 5,
                              marginBottom: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                background: '#F2F2F2',
                                color: '#777',
                                fontSize: 11,
                                padding: '2px 7px',
                                borderRadius: 5,
                              }}
                            >
                              {formatFloor(toilet.floor)}
                            </span>
                            {(toilet.average_rating ?? 0) > 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#F5A623',
                                  fontWeight: 600,
                                }}
                              >
                                ★{(toilet.average_rating ?? 0).toFixed(1)}{' '}
                                <span style={{ color: '#BBB' }}>
                                  ({toilet.review_count ?? 0})
                                </span>
                              </span>
                            )}
                            {distText && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#4A92D9',
                                  fontWeight: 600,
                                }}
                              >
                                📍 {distText}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#111',
                              margin: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {toilet.name}
                          </p>
                        </div>

                        {/* Congestion badge */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 12px',
                              borderRadius: 20,
                              background: `${cColor}18`,
                              color: cColor,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: cColor,
                                display: 'inline-block',
                              }}
                            />
                            {cLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Congestion bar */}
                    <div style={{ height: 4, background: '#F0F0F0' }}>
                      <div
                        style={{
                          height: 4,
                          width: `${score}%`,
                          background: cColor,
                          transition: 'width .4s cubic-bezier(.4,0,.2,1)',
                          borderRadius: '0 4px 4px 0',
                        }}
                      />
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div
                        style={{
                          background: '#FAFAFA',
                          padding: '14px 16px',
                          borderTop: '1px solid #F0F0F0',
                          animation: 'slideUp .2s ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Facilities */}
                        <div style={{ marginBottom: 14 }}>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#AAA',
                              letterSpacing: '.06em',
                              marginBottom: 6,
                            }}
                          >
                            設備
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 5,
                            }}
                          >
                            {[
                              {
                                icon: '🚽',
                                label: `洋式×${toilet.western_style_count ?? 0}`,
                                show: true,
                              },
                              {
                                icon: '🪑',
                                label: `和式×${toilet.japanese_style_count ?? 0}`,
                                show: (toilet.japanese_style_count ?? 0) > 0,
                              },
                              {
                                icon: '💦',
                                label: 'ウォシュレット',
                                show: !!toilet.has_washlet,
                              },
                              {
                                icon: '♿',
                                label: '多目的',
                                show: !!toilet.is_multipurpose,
                              },
                              {
                                icon: '🎵',
                                label: '乙姫',
                                show: !!toilet.has_otohime,
                              },
                            ]
                              .filter((f) => f.show)
                              .map((f, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 12,
                                    padding: '4px 10px',
                                    background: '#fff',
                                    borderRadius: 12,
                                    color: '#444',
                                    border: '1px solid #EAEAEA',
                                  }}
                                >
                                  {f.icon} {f.label}
                                </span>
                              ))}
                          </div>
                        </div>

                        {/* Hourly chart */}
                        <div>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#AAA',
                              letterSpacing: '.06em',
                              marginBottom: 6,
                            }}
                          >
                            時間帯別混雑予測 (8〜20時)
                          </p>
                          <div
                            style={{
                              background: '#fff',
                              borderRadius: 12,
                              padding: '10px 10px 6px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'space-between',
                              height: 90,
                              border: '1px solid #EAEAEA',
                            }}
                          >
                            {dailyData.map((d) => {
                              const isCurrent = d.hour === Math.floor(algHour)
                              const barColor = isCurrent
                                ? BRAND
                                : congestionColor(d.score)
                              return (
                                <div
                                  key={d.hour}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    height: '100%',
                                    gap: 2,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '70%',
                                      background: barColor,
                                      opacity: isCurrent ? 1 : 0.5,
                                      borderRadius: '3px 3px 0 0',
                                      height: `${Math.max(4, d.score)}%`,
                                      transition: 'height .3s ease',
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: 9,
                                      color: isCurrent ? BRAND : '#CCC',
                                      fontWeight: isCurrent ? 700 : 400,
                                    }}
                                  >
                                    {d.hour % 2 === 0 ? d.hour : ''}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <SharedBottomNav />
    </div>
  )
}
