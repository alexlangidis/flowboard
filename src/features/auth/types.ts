export type AuthUser = {
  id: string
  email: string
  name: string
}

export type AuthResponse = {
  success: true
  data: {
    user: AuthUser | null
  }
}
