type ReviewCardProps = {
  toilet: string
  rating: number
  comment: string
}

export default function ReviewCard({
  toilet,
  rating,
  comment,
}: ReviewCardProps) {
  return (
    <div className="border rounded-xl p-4 shadow">
      <h3 className="text-lg font-bold">{toilet}</h3>

      <p className="mt-2">{'★'.repeat(rating)}</p>

      <p className="mt-2">{comment}</p>
    </div>
  )
}
