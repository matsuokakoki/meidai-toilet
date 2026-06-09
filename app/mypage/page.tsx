'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  getFavorites,
  getMyReviews,
  addReview,
  getToilets,
  removeFavorite,
  deleteReview,
} from '@/utils/supabase'
import { getUserId } from '@/utils/user'
import SharedBottomNav from '@/components/SharedBottomNav'

const BRAND = '#C41E5A'
const GREEN = '#1EBE7A'

function Stars({
  rating,
  size = 12,
  interactive,
  onRate,
}: {
  rating: number
  size?: number
  interactive?: boolean
  onRate?: (r: number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => interactive && onRate && onRate(i)}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= Math.floor(rating) ? '#F5A623' : '#E0E0E0'}
          />
        </svg>
      ))}
    </div>
  )
}

type Favorite = {
  id: string
  toilets: { id: string; name: string }
}
type Review = {
  id: string
  rating: number
  comment: string | null
  toilets: { name: string }
}
type Toilet = { id: string; name: string }

type Tab = 'favorites' | 'post' | 'history'

export default function MyPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [toilets, setToilets] = useState<Toilet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('favorites')

  // Review form
  const [selectedToilet, setSelectedToilet] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const userId = (() => {
    if (typeof window === 'undefined') return '...'
    return getUserId().slice(0, 8).toUpperCase()
  })()

  useEffect(() => {
    async function load() {
      const [favData, revData, toiletData] = await Promise.all([
        getFavorites(),
        getMyReviews(),
        getToilets(),
      ])
      setFavorites(favData as Favorite[])
      setReviews(revData as Review[])
      setToilets(toiletData as Toilet[])
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmitReview = async () => {
    if (!selectedToilet) {
      showToast('トイレを選択してください', false)
      return
    }
    setPosting(true)
    const ok = await addReview(selectedToilet, rating, rating, comment)
    setPosting(false)
    if (ok) {
      showToast('口コミを投稿しました！', true)
      const revData = await getMyReviews()
      setReviews(revData as Review[])
      setSelectedToilet('')
      setRating(5)
      setComment('')
    } else {
      showToast('投稿できませんでした（5分以内の再投稿は不可）', false)
    }
  }

  const handleRemoveFavorite = async (favId: string) => {
    await removeFavorite(favId)
    const favData = await getFavorites()
    setFavorites(favData as Favorite[])
  }

  const handleDeleteReview = async (reviewId: string) => {
    await deleteReview(reviewId)
    const revData = await getMyReviews()
    setReviews(revData as Review[])
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'favorites', label: 'お気に入り', count: favorites.length },
    { id: 'post', label: '口コミ投稿' },
    { id: 'history', label: '口コミ履歴', count: reviews.length },
  ]

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
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 18px 0',
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
            マイページ
          </span>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '10px 14px 0',
            gap: 2,
          }}
        >
          {TABS.map((tab) => {
            const on = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2.5px solid ${on ? BRAND : 'transparent'}`,
                  color: on ? BRAND : '#AAA',
                  fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span
                    style={{
                      background: on ? BRAND : '#DDD',
                      color: on ? '#fff' : '#888',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 110,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 500,
            background: toast.ok ? '#111' : '#D93025',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,.3)',
            animation: 'slideUp .25s ease',
            whiteSpace: 'nowrap',
            fontFamily: "'Noto Sans JP', 'Hiragino Sans', system-ui",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Scrollable content ─────────────────────────── */}
      <div style={{ paddingTop: 112, paddingBottom: 95 }}>
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
            {/* User card (always visible) */}
            <div
              style={{
                background: '#fff',
                margin: '12px 12px 8px',
                borderRadius: 20,
                padding: '16px 18px',
                boxShadow: '0 2px 12px rgba(0,0,0,.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${BRAND}, #FF6B9D)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🚽
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 2 }}>
                  ゲストユーザー
                </p>
                <p style={{ fontSize: 12, color: '#AAA', fontFamily: 'monospace' }}>
                  ID: {userId}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: BRAND }}>
                  {reviews.length}
                </p>
                <p style={{ fontSize: 11, color: '#AAA' }}>口コミ</p>
              </div>
            </div>

            {/* ── Tab: お気に入り ───────────────────── */}
            {activeTab === 'favorites' && (
              <div style={{ padding: '0 12px 8px' }}>
                {favorites.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      color: '#CCC',
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🤍</div>
                    <p style={{ fontSize: 15 }}>お気に入りはまだありません</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>
                      マップでトイレをタップして追加できます
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        style={{
                          background: '#fff',
                          borderRadius: 18,
                          padding: '14px 16px',
                          boxShadow: '0 2px 10px rgba(0,0,0,.07)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#FBF0F4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                              fill={BRAND}
                            />
                          </svg>
                        </div>
                        <Link
                          href={`/buildings/${fav.toilets.id}`}
                          style={{ flex: 1, textDecoration: 'none' }}
                        >
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: '#111',
                              margin: 0,
                            }}
                          >
                            {fav.toilets.name}
                          </p>
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#F5F5F5',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              stroke="#AAA"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: 口コミ投稿 ───────────────────── */}
            {activeTab === 'post' && (
              <div
                style={{
                  background: '#fff',
                  margin: '0 12px 8px',
                  borderRadius: 20,
                  padding: '18px',
                  boxShadow: '0 2px 12px rgba(0,0,0,.08)',
                }}
              >
                {/* Toilet select */}
                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#AAA',
                      letterSpacing: '.07em',
                      marginBottom: 8,
                    }}
                  >
                    トイレを選択
                  </p>
                  <select
                    value={selectedToilet}
                    onChange={(e) => setSelectedToilet(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#F5F5F7',
                      border: '1.5px solid transparent',
                      borderRadius: 12,
                      fontSize: 15,
                      color: selectedToilet ? '#111' : '#AAA',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                    }}
                  >
                    <option value="">トイレを選んでください</option>
                    {toilets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#AAA',
                      letterSpacing: '.07em',
                      marginBottom: 8,
                    }}
                  >
                    評価
                  </p>
                  <div
                    style={{ display: 'flex', gap: 4, alignItems: 'center' }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg
                        key={i}
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setRating(i)}
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill={i <= rating ? '#F5A623' : '#E0E0E0'}
                        />
                      </svg>
                    ))}
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#F5A623',
                        marginLeft: 4,
                      }}
                    >
                      {rating}.0
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div style={{ marginBottom: 20 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#AAA',
                      letterSpacing: '.07em',
                      marginBottom: 8,
                    }}
                  >
                    コメント（任意）
                  </p>
                  <textarea
                    placeholder="このトイレの感想を書いてみましょう..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#F5F5F7',
                      border: '1.5px solid transparent',
                      borderRadius: 12,
                      fontSize: 15,
                      color: '#111',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitReview}
                  disabled={posting}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: posting ? '#CCC' : GREEN,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 16,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: posting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '.02em',
                    transition: 'background .15s',
                  }}
                >
                  {posting ? '投稿中...' : '口コミを投稿する'}
                </button>
              </div>
            )}

            {/* ── Tab: 口コミ履歴 ───────────────────── */}
            {activeTab === 'history' && (
              <div style={{ padding: '0 12px 8px' }}>
                {reviews.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      color: '#CCC',
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                    <p style={{ fontSize: 15 }}>まだ口コミがありません</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          background: '#fff',
                          borderRadius: 18,
                          padding: '14px 16px',
                          boxShadow: '0 2px 10px rgba(0,0,0,.07)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#111',
                                marginBottom: 4,
                              }}
                            >
                              {rev.toilets.name}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <Stars rating={rev.rating} size={12} />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#F5A623',
                                }}
                              >
                                {rev.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: '#FEE5E5',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                                stroke="#D93025"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        {rev.comment && (
                          <p
                            style={{
                              fontSize: 14,
                              color: '#555',
                              lineHeight: 1.6,
                              margin: 0,
                              paddingTop: 8,
                              borderTop: '1px solid #F0F0F0',
                            }}
                          >
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SharedBottomNav />
    </div>
  )
}
