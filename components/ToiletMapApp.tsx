'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  calculateCongestion,
  getDistanceFromLatLonInM,
} from '@/utils/algorithm'

// ── Brand / theme ──────────────────────────────────────────────────────────────
const BRAND = '#C41E5A'

// ── Campus coordinate system ───────────────────────────────────────────────────
// Calibrated using known hotspot coordinates vs. design SVG positions:
//   全学教育棟 (lat=35.15438, lng=136.96259) → design x=16%, y=21%
//   北部食堂   (lat=35.15621, lng=136.96611) → design x=49%, y=15%
const LNG_AT_X0 = 136.96088
const LNG_PER_PCT = 0.0001067
const LAT_AT_Y0 = 35.16079
const LAT_PER_PCT = 0.000305

function latLngToSvgPct(lat: number, lng: number): { x: number; y: number } {
  const x = (lng - LNG_AT_X0) / LNG_PER_PCT
  const y = (LAT_AT_Y0 - lat) / LAT_PER_PCT
  return {
    x: Math.max(5, Math.min(90, x)),
    y: Math.max(12, Math.min(90, y)),
  }
}

function isCurrentlyOpen(openingHours: string | null): boolean {
  if (!openingHours) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const m = openingHours.match(/(\d{1,2}):(\d{2})[–\-～](\d{1,2}):(\d{2})/)
  if (!m) return true
  const open = parseInt(m[1]) * 60 + parseInt(m[2])
  const close = parseInt(m[3]) * 60 + parseInt(m[4])
  return cur >= open && cur < close
}

function congestionLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 40) return 'low'
  if (score < 70) return 'medium'
  return 'high'
}

// ── Types ──────────────────────────────────────────────────────────────────────
export type SupabaseToiletWithReviews = {
  id: string
  name: string
  floor: number | null
  gender: string | null
  has_otohime: boolean | null
  has_washlet: boolean | null
  is_gender_neutral: boolean | null
  is_multipurpose: boolean | null
  japanese_style_count: number | null
  lat: number | null
  lng: number | null
  opening_hours: string | null
  urinal_count: number | null
  western_style_count: number | null
  average_rating: number
  review_count: number
  reviews: Array<{
    id: string
    rating: number
    cleanliness_rating: number
    comment: string | null
    user_id: string
  }>
}

type UiToilet = {
  id: string
  name: string
  building: string
  floor: number
  x: number
  y: number
  gender: 'men' | 'women' | 'all'
  western_style_count: number
  japanese_style_count: number
  urinal_count: number
  has_washlet: boolean
  has_otohime: boolean
  is_multipurpose: boolean
  is_gender_neutral: boolean
  opening_hours: string
  isOpen: boolean
  rating: number
  cleanliness_avg: number
  ratingCount: number
  congestion: 'low' | 'medium' | 'high'
  distance: number
  isNearest: boolean
  reviews: Array<{ user: string; stars: number; text: string }>
  lat: number
  lng: number
}

type BoolFilterKey =
  | 'isOpen'
  | 'highRating'
  | 'multipurpose'
  | 'genderNeutral'
  | 'otohime'
  | 'western'
  | 'washlet'

