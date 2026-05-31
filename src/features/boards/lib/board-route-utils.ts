import type { BoardDetail } from '@/features/boards/types'

export function findCard(board: BoardDetail, cardId: string) {
  for (const list of board.lists) {
    const card = list.cards.find((listCard) => listCard.id === cardId)

    if (card) {
      return card
    }
  }

  return null
}

export function getDropTarget(board: BoardDetail, overId: string) {
  const overList = board.lists.find((list) => list.id === overId)

  if (overList) {
    return {
      toListId: overList.id,
      toIndex: overList.cards.length,
    }
  }

  for (const list of board.lists) {
    const cardIndex = list.cards.findIndex((card) => card.id === overId)

    if (cardIndex >= 0) {
      return {
        toListId: list.id,
        toIndex: cardIndex,
      }
    }
  }

  return null
}
