import Link from 'next/link'

export default function MyPage() {
  return (
    <div>
      <h1>マイページ</h1>

      <Link href="/buildings">トイレ一覧へ</Link>
    </div>
  )
}
