import { describe, expect, it } from 'vitest'

import { moveCardInBoard } from './board-dnd'
import type { BoardDetail } from '../types'

const board: BoardDetail = {
  id: 'board-1',
  workspaceId: 'workspace-1',
  workspaceName: 'Workspace',
  name: 'Board',
  description: null,
  visibility: 'Workspace',
  isStarred: false,
  updatedAt: '2026-05-27T00:00:00.000Z',
  lists: [
    {
      id: 'list-1',
      boardId: 'board-1',
      name: 'Todo',
      position: 0,
      cards: [
        {
          id: 'card-1',
          listId: 'list-1',
          title: 'First',
          description: null,
          completed: false,
          position: 0,
        },
        {
          id: 'card-2',
          listId: 'list-1',
          title: 'Second',
          description: null,
          completed: false,
          position: 1,
        },
      ],
    },
    {
      id: 'list-2',
      boardId: 'board-1',
      name: 'Done',
      position: 1,
      cards: [],
    },
  ],
}

describe('moveCardInBoard', () => {
  it('moves a card across lists and normalizes positions', () => {
    const result = moveCardInBoard(board, {
      cardId: 'card-2',
      toListId: 'list-2',
      toIndex: 0,
    })

    expect(result.lists[0].cards.map((card) => card.id)).toEqual(['card-1'])
    expect(result.lists[1].cards.map((card) => card.id)).toEqual(['card-2'])
    expect(result.lists[0].cards[0]).toMatchObject({
      listId: 'list-1',
      position: 0,
    })
    expect(result.lists[1].cards[0]).toMatchObject({
      listId: 'list-2',
      position: 0,
    })
  })
})
