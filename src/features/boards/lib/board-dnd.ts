import type { BoardDetail } from '../types'

type MoveCardInput = {
  cardId: string
  toListId: string
  toIndex: number
}

function normalizeCards(
  cards: BoardDetail['lists'][number]['cards'],
  listId: string,
) {
  return cards.map((card, index) => ({
    ...card,
    listId,
    position: index,
  }))
}

export function moveCardInBoard(board: BoardDetail, input: MoveCardInput) {
  const fromList = board.lists.find((list) =>
    list.cards.some((card) => card.id === input.cardId),
  )
  const toList = board.lists.find((list) => list.id === input.toListId)
  const movingCard = fromList?.cards.find((card) => card.id === input.cardId)

  if (!fromList || !toList || !movingCard) {
    return board
  }

  const withoutMovingCard = board.lists.map((list) => ({
    ...list,
    cards: list.cards.filter((card) => card.id !== input.cardId),
  }))
  const targetList = withoutMovingCard.find(
    (list) => list.id === input.toListId,
  )

  if (!targetList) {
    return board
  }

  const insertIndex = Math.max(
    0,
    Math.min(input.toIndex, targetList.cards.length),
  )
  const nextTargetCards = [...targetList.cards]

  nextTargetCards.splice(insertIndex, 0, {
    ...movingCard,
    listId: input.toListId,
  })

  return {
    ...board,
    lists: withoutMovingCard.map((list) => {
      if (list.id === input.toListId) {
        return {
          ...list,
          cards: normalizeCards(nextTargetCards, list.id),
        }
      }

      return {
        ...list,
        cards: normalizeCards(list.cards, list.id),
      }
    }),
  }
}
