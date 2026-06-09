'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getToilets } from '@/utils/supabase'
import SharedBottomNav from '@/components/SharedBottomNav'

const BRAND = '#C41E5A'
const GREEN = '#1EBE7A'

function isCurrentlyOpen(openingHours: string | null): boolean {
  if (!openingHours) return true
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const m = openingHours.match(/(\d{1,2}):(\d{2})[–\-～](\d{1,2}):(\d{2})/)
  if (!m) return true
  return (
    cur >= parseInt(m[1]) * 60 + parseInt(m[2]) &&
    cur < parseInt(m[3]) * 60 + parseInt(m[4])
  )
}

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = i <= Math.floor(rating)
        const half = !full && i - rating < 1 && rating % 1 > 0
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            {half && (
              <defs>
                <linearGradient id={`g${i}`} x1="0" x2="1">
                  <stop offset={`${(rating % 1) * 100}%`} stopColor="#F5A623" />
                  <stop offset={`${(rating % 1) * 100}%`} stopColor="#DDD" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={full ? '#F5A623' : half ? `url(#g${i})` : '#E0E0E0'}
            />
          </svg>
        )
      })}
    </div>
  )
}

type Toilet = {
  id: string
  name: string
  floor: number | null
  gender: string | null
  average_rating: number
  review_count: number
  has_washlet: boolean | null
  is_gender_neutral: boolean | null
  is_multipurpose: boolean | null
  has_otohime: boolean | null
  western_style_count: number | null
  japanese_style_count: number | null
  opening_hours: string | null
}

const GENDER_LABELS: Record<string, [string, string]> = {
  men: ['🚹', '男性用'],
  women: ['🚺', '女性用'],
  all: ['🚻', '共用'],
}

export default function BuildingsPage() {
  const [search, setSearch] = useState('')
  const [toilets, setToilets] = useState<Toilet[]>([])
  const [loading, setLoading] = useState(true)
  const [filterWashlet, setFilterWashlet] = useState(false)
  const [filterMultipurpose, setFilterMultipurpose] = useState(false)
  const [filterGN, setFilterGN] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    getToilets().then((data) => {
      setToilets(data as Toilet[])
      setLoading(false)
    })
  }, [])

  const filtered = toilets.filter((t) => {
    if (search && !t.name.includes(search)) return false
    if (filterWashlet && !t.has_washlet) return false
    if (filterMultipurpose && !t.is_multipurpose) return false
    if (filterGN && !t.is_gender_neutral) return false
    if (filterOpen && !isCurrentlyOpen(t.opening_hours)) return false
    return true
  })

  const chips = [
    {
      label: '今すぐ使える',
      active: filterOpen,
      toggle: () => setFilterOpen((p) => !p),
    },
    {
      label: '💦 ウォシュレット',
      active: filterWashlet,
      toggle: () => setFilterWashlet((p) => !p),
    },
    {
      label: '♿ 多目的',
      active: filterMultipurpose,
      toggle: () => setFilterMultipurpose((p) => !p),
    },
    {
      label: '⚧️ GNトイレ',
      active: filterGN,
      toggle: () => setFilterGN((p) => !p),
    },
  ]

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F5F5F7',
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', system-ui",
      }}
    >
      {/* ── Fixed header ───────────────────────────────── */}
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
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 18px 10px',
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
            }}
          >
            建物・トイレ一覧
          </span>
        </div>

        {/* Search row */}
        <div style={{ padding: '0 14px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#F0F0F0',
              borderRadius: 12,
              padding: '10px 14px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#AAA" strokeWidth="2" />
              <path
                d="M21 21l-4.35-4.35"
                stroke="#AAA"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="建物・トイレ名で検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                color: '#111',
                fontFamily: 'inherit',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#AAA',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter chips row */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 12px 12px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={c.toggle}
              style={{
                flexShrink: 0,
                padding: '7px 15px',
                borderRadius: 20,
                border: `1.5px solid ${c.active ? GREEN : '#C6C6C6'}`,
                background: c.active ? GREEN : '#FFFFFF',
                color: c.active ? '#FFFFFF' : '#333',
                fontSize: 13,
                fontWeight: c.active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                boxShadow: c.active
                  ? `0 2px 8px ${GREEN}55`
                  : '0 2px 6px rgba(0,0,0,.1)',
                transition: 'all .15s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────── */}
      <div style={{ paddingTop: 168, paddingBottom: 95 }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#AAA',
              fontSize: 15,
            }}
          >
            読み込み中...
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 18px 6px' }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                <span style={{ color: GREEN, fontWeight: 700 }}>
                  {filtered.length}
                </span>
                件のトイレ
              </span>
            </div>

            <div style={{ padding: '0 12px 8px' }}>
              {filtered.length === 0 ? (
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
                  {filtered.map((t) => {
                    const [gi, gl] =
                      GENDER_LABELS[t.gender ?? 'all'] ?? ['🚻', '共用']
                    const isOpen = isCurrentlyOpen(t.opening_hours)

                    return (
                      <Link
                        key={t.id}
                        href={`/buildings/${t.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          style={{
                            background: '#fff',
                            borderRadius: 18,
                            padding: '14px 16px',
                            boxShadow: '0 2px 10px rgba(0,0,0,.07)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          {/* Top row: badges + rating */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}
                            >
                              <span
                                style={{
                                  background: '#F2F2F2',
                                  color: '#555',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                }}
                              >
                                {gi} {gl}
                              </span>
                              <span
                                style={{
                                  background: '#F2F2F2',
                                  color: '#777',
                                  fontSize: 12,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                }}
                              >
                                {t.floor ?? 1}F
                              </span>
                              <span
                                style={{
                                  background: isOpen ? '#E5F8EF' : '#FEE5E5',
                                  color: isOpen ? '#148E5A' : '#D93025',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                }}
                              >
                                {isOpen ? '営業中' : '休止中'}
                              </span>
                            </div>
                            {t.review_count > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  flexShrink: 0,
                                }}
                              >
                                <Stars rating={t.average_rating} size={11} />
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#333',
                                  }}
                                >
                                  {t.average_rating.toFixed(1)}
                                </span>
                                <span style={{ fontSize: 11, color: '#BBB' }}>
                                  ({t.review_count})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: '#111',
                              lineHeight: 1.3,
                            }}
                          >
                            {t.name}
                          </div>

                          {/* Bottom row: facility chips + chevron */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div
                              style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}
                            >
                              {t.has_washlet && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: '#4A92D9',
                                    background: '#EFF6FF',
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  💦 ウォシュレット
                                </span>
                              )}
                              {t.is_multipurpose && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: '#7B5EA7',
                                    background: '#F5F0FF',
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  ♿ 多目的
                                </span>
                              )}
                              {t.is_gender_neutral && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: '#B25A00',
                                    background: '#FFF5E6',
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  ⚧️ GN
                                </span>
                              )}
                              {t.has_otohime && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: '#888',
                                    background: '#F5F5F5',
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  🎵 乙姫
                                </span>
                              )}
                            </div>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              style={{ flexShrink: 0 }}
                            >
                              <path
                                d="M9 18l6-6-6-6"
                                stroke="#CCC"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <SharedBottomNav />
    </div>
  )
}
