export type WorkerBindings = {
  ATTACHMENTS_BUCKET: R2Bucket
  DATABASE_URL: string
  NEON_AUTH_URL?: string
  VITE_NEON_AUTH_URL?: string
}

export type AppEnv = {
  Bindings: WorkerBindings
}
