import type { WorkerBindings } from './env'

export function getAttachmentsBucket(env: WorkerBindings) {
  return env.ATTACHMENTS_BUCKET
}
