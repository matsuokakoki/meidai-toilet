'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToiletById, addFavorite, removeFavoriteByToilet, isFavorite } from '@/utils/supabase'
import SharedBottomNav from '@/components/SharedBottomNav'

const BRAND = '#C41E5A'
const GREEN = '#1EBE7A'

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = i <= Math.floor(rating)
        const half = !full && i - rating < 1 && rating % 1 > 0
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            {half && (
              <defs>
                <linearGradient id={`gd${i}`} x1="0" x2="1">
                  <stop offset={`${(rating % 1) * 100}%`} stopColor="#F5A623" />
                  <stop offset={`${(rating % 1) * 100}%`} stopColor="#DDD" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={full ? '#F5A623' : half ? `url(#gd${i})` : '#E0E0E0'}
            />
          </svg>
        )
      })}
    </div>
  )
}

type Review = {
  id: string
  rating: number
  comment: string | null
}

type Toilet = {
  id: string
  name: string
  floor: number | null
  gender: string | null
  has_washlet: boolean | null
  has_otohime: boolean | null
  is_gender_neutral: boolean | null
  is_multipurpose: boolean | null
  western_style_count: number | null
  japanese_style_count: number | null
  urinal_count: number | null
  opening_hours: string | null
  reviews: Review[]
}

const GENDER_LABELS: Record<string, [string, string]> = {
  men: ['🚹', '男性用'],
  women: ['🚺', '女性用'],
  all: ['🚻', '男女共用'],
}

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

export default function ToiletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [toilet, setToilet] = useState<Toilet | null>(null)
  const [loading, setLoading] = useState(true)
  const [fav, setFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const [data, favStatus] = await Promise.all([
        getToiletById(id),
        isFavorite(id),
      ])
      setToilet(data as Toilet | null)
      setFav(favStatus)
      setLoading(false)
    }
    load()
  }, [id])

  const toggleFav = async () => {
    if (favLoading) return
    setFavLoading(true)
    if (fav) {
      await removeFavoriteByToilet(id)
      setFav(false)
    } else {
      await addFavorite(id)
      setFav(true)
    }
    setFavLoading(false)
  }

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

  if (!toilet) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          gap: 16,
          fontFamily: "'Noto Sans JP', 'Hiragino Sans', system-ui",
        }}
      >
        <span style={{ fontSize: 40 }}>🚫</span>
        <p style={{ color: '#888', fontSize: 15 }}>トイレが見つかりません</p>
        <button
          onClick={() => router.back()}
          style={{
            padding: '10px 24px',
            background: BRAND,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          戻る
        </button>
      </div>
    )
  }

  const avgRating =
    toilet.reviews.length > 0
      ? toilet.reviews.reduce((s, r) => s + r.rating, 0) / toilet.reviews.length
      : 0

  const [gi, gl] = GENDER_LABELS[toilet.gender ?? 'all'] ?? ['🚻', '男女共用']
  const isOpen = isCurrentlyOpen(toilet.opening_hours)

  const facilities = [
    {
      icon: '🚽',
      label: `洋式 ${toilet.western_style_count ?? 0}個`,
      show: true,
    },
    {
      icon: '🪑',
      label: `和式 ${toilet.japanese_style_count ?? 0}個`,
      show: (toilet.japanese_style_count ?? 0) > 0,
    },
    {
      icon: '🚹',
      label: `小便器 ${toilet.urinal_count ?? 0}個`,
      show: (toilet.urinal_count ?? 0) > 0,
    },
    { icon: '💦', label: 'ウォシュレット', show: !!toilet.has_washlet },
    { icon: '♿', label: '多目的ルーム', show: !!toilet.is_multipurpose },
    { icon: '⚧️', label: 'GNトイレ', show: !!toilet.is_gender_neutral },
    { icon: '🎵', label: '乙姫あり', show: !!toilet.has_otohime },
  ].filter((f) => f.show)

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
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#F0F0F0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#111',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {toilet.name}
        </span>
        <button
          onClick={toggleFav}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: fav ? '#FBF0F4' : '#F0F0F0',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform .15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              fill={fav ? BRAND : 'none'}
              stroke={fav ? BRAND : '#CCC'}
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ─────────────────────────── */}
      <div style={{ paddingTop: 66, paddingBottom: 95 }}>
        {/* Hero card */}
        <div
          style={{
            background: '#fff',
            margin: '12px 12px 8px',
            borderRadius: 20,
            padding: '18px 18px 16px',
            boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          }}
        >
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <span
              style={{
                background: '#F2F2F2',
                color: '#555',
                fontSize: 13,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              {gi} {gl}
            </span>
            <span
              style={{
                background: '#F2F2F2',
                color: '#777',
                fontSize: 13,
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              {toilet.floor ?? 1}F
            </span>
            <span
              style={{
                background: isOpen ? '#E5F8EF' : '#FEE5E5',
                color: isOpen ? '#148E5A' : '#D93025',
                fontSize: 13,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 8,
              }}
            >
              {isOpen ? '営業中' : '休止中'}
            </span>
          </div>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#111',
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            {toilet.name}
          </h1>

          {/* Rating row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 0',
              borderTop: '1px solid #F0F0F0',
            }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#111',
                letterSpacing: '-1px',
              }}
            >
              {avgRating.toFixed(1)}
            </span>
            <Stars rating={avgRating} size={14} />
            <span style={{ fontSize: 13, color: '#BBB' }}>
              ({toilet.reviews.length}件)
            </span>
          </div>

          {/* Opening hours */}
          {toilet.opening_hours && (
            <div
              style={{
                fontSize: 13,
                color: '#666',
                padding: '8px 0 0',
                borderTop: '1px solid #F0F0F0',
              }}
            >
              🕐 {toilet.opening_hours}
            </div>
          )}
        </div>

        {/* Facilities card */}
        {facilities.length > 0 && (
          <div
            style={{
              background: '#fff',
              margin: '0 12px 8px',
              borderRadius: 20,
              padding: '16px 18px',
              boxShadow: '0 2px 12px rgba(0,0,0,.08)',
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#AAA',
                letterSpacing: '.07em',
                marginBottom: 12,
              }}
            >
              設備・機能
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {facilities.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 12px',
                    background: '#F5F5F7',
                    borderRadius: 20,
                    fontSize: 13,
                    color: '#333',
                    fontWeight: 500,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews card */}
        <div
          style={{
            background: '#fff',
            margin: '0 12px 8px',
            borderRadius: 20,
            padding: '16px 18px',
            boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#AAA',
              letterSpacing: '.07em',
              marginBottom: 12,
            }}
          >
            口コミ
          </p>

          {toilet.reviews.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: '#CCC',
                fontSize: 14,
              }}
            >
              まだ口コミがありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {toilet.reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: '#FAFAFA',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Stars rating={r.rating} size={11} />
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: '#333' }}
                    >
                      {r.rating.toFixed(1)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#555',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {r.comment ?? 'コメントなし'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SharedBottomNav />
    </div>
  )
}