type FilterState = {
  gender?: string
  isOpen?: boolean
  highRating?: boolean
  ratingMin?: number
  multipurpose?: boolean
  genderNeutral?: boolean
  otohime?: boolean
  western?: boolean
  washlet?: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CONGESTION = {
  low: { color: '#1EBE7A', label: '空き', bg: '#E6F8EF', border: '#9EE0C1' },
  medium: {
    color: '#E8940F',
    label: 'やや混雑',
    bg: '#FEF3E2',
    border: '#F5CB80',
  },
  high: { color: '#D93025', label: '混雑中', bg: '#FDECEA', border: '#F0A8A4' },
}

const GENDER_INFO: Record<string, [string, string]> = {
  men: ['🚹', '男性用'],
  women: ['🚺', '女性用'],
  all: ['🚻', '男女共用'],
}

// ── Filter logic ───────────────────────────────────────────────────────────────
function applyFilters(toilets: UiToilet[], f: FilterState): UiToilet[] {
  return toilets.filter((t) => {
    if (
      f.gender &&
      f.gender !== 'all' &&
      t.gender !== f.gender &&
      t.gender !== 'all'
    )
      return false
    if (f.isOpen && !t.isOpen) return false
    if (f.highRating && t.rating < (f.ratingMin ?? 4.0)) return false
    if (f.ratingMin && !f.highRating && t.rating < f.ratingMin) return false
    if (f.multipurpose && !t.is_multipurpose) return false
    if (f.genderNeutral && !t.is_gender_neutral) return false
    if (f.otohime && !t.has_otohime) return false
    if (f.western && t.western_style_count === 0) return false
    if (f.washlet && !t.has_washlet) return false
    return true
  })
}

function countActive(f: FilterState): number {
  const boolKeys: BoolFilterKey[] = [
    'isOpen',
    'highRating',
    'multipurpose',
    'genderNeutral',
    'otohime',
    'western',
    'washlet',
  ]
  return (
    boolKeys.filter((k) => f[k]).length +
    (f.ratingMin && !f.highRating ? 1 : 0) +
    (f.gender && f.gender !== 'all' ? 1 : 0)
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ic = {
  filter: (c = '#fff') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  close: (c = '#888') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  walk: (c = '#4A92D9') => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="4.5" r="2" fill={c} />
      <path
        d="M7 22l2.5-7-3-2.5 2.5-8 4 4.5 3-3"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  heart: (on: boolean) => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        fill={on ? BRAND : 'none'}
        stroke={on ? BRAND : '#CCC'}
        strokeWidth="1.8"
      />
    </svg>
  ),
  route: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12h18M12 5l7 7-7 7"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  pen: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke="#666"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="#666"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  gps: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="#4A92D9" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke="#4A92D9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  navMap: (on: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4L3 7v14l6-3 6 3 6-3V4l-6 3-6-3z"
        fill={on ? BRAND : 'none'}
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="9"
        y1="4"
        x2="9"
        y2="18"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
      <line
        x1="15"
        y1="7"
        x2="15"
        y2="21"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
    </svg>
  ),
  navBld: (on: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
      <path
        d="M9 3v18M15 3v18M3 9h18M3 15h18"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
    </svg>
  ),
  navCrowd: (on: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="9"
        cy="7"
        r="2.5"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
      <circle
        cx="15"
        cy="7"
        r="2.5"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
      <path
        d="M4 19v-1c0-2.5 2.5-4 5-4h6c2.5 0 5 1.5 5 4v1"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  navUser: (on: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
      />
      <path
        d="M4 20c0-3.8 3.6-6 8-6s8 2.2 8 6"
        stroke={on ? BRAND : '#C0C0C0'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
}

// ── Stars ──────────────────────────────────────────────────────────────────────
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
                <linearGradient id={`g${i}s${size}`} x1="0" x2="1">
                  <stop
                    offset={`${(rating % 1) * 100}%`}
                    stopColor="#F5A623"
                  />
                  <stop
                    offset={`${(rating % 1) * 100}%`}
                    stopColor="#DDD"
                  />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={
                full
                  ? '#F5A623'
                  : half
                    ? `url(#g${i}s${size})`
                    : '#E0E0E0'
              }
            />
          </svg>
        )
      })}
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        flexShrink: 0,
        background: on ? '#1EBE7A' : '#D5D5D5',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background .2s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          transition: 'left .2s',
        }}
      />
    </div>
  )
}

// ── Chip ───────────────────────────────────────────────────────────────────────
function Chip({
  label,
  active,
  onToggle,
}: {
  label: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        flexShrink: 0,
        padding: '7px 15px',
        borderRadius: 20,
        border: `1.5px solid ${active ? '#1EBE7A' : '#C6C6C6'}`,
        background: active ? '#1EBE7A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#333',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all .15s',
        fontFamily: "'Noto Sans JP',system-ui",
        boxShadow: active
          ? '0 2px 8px #1EBE7A55'
          : '0 2px 6px rgba(0,0,0,.13), inset 0 -1px 0 rgba(0,0,0,.07)',
      }}
    >
      {label}
    </button>
  )
}

