type FavoriteCardProps = {
  name: string
}

export default function FavoriteCard({
  name,
}: FavoriteCardProps) {

  return (

    <div className="border rounded-xl p-4 shadow">

      <p className="text-lg">
        ❤️ {name}
      </p>

    </div>

  )
}