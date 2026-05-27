export type WorkerBindings = {
  DATABASE_URL: string
  AUTH_SECRET: string
  ATTACHMENTS_BUCKET: R2Bucket
}

export type AppEnv = {
  Bindings: WorkerBindings
}