// ── CampusMap ──────────────────────────────────────────────────────────────────
function CampusMap({
  userPos,
}: {
  userPos: { x: number; y: number } | null
}) {
  const B = '#C0BAB0',
    R = '#D2CCC2',
    BG = '#EDEAE3'
  return (
    <svg
      viewBox="0 0 393 852"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <rect width="393" height="852" fill={BG} />
      {/* Roads */}
      <rect x="0" y="310" width="393" height="30" fill={R} />
      <rect x="0" y="528" width="393" height="28" fill={R} />
      <rect x="120" y="0" width="28" height="852" fill={R} />
      <rect x="250" y="0" width="26" height="852" fill={R} />
      {/* Road center lines */}
      <line
        x1="0"
        y1="325"
        x2="393"
        y2="325"
        stroke="#C5C0B6"
        strokeWidth="1"
        strokeDasharray="12,8"
      />
      <line
        x1="134"
        y1="0"
        x2="134"
        y2="852"
        stroke="#C5C0B6"
        strokeWidth="1"
        strokeDasharray="12,8"
      />
      <line
        x1="263"
        y1="0"
        x2="263"
        y2="852"
        stroke="#C5C0B6"
        strokeWidth="1"
        strokeDasharray="12,8"
      />
      {/* Green area */}
      <rect x="152" y="446" width="94" height="78" rx="6" fill="#B8D4A0" />
      <circle cx="176" cy="476" r="12" fill="#ABCA91" opacity=".9" />
      <circle cx="210" cy="466" r="10" fill="#ABCA91" opacity=".9" />
      <circle cx="228" cy="490" r="9" fill="#ABCA91" opacity=".9" />
      <text x="198" y="516" textAnchor="middle" fontSize="7.5" fill="#96BB7A">
        中央緑地
      </text>
      {/* Row 1 buildings */}
      <rect x="5" y="62" width="111" height="108" rx="6" fill={B} />
      <text x="60" y="118" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        全学教育棟
      </text>
      <rect x="152" y="48" width="94" height="72" rx="6" fill={B} />
      <text x="199" y="87" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        北部食堂
      </text>
      <rect x="278" y="62" width="110" height="108" rx="6" fill={B} />
      <text x="333" y="118" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        学生会館
      </text>
      <rect x="5" y="182" width="111" height="74" rx="6" fill={B} />
      <text x="60" y="221" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        全学(南)
      </text>
      <rect x="152" y="132" width="94" height="68" rx="6" fill={B} />
      <text x="199" y="168" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        ComoNe
      </text>
      <rect x="278" y="182" width="110" height="74" rx="6" fill={B} />
      <text x="333" y="221" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        EI館
      </text>
      {/* Row 2 buildings */}
      <rect x="5" y="344" width="111" height="96" rx="6" fill={B} />
      <text x="60" y="394" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        IB館
      </text>
      <rect x="152" y="344" width="94" height="96" rx="6" fill={B} />
      <text x="199" y="389" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        工学部2号館
      </text>
      <rect x="278" y="342" width="110" height="96" rx="6" fill={B} />
      <text x="333" y="392" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        図書館
      </text>
      <rect x="5" y="450" width="111" height="72" rx="6" fill={B} />
      <text x="60" y="488" textAnchor="middle" fontSize="6.5" fill="#BEBAB4">
        工学部1号館
      </text>
      <rect x="278" y="450" width="110" height="72" rx="6" fill={B} />
      <text x="333" y="488" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        理学館
      </text>
      {/* Row 3 buildings */}
      <rect x="5" y="560" width="111" height="88" rx="6" fill={B} />
      <text x="60" y="607" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        ES館
      </text>
      <rect x="152" y="558" width="94" height="92" rx="6" fill={B} />
      <text x="199" y="607" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        豊田講堂
      </text>
      <rect x="278" y="560" width="110" height="88" rx="6" fill={B} />
      <text x="333" y="607" textAnchor="middle" fontSize="7.5" fill="#BEBAB4">
        南部食堂
      </text>
      {/* Current location */}
      {userPos && (
        <>
          <circle
            cx={`${userPos.x}%`}
            cy={`${userPos.y}%`}
            r="18"
            fill="#4A92D9"
            opacity=".12"
          />
          <circle
            cx={`${userPos.x}%`}
            cy={`${userPos.y}%`}
            r="9"
            fill="white"
          />
          <circle
            cx={`${userPos.x}%`}
            cy={`${userPos.y}%`}
            r="6"
            fill="#4A92D9"
          />
          <circle
            cx={`${userPos.x}%`}
            cy={`${userPos.y}%`}
            r="3"
            fill="white"
            opacity=".6"
          />
        </>
      )}
    </svg>
  )
}

