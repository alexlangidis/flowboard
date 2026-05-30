export type WorkerBindings = {
  DATABASE_URL: string
  NEON_AUTH_URL?: string
  VITE_NEON_AUTH_URL?: string
}

export type AppEnv = {
  Bindings: WorkerBindings
}
