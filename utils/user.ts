export function getUserId() {
  let userId = localStorage.getItem('user_id')

  if (!userId) {
    userId = crypto.randomUUID()

    localStorage.setItem('user_id', userId)
  }

  return userId
}