// ── ToiletPin ──────────────────────────────────────────────────────────────────
function ToiletPin({
  t,
  isActive,
  isDimmed,
  onTap,
}: {
  t: UiToilet
  isActive: boolean
  isDimmed: boolean
  onTap: (t: UiToilet) => void
}) {
  const c = CONGESTION[t.congestion]
  const sz = isActive ? 52 : 44
  const genderEmoji =
    t.gender === 'men' ? '🚹' : t.gender === 'women' ? '🚺' : '🚻'

  return (
    <div
      onClick={() => !isDimmed && onTap(t)}
      style={{
        position: 'absolute',
        left: `${t.x}%`,
        top: `${t.y}%`,
        transform: 'translate(-50%,-100%)',
        zIndex: isActive ? 30 : t.isNearest ? 12 : 10,
        opacity: isDimmed ? 0.15 : 1,
        transition: 'opacity .25s',
        cursor: isDimmed ? 'default' : 'pointer',
      }}
    >
      {t.isNearest && !isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 3px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: BRAND,
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            boxShadow: `0 2px 8px ${BRAND}55`,
          }}
        >
          最寄り
        </div>
      )}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            background: '#111',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,.35)',
            animation: 'calloutIn .2s ease',
            transform: 'translateX(-50%)',
            zIndex: 40,
          }}
        >
          {t.building} · {t.distance > 0 ? `${t.distance}m` : '—'}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #111',
            }}
          />
        </div>
      )}
      <div
        style={{
          width: sz,
          height: sz,
          borderRadius: '50% 50% 50% 0',
          background: c.color,
          transform: `rotate(-45deg)${isActive ? ' scale(1.1)' : ''}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive
            ? `0 0 0 3.5px white, 0 0 0 7px ${c.color}80, 0 10px 28px ${c.color}60`
            : t.isNearest
              ? `0 0 0 3px white, 0 0 0 6px ${BRAND}, 0 5px 16px ${c.color}55`
              : `0 0 0 3px white, 0 4px 14px rgba(0,0,0,.3)`,
          transition: 'all .22s cubic-bezier(.34,1.56,.64,1)',
          animation: 'pinDrop .4s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <span
          style={{
            transform: 'rotate(45deg)',
            fontSize: sz * 0.36,
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {genderEmoji}
        </span>
      </div>
    </div>
  )
}

// ── FilterPanel ────────────────────────────────────────────────────────────────
function FilterPanel({
  filters,
  onApply,
  onClose,
  toiletCount,
}: {
  filters: FilterState
  onApply: (f: FilterState) => void
  onClose: () => void
  toiletCount: (f: FilterState) => number
}) {
  const [L, setL] = useState<FilterState>({ ...filters })
  const tog = (k: BoolFilterKey) => setL((p) => ({ ...p, [k]: !p[k] }))
  const setR = (v: number | null) =>
    setL((p) => ({
      ...p,
      ratingMin: v ?? undefined,
      highRating: v != null && v >= 4.0,
    }))
  const setG = (v: string) => setL((p) => ({ ...p, gender: v }))
  const count = toiletCount(L)

  const genders = [
    { v: 'all', label: 'すべて', icon: '🚻' },
    { v: 'men', label: '男性用', icon: '🚹' },
    { v: 'women', label: '女性用', icon: '🚺' },
  ]
  const rOpts: (number | null)[] = [null, 3.0, 4.0, 4.5]
  const facs: { k: BoolFilterKey; icon: string; label: string }[] = [
    { k: 'western', icon: '🚽', label: '洋式トイレ' },
    { k: 'washlet', icon: '💦', label: 'ウォシュレット' },
    { k: 'multipurpose', icon: '♿', label: '多目的ルーム' },
    { k: 'genderNeutral', icon: '⚧️', label: 'GNトイレ' },
    { k: 'otohime', icon: '🎵', label: '乙姫（音姫）' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={onClose}
        style={{ flex: 1, background: 'rgba(0,0,0,.45)', animation: 'fadeIn .2s' }}
      />
      <div
        style={{
          background: '#fff',
          borderRadius: '26px 26px 0 0',
          maxHeight: '80%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp .3s cubic-bezier(.32,.72,0,1)',
          boxShadow: '0 -6px 40px rgba(0,0,0,.18)',
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}
        >
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              background: '#E0E0E0',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px 14px',
            borderBottom: '1px solid #F0F0F0',
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>絞り込み</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setL({})}
              style={{
                background: 'none',
                border: 'none',
                color: BRAND,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              リセット
            </button>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#F2F2F2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {Ic.close()}
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Gender */}
          <div style={{ padding: '16px 20px' }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#AAA',
                letterSpacing: '.06em',
                marginBottom: 10,
              }}
            >
              性別
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {genders.map((g) => {
                const isSelected = (L.gender ?? 'all') === g.v
                return (
                  <button
                    key={g.v}
                    onClick={() => setG(g.v)}
                    style={{
                      flex: 1,
                      padding: '12px 4px',
                      borderRadius: 12,
                      fontFamily: 'inherit',
                      border: `1.5px solid ${isSelected ? '#1EBE7A' : '#EAEAEA'}`,
                      background: isSelected ? '#E5F8EF' : '#FAFAFA',
                      color: isSelected ? '#148E5A' : '#555',
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Rating */}
          <div
            style={{ borderTop: '8px solid #F6F6F6', padding: '16px 20px' }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#AAA',
                letterSpacing: '.06em',
                marginBottom: 10,
              }}
            >
              きれいさ・評価
            </p>
            <div style={{ display: 'flex', gap: 7 }}>
              {rOpts.map((v) => {
                const isSelected = L.ratingMin === (v ?? undefined)
                return (
                  <button
                    key={String(v)}
                    onClick={() => setR(v)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 10,
                      fontFamily: 'inherit',
                      border: `1.5px solid ${isSelected ? '#1EBE7A' : '#EAEAEA'}`,
                      background: isSelected ? '#E5F8EF' : '#FAFAFA',
                      color: isSelected ? '#148E5A' : '#555',
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    {v == null ? 'すべて' : `★${v.toFixed(1)}+`}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Facilities */}
          <div style={{ borderTop: '8px solid #F6F6F6' }}>
            <div style={{ padding: '14px 20px 6px' }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#AAA',
                  letterSpacing: '.06em',
                  marginBottom: 4,
                }}
              >
                設備・機能
              </p>
              {facs.map((item) => (
                <div
                  key={item.k}
                  onClick={() => tog(item.k)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: '1px solid #F5F5F5',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{ fontSize: 22, width: 30, textAlign: 'center' }}
                  >
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, fontSize: 15, color: '#222' }}>
                    {item.label}
                  </span>
                  <Toggle on={!!L[item.k]} onToggle={() => tog(item.k)} />
                </div>
              ))}
            </div>
          </div>
          {/* Open now */}
          <div
            style={{ borderTop: '8px solid #F6F6F6', padding: '0 20px 6px' }}
          >
            <div
              onClick={() => tog('isOpen')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>
                🟢
              </span>
              <span style={{ flex: 1, fontSize: 15, color: '#222' }}>
                今すぐ使える（営業中のみ）
              </span>
              <Toggle on={!!L.isOpen} onToggle={() => tog('isOpen')} />
            </div>
          </div>
          <div style={{ height: 12 }} />
        </div>
        <div
          style={{
            padding: '14px 20px 30px',
            borderTop: '1px solid #F0F0F0',
          }}
        >
          <button
            onClick={() => {
              onApply(L)
              onClose()
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: '#1EBE7A',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '.02em',
            }}
          >
            {count}件を表示する
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ToiletPopup ────────────────────────────────────────────────────────────────
function ToiletPopup({
  t,
  isFav,
  onFavorite,
  onClose,
}: {
  t: UiToilet
  isFav: boolean
  onFavorite: () => void
  onClose: () => void
}) {
  const c = CONGESTION[t.congestion]
  const [gi, gl] = GENDER_INFO[t.gender] ?? ['🚻', '男女共用']

  const facilities = [
    { icon: '🚽', label: `洋式 ${t.western_style_count}個`, show: true },
    {
      icon: '🪑',
      label: `和式 ${t.japanese_style_count}個`,
      show: t.japanese_style_count > 0,
    },
    {
      icon: '🚹',
      label: `小便器 ${t.urinal_count}個`,
      show: t.urinal_count > 0,
    },
    { icon: '💦', label: 'ウォシュレット', show: t.has_washlet },
    { icon: '♿', label: '多目的ルーム', show: t.is_multipurpose },
    { icon: '⚧️', label: 'GNトイレ', show: t.is_gender_neutral },
    { icon: '🎵', label: '乙姫あり', show: t.has_otohime },
  ].filter((f) => f.show)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 83,
        left: 0,
        right: 0,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,.16)',
        zIndex: 100,
        animation: 'slideUp .3s cubic-bezier(.32,.72,0,1)',
        overflowY: 'auto',
        maxHeight: 'calc(100% - 200px)',
      }}
    >
      {/* Drag handle */}
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}
      >
        <div
          style={{
            width: 40,
            height: 5,
            borderRadius: 3,
            background: '#E0E0E0',
          }}
        />
      </div>
      {/* Header */}
      <div style={{ padding: '0 18px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
              {t.floor}F
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onFavorite}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#FBF0F4',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform .15s',
                animation: isFav ? 'heartPop .3s' : undefined,
              }}
            >
              {Ic.heart(isFav)}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#F2F2F2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {Ic.close()}
            </button>
          </div>
        </div>
        <h2
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: '#111',
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {t.name}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#111',
                letterSpacing: '-1px',
              }}
            >
              {t.rating.toFixed(1)}
            </span>
            <Stars rating={t.rating} size={13} />
            <span style={{ fontSize: 11, color: '#BBB' }}>
              ({t.ratingCount})
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: '#E5E5E5' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>
              清潔さ
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#444' }}>
              {t.cleanliness_avg.toFixed(1)}
            </span>
            <Stars rating={t.cleanliness_avg} size={11} />
          </div>
        </div>
      </div>
      {/* Info strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: '#F8F8F8',
          margin: '0 18px 14px',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {[
          {
            label: '混雑状況',
            value: (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: c.color,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: c.color,
                    display: 'inline-block',
                  }}
                />
                {c.label}
              </span>
            ),
          },
          {
            label: '距離',
            value: (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  color: '#4A92D9',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {Ic.walk('#4A92D9')}
                {t.distance > 0 ? `${t.distance}m` : '—'}
              </span>
            ),
          },
          {
            label: '営業時間',
            value: (
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: t.isOpen ? '#1EBE7A' : '#D93025',
                }}
              >
                {t.isOpen ? t.opening_hours : '休止中'}
              </span>
            ),
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '10px 8px',
              textAlign: 'center',
              borderLeft: i > 0 ? '1px solid #EEEEEE' : 'none',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#AAA',
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {item.label}
            </div>
            <div>{item.value}</div>
          </div>
        ))}
      </div>
      {/* Facilities */}
      <div style={{ padding: '0 18px 12px' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#BBB',
            letterSpacing: '.07em',
            marginBottom: 8,
          }}
        >
          設備・機能
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {facilities.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                background: '#F5F5F5',
                borderRadius: 20,
                fontSize: 12,
                color: '#333',
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 15 }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>
      {/* Mini review */}
      {t.reviews[0] && (
        <div
          style={{
            margin: '0 18px 14px',
            background: '#FAFAFA',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Stars rating={t.reviews[0].stars} size={10} />
            <span style={{ fontSize: 11, color: '#AAA' }}>
              — {t.reviews[0].user}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
            {t.reviews[0].text}
          </p>
        </div>
      )}
      {/* CTAs */}
      <div style={{ padding: '0 18px 24px', display: 'flex', gap: 10 }}>
        <button
          style={{
            flex: 1,
            padding: '15px',
            background: '#1EBE7A',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: '.02em',
          }}
        >
          {Ic.route()}案内する
        </button>
        <button
          style={{
            padding: '15px 18px',
            background: '#F2F2F2',
            color: '#555',
            border: 'none',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {Ic.pen()}口コミ
        </button>
      </div>
    </div>
  )
}

// ── AppHeader ──────────────────────────────────────────────────────────────────
function AppHeader({
  filters,
  onOpenPanel,
  onToggleQuick,
  activeCount,
  filteredLen,
}: {
  filters: FilterState
  onOpenPanel: () => void
  onToggleQuick: (k: BoolFilterKey) => void
  activeCount: number
  filteredLen: number
}) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  )

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const QUICK: { id: BoolFilterKey; label: string }[] = [
    { id: 'isOpen', label: '今すぐ使える' },
    { id: 'highRating', label: '★ 4.0以上' },
    { id: 'multipurpose', label: '多目的' },
    { id: 'genderNeutral', label: 'GNトイレ' },
    { id: 'otohime', label: '乙姫あり' },
    { id: 'washlet', label: 'ウォシュレット' },
  ]

  return (
    <div
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200 }}
    >
      {/* Logo + status bar row */}
      <div
        style={{
          background: 'rgba(255,255,255,.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 20px 0',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.3px' }}>
            {time}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="17" height="11" viewBox="0 0 17 11">
              <rect x="0" y="7" width="3" height="4" rx=".5" fill="#222" />
              <rect x="4.5" y="4.5" width="3" height="6.5" rx=".5" fill="#222" />
              <rect x="9" y="2" width="3" height="9" rx=".5" fill="#222" />
              <rect x="13.5" y="0" width="3" height="11" rx=".5" fill="#222" />
            </svg>
            <svg width="24" height="11" viewBox="0 0 24 11">
              <rect
                x=".5"
                y=".5"
                width="20"
                height="10"
                rx="3.5"
                stroke="#222"
                strokeWidth="1.2"
              />
              <rect x="21" y="3.5" width="2.5" height="4" rx="1" fill="#222" />
              <rect x="2" y="2" width="16" height="7" rx="2" fill="#222" />
            </svg>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 18px 10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              大トイレナビ
            </span>
          </div>
        </div>
      </div>
      {/* Filter chip row */}
      <div
        style={{
          background: 'rgba(255,255,255,.90)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={onOpenPanel}
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: BRAND,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: `0 3px 10px ${BRAND}55`,
            }}
          >
            {Ic.filter()}
            {activeCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#D93025',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}
              >
                {activeCount}
              </div>
            )}
          </button>
          {QUICK.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={!!filters[f.id]}
              onToggle={() => onToggleQuick(f.id)}
            />
          ))}
        </div>
        {activeCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 16px 7px',
              borderTop: '1px solid #ECECEC',
            }}
          >
            <span style={{ fontSize: 13, color: '#555' }}>
              <span style={{ fontWeight: 700, color: '#1EBE7A' }}>
                {filteredLen}
              </span>
              件が条件に合致
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BottomNav ──────────────────────────────────────────────────────────────────
function BottomNav() {
  const items = [
    { id: 'map', label: 'マップ', icon: Ic.navMap, href: '/' },
    { id: 'bld', label: '建物', icon: Ic.navBld, href: '/buildings' },
    { id: 'crowd', label: '混雑予測', icon: Ic.navCrowd, href: '/congestion' },
    { id: 'user', label: 'マイページ', icon: Ic.navUser, href: '/mypage' },
  ]
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 83,
        background: 'rgba(255,255,255,.97)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0,0,0,.07)',
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: 12,
        zIndex: 200,
      }}
    >
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            textDecoration: 'none',
          }}
        >
          {it.icon(it.id === 'map')}
          <span
            style={{
              fontSize: 10,
              fontWeight: it.id === 'map' ? 600 : 400,
              color: it.id === 'map' ? BRAND : '#C0C0C0',
            }}
          >
            {it.label}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ── Main ToiletMapApp ──────────────────────────────────────────────────────────
export default function ToiletMapApp({
  toilets: rawToilets,
}: {
  toilets: SupabaseToiletWithReviews[]
}) {
  const [selected, setSelected] = useState<UiToilet | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [panelOpen, setPanelOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [scale, setScale] = useState(1.0)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [userSvgPos, setUserSvgPos] = useState<{
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserPos({ lat, lng })
        setUserSvgPos(latLngToSvgPct(lat, lng))
      })
    }
  }, [])

  const now = new Date()
  const hourDecimal = now.getHours() + now.getMinutes() / 100

  const toilets: UiToilet[] = rawToilets
    .filter((t) => t.lat != null && t.lng != null)
    .map((t) => {
      const lat = t.lat!
      const lng = t.lng!
      const { x, y } = latLngToSvgPct(lat, lng)
      const score = calculateCongestion(t as Parameters<typeof calculateCongestion>[0], hourDecimal)
      const dist = userPos
        ? Math.round(
            getDistanceFromLatLonInM(userPos.lat, userPos.lng, lat, lng)
          )
        : 0

      const gender: 'men' | 'women' | 'all' =
        t.gender === 'men' || t.gender === 'women' ? t.gender : 'all'

      const building =
        t.name
          .replace(/\s*\d+[FＦ階].*$/, '')
          .replace(/\s+トイレ.*$/, '')
          .trim() || t.name

      const reviews = (t.reviews ?? [])
        .filter((r) => r.comment && r.comment.trim())
        .slice(0, 1)
        .map((r) => ({
          user: r.user_id.slice(0, 4).toUpperCase(),
          stars: r.rating,
          text: r.comment!,
        }))

      const cleanAvg =
        t.reviews && t.reviews.length > 0
          ? t.reviews.reduce((sum, r) => sum + (r.cleanliness_rating ?? r.rating), 0) /
            t.reviews.length
          : t.average_rating

      return {
        id: t.id,
        name: t.name,
        building,
        floor: t.floor ?? 1,
        x,
        y,
        gender,
        western_style_count: t.western_style_count ?? 0,
        japanese_style_count: t.japanese_style_count ?? 0,
        urinal_count: t.urinal_count ?? 0,
        has_washlet: t.has_washlet ?? false,
        has_otohime: t.has_otohime ?? false,
        is_multipurpose: t.is_multipurpose ?? false,
        is_gender_neutral: t.is_gender_neutral ?? false,
        opening_hours: t.opening_hours ?? '終日開放',
        isOpen: isCurrentlyOpen(t.opening_hours),
        rating: t.average_rating,
        cleanliness_avg: cleanAvg,
        ratingCount: t.review_count,
        congestion: congestionLevel(score),
        distance: dist,
        isNearest: false,
        reviews,
        lat,
        lng,
      } satisfies UiToilet
    })

  // Mark nearest toilet
  if (userPos && toilets.length > 0) {
    const nearestIdx = toilets.reduce(
      (minI, t, i) =>
        t.distance < (toilets[minI]?.distance ?? Infinity) ? i : minI,
      0
    )
    toilets.forEach((t, i) => {
      t.isNearest = i === nearestIdx
    })
  }

  const filtered = applyFilters(toilets, filters)
  const filteredSet = new Set(filtered.map((t) => t.id))
  const activeCount = countActive(filters)

  const toggleQuick = (k: BoolFilterKey) => {
    setFilters((p) => ({ ...p, [k]: !p[k] }))
    setSelected(null)
  }

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const locateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserPos({ lat, lng })
        setUserSvgPos(latLngToSvgPct(lat, lng))
      })
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#EDEAE3',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Noto Sans JP','Hiragino Sans',system-ui",
      }}
    >
      {/* Full-bleed scalable map layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: '#EDEAE3',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${scale})`,
            transformOrigin: '50% 38%',
            transition: 'transform .35s cubic-bezier(.32,.72,0,1)',
          }}
        >
          <CampusMap userPos={userSvgPos} />
          {toilets.map((t) => (
            <ToiletPin
              key={t.id}
              t={t}
              isActive={selected?.id === t.id}
              isDimmed={!filteredSet.has(t.id)}
              onTap={(tt) =>
                setSelected((p) => (p?.id === tt.id ? null : tt))
              }
            />
          ))}
        </div>
      </div>

      <AppHeader
        filters={filters}
        onOpenPanel={() => setPanelOpen(true)}
        onToggleQuick={toggleQuick}
        activeCount={activeCount}
        filteredLen={filtered.length}
      />

      {/* Congestion legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 93,
          left: 14,
          zIndex: 50,
          background: 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 12,
          padding: '8px 10px',
          boxShadow: '0 2px 12px rgba(0,0,0,.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {Object.entries(CONGESTION).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: v.color,
              }}
            />
            <span style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>
              {v.label}
            </span>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          right: 14,
          zIndex: 50,
          background: 'rgba(255,255,255,.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          onClick={() => setScale((s) => Math.min(+(s + 0.35).toFixed(2), 1.55))}
          style={{
            width: 44,
            height: 44,
            background: 'none',
            border: 'none',
            borderBottom: '1px solid #EEEEEE',
            cursor: scale < 1.55 ? 'pointer' : 'default',
            fontSize: 22,
            fontWeight: 300,
            lineHeight: 1,
            color: scale < 1.55 ? '#333' : '#CCC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            transition: 'color .15s',
          }}
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(+(s - 0.35).toFixed(2), 0.65))}
          style={{
            width: 44,
            height: 44,
            background: 'none',
            border: 'none',
            cursor: scale > 0.65 ? 'pointer' : 'default',
            fontSize: 22,
            fontWeight: 300,
            lineHeight: 1,
            color: scale > 0.65 ? '#333' : '#CCC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            transition: 'color .15s',
          }}
        >
          −
        </button>
      </div>

      {/* GPS button */}
      <div
        onClick={locateUser}
        style={{
          position: 'absolute',
          bottom: 96,
          right: 14,
          zIndex: 50,
          background: 'rgba(255,255,255,.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,.12)',
          cursor: 'pointer',
        }}
      >
        {Ic.gps()}
      </div>

      {selected && (
        <ToiletPopup
          t={selected}
          isFav={favorites.has(selected.id)}
          onFavorite={() => toggleFav(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {panelOpen && (
        <FilterPanel
          filters={filters}
          onApply={(f) => {
            setFilters(f)
            setSelected(null)
          }}
          onClose={() => setPanelOpen(false)}
          toiletCount={(f) => applyFilters(toilets, f).length}
        />
      )}

      <BottomNav />
    </div>
  )
}
