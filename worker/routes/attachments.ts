import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { createDb } from '../db/client'
import {
  attachments,
  boards,
  cards,
  lists,
  workspaceMembers,
} from '../db/schema'
import { getCurrentUser } from '../lib/auth'
import type { AppEnv } from '../lib/env'
import { parseJsonBody } from '../lib/validation'

const allowedContentTypes = new Set([
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
])
const maxAttachmentSizeBytes = 10 * 1024 * 1024
const maxAttachmentsPerCard = 10

const updateAttachmentSchema = z.object({
  fileName: z.string().min(1).max(180),
})

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[/\\]/g, '-')
    .replace(/[^\w .-]/g, '_')
    .slice(0, 180)
}

function contentDisposition(
  disposition: 'attachment' | 'inline',
  fileName: string,
) {
  const safeFileName = sanitizeFileName(fileName) || 'attachment'
  const encodedFileName = encodeURIComponent(safeFileName)

  return `${disposition}; filename="${safeFileName.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedFileName}`
}

function serializeAttachment(attachment: {
  id: string
  cardId: string
  uploadedById: string
  fileName: string
  contentType: string | null
  sizeBytes: number | null
  createdAt: Date
}) {
  return {
    id: attachment.id,
    cardId: attachment.cardId,
    uploadedById: attachment.uploadedById,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    createdAt: attachment.createdAt.toISOString(),
  }
}

async function getAccessibleCard(
  db: ReturnType<typeof createDb>,
  cardId: string,
  userId: string,
) {
  const [card] = await db
    .select({
      id: cards.id,
      boardId: boards.id,
      workspaceId: boards.workspaceId,
    })
    .from(cards)
    .innerJoin(lists, eq(lists.id, cards.listId))
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, boards.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(cards.id, cardId))
    .limit(1)

  return card
}

