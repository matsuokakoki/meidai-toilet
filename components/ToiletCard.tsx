type ToiletCardProps = {
  name: string
  rating: number
  washlet: boolean
}

export default function ToiletCard({
  name,
  rating,
  washlet,
}: ToiletCardProps) {

  return (

    <div className="border rounded-xl p-4 shadow">

      <h2 className="text-xl font-bold">
        {name}
      </h2>

      <p className="mt-2">
        ★ {rating}
      </p>

      <p>
        ウォシュレット：
        {washlet ? "○" : "×"}
      </p>

    </div>

  )
}