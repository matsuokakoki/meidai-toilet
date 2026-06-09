'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BRAND = '#C41E5A'

function NavMap({ on }: { on: boolean }) {
  const c = on ? BRAND : '#C0C0C0'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4L3 7v14l6-3 6 3 6-3V4l-6 3-6-3z"
        fill={on ? BRAND : 'none'}
        stroke={c}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="9" y1="4" x2="9" y2="18" stroke={c} strokeWidth="1.5" />
      <line x1="15" y1="7" x2="15" y2="21" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

function NavBld({ on }: { on: boolean }) {
  const c = on ? BRAND : '#C0C0C0'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

function NavCrowd({ on }: { on: boolean }) {
  const c = on ? BRAND : '#C0C0C0'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="2.5" stroke={c} strokeWidth="1.5" />
      <circle cx="15" cy="7" r="2.5" stroke={c} strokeWidth="1.5" />
      <path
        d="M4 19v-1c0-2.5 2.5-4 5-4h6c2.5 0 5 1.5 5 4v1"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NavUser({ on }: { on: boolean }) {
  const c = on ? BRAND : '#C0C0C0'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={c} strokeWidth="1.5" />
      <path
        d="M4 20c0-3.8 3.6-6 8-6s8 2.2 8 6"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ITEMS = [
  { id: 'map', label: 'マップ', href: '/', Icon: NavMap },
  { id: 'bld', label: '建物', href: '/buildings', Icon: NavBld },
  { id: 'crowd', label: '混雑予測', href: '/congestion', Icon: NavCrowd },
  { id: 'user', label: 'マイページ', href: '/mypage', Icon: NavUser },
]

export default function SharedBottomNav() {
  const pathname = usePathname()

  const activeId =
    pathname === '/'
      ? 'map'
      : pathname.startsWith('/buildings')
        ? 'bld'
        : pathname.startsWith('/congestion')
          ? 'crowd'
          : pathname.startsWith('/mypage')
            ? 'user'
            : 'map'

  return (
    <div
      style={{
        position: 'fixed',
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
      {ITEMS.map(({ id, label, href, Icon }) => {
        const on = id === activeId
        return (
          <Link
            key={id}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
            }}
          >
            <Icon on={on} />
            <span
              style={{
                fontSize: 10,
                fontWeight: on ? 600 : 400,
                color: on ? BRAND : '#C0C0C0',
                fontFamily: 'inherit',
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