async function getAccessibleAttachment(
  db: ReturnType<typeof createDb>,
  attachmentId: string,
  userId: string,
) {
  const [attachment] = await db
    .select({
      id: attachments.id,
      cardId: attachments.cardId,
      uploadedById: attachments.uploadedById,
      fileName: attachments.fileName,
      objectKey: attachments.objectKey,
      contentType: attachments.contentType,
      sizeBytes: attachments.sizeBytes,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .innerJoin(cards, eq(cards.id, attachments.cardId))
    .innerJoin(lists, eq(lists.id, cards.listId))
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.workspaceId, boards.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .where(eq(attachments.id, attachmentId))
    .limit(1)

  return attachment
}

export const attachmentRoutes = new Hono<AppEnv>()
  .get('/cards/:cardId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const cardId = c.req.param('cardId')
    const card = await getAccessibleCard(db, cardId, user.id)

    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }

    const cardAttachments = await db
      .select({
        id: attachments.id,
        cardId: attachments.cardId,
        uploadedById: attachments.uploadedById,
        fileName: attachments.fileName,
        contentType: attachments.contentType,
        sizeBytes: attachments.sizeBytes,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.cardId, cardId))
      .orderBy(attachments.createdAt)

    return c.json({
      success: true,
      data: {
        attachments: cardAttachments.map(serializeAttachment),
      },
    })
  })
  .post('/cards/:cardId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const cardId = c.req.param('cardId')
    const card = await getAccessibleCard(db, cardId, user.id)

    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attachments)
      .where(eq(attachments.cardId, cardId))

    if (count >= maxAttachmentsPerCard) {
      return c.json(
        {
          success: false,
          error: 'This card already has the maximum number of attachments',
        },
        400,
      )
    }

    const formData = await c.req.raw.formData()
    const file = formData.get('file') as unknown

    if (!(file instanceof File)) {
      return c.json({ success: false, error: 'File is required' }, 400)
    }

    if (!allowedContentTypes.has(file.type)) {
      return c.json({ success: false, error: 'File type is not allowed' }, 400)
    }

    if (file.size > maxAttachmentSizeBytes) {
      return c.json(
        { success: false, error: 'File must be 10 MB or smaller' },
        400,
      )
    }

    const safeFileName = sanitizeFileName(file.name) || 'attachment'
    const attachmentId = crypto.randomUUID()
    const objectKey = [
      'users',
      user.id,
      'workspaces',
      card.workspaceId,
      'boards',
      card.boardId,
      'cards',
      card.id,
      `${attachmentId}-${safeFileName}`,
    ].join('/')

    await c.env.ATTACHMENTS_BUCKET.put(objectKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        attachmentId,
        cardId,
        uploadedById: user.id,
      },
    })

    const uploadedObject = await c.env.ATTACHMENTS_BUCKET.head(objectKey)

    if (!uploadedObject) {
      console.error('R2 attachment upload verification failed', {
        attachmentId,
        cardId,
        objectKey,
      })

      return c.json(
        { success: false, error: 'Unable to store attachment file' },
        500,
      )
    }

    const insertAttachment = () =>
      db
        .insert(attachments)
        .values({
          id: attachmentId,
          cardId,
          uploadedById: user.id,
          fileName: safeFileName,
          objectKey,
          contentType: file.type,
          sizeBytes: file.size,
        })
        .returning({
          id: attachments.id,
          cardId: attachments.cardId,
          uploadedById: attachments.uploadedById,
          fileName: attachments.fileName,
          contentType: attachments.contentType,
          sizeBytes: attachments.sizeBytes,
          createdAt: attachments.createdAt,
        })

    let attachment: Awaited<ReturnType<typeof insertAttachment>>[number]

    try {
      const [createdAttachment] = await insertAttachment()
      attachment = createdAttachment
    } catch (error) {
      await c.env.ATTACHMENTS_BUCKET.delete(objectKey)
      throw error
    }

    return c.json(
      {
        success: true,
        data: {
          attachment: serializeAttachment(attachment),
        },
      },
      201,
    )
  })
  .patch('/:attachmentId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const attachmentId = c.req.param('attachmentId')
    const attachment = await getAccessibleAttachment(db, attachmentId, user.id)

    if (!attachment) {
      return c.json({ success: false, error: 'Attachment not found' }, 404)
    }

    const input = await parseJsonBody(c.req.raw, updateAttachmentSchema)
    const [updatedAttachment] = await db
      .update(attachments)
      .set({
        fileName: sanitizeFileName(input.fileName) || attachment.fileName,
      })
      .where(eq(attachments.id, attachmentId))
      .returning({
        id: attachments.id,
        cardId: attachments.cardId,
        uploadedById: attachments.uploadedById,
        fileName: attachments.fileName,
        contentType: attachments.contentType,
        sizeBytes: attachments.sizeBytes,
        createdAt: attachments.createdAt,
      })

    return c.json({
      success: true,
      data: {
        attachment: serializeAttachment(updatedAttachment),
      },
    })
  })
  .delete('/:attachmentId', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const db = createDb(c.env)
    const attachmentId = c.req.param('attachmentId')
    const attachment = await getAccessibleAttachment(db, attachmentId, user.id)

    if (!attachment) {
      return c.json({ success: false, error: 'Attachment not found' }, 404)
    }

    await c.env.ATTACHMENTS_BUCKET.delete(attachment.objectKey)
    await db.delete(attachments).where(eq(attachments.id, attachmentId))

    return c.json({
      success: true,
      data: {
        deletedAttachmentId: attachmentId,
      },
    })
  })
  .get('/:attachmentId/:mode', async (c) => {
    const user = await getCurrentUser(c)

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const mode = c.req.param('mode')

    if (mode !== 'open' && mode !== 'download') {
      return c.json({ success: false, error: 'Not found' }, 404)
    }

    const db = createDb(c.env)
    const attachment = await getAccessibleAttachment(
      db,
      c.req.param('attachmentId'),
      user.id,
    )

    if (!attachment) {
      return c.json({ success: false, error: 'Attachment not found' }, 404)
    }

    const object = await c.env.ATTACHMENTS_BUCKET.get(attachment.objectKey)

    if (!object) {
      return c.json({ success: false, error: 'Attachment file not found' }, 404)
    }

    return new Response(object.body, {
      headers: {
        'Content-Disposition': contentDisposition(
          mode === 'download' ? 'attachment' : 'inline',
          attachment.fileName,
        ),
        'Content-Length': String(object.size),
        'Content-Type': attachment.contentType ?? 'application/octet-stream',
      },
    })
  })
