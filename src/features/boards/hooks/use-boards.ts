import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as boardsApi from '../api/boards-api'
import { moveCardInBoard } from '../lib/board-dnd'
import type { BoardDetail } from '../types'

type BoardDetailResponse = {
  success: true
  data: {
    board: BoardDetail
  }
}

function updateCardInBoard(
  board: BoardDetail,
  cardId: string,
  input: Parameters<typeof boardsApi.updateCard>[1],
) {
  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ...input,
            }
          : card,
      ),
    })),
  }
}

function removeCardFromBoard(board: BoardDetail, cardId: string) {
  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards
        .filter((card) => card.id !== cardId)
        .map((card, position) => ({
          ...card,
          position,
        })),
    })),
  }
}

function updateListInBoard(
  board: BoardDetail,
  listId: string,
  input: Parameters<typeof boardsApi.updateList>[1],
) {
  return {
    ...board,
    lists: board.lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            ...input,
          }
        : list,
    ),
  }
}

function removeListFromBoard(board: BoardDetail, listId: string) {
  return {
    ...board,
    lists: board.lists
      .filter((list) => list.id !== listId)
      .map((list, position) => ({
        ...list,
        position,
      })),
  }
}

export const boardsQueryKey = ['boards'] as const
export const boardQueryKey = (boardId: string) => ['boards', boardId] as const

export function useBoardsQuery() {
  return useQuery({
    queryKey: boardsQueryKey,
    queryFn: boardsApi.listBoards,
  })
}

export function useBoardQuery(boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => boardsApi.getBoard(boardId),
    enabled,
  })
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.createBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useUpdateBoardMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Parameters<typeof boardsApi.updateBoard>[1]) =>
      boardsApi.updateBoard(boardId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
    },
  })
}

export function useToggleBoardStarMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Parameters<typeof boardsApi.toggleBoardStar>[1]) =>
      boardsApi.toggleBoardStar(boardId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
    },
  })
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.deleteBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useCreateListMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.createList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
    },
  })
}

export function useUpdateListMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      input,
      listId,
    }: {
      input: Parameters<typeof boardsApi.updateList>[1]
      listId: string
    }) => boardsApi.updateList(listId, input),
    onMutate: async ({ input, listId }) => {
      const queryKey = boardQueryKey(boardId)

      await queryClient.cancelQueries({ queryKey })

      const previousBoardResponse =
        queryClient.getQueryData<BoardDetailResponse>(queryKey)

      if (previousBoardResponse) {
        queryClient.setQueryData<BoardDetailResponse>(queryKey, {
          ...previousBoardResponse,
          data: {
            board: updateListInBoard(
              previousBoardResponse.data.board,
              listId,
              input,
            ),
          },
        })
      }

      return { previousBoardResponse }
    },
    onError: (_error, _input, context) => {
      if (context?.previousBoardResponse) {
        queryClient.setQueryData(
          boardQueryKey(boardId),
          context.previousBoardResponse,
        )
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
    },
  })
}

export function useDeleteListMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.deleteList,
    onMutate: async (listId) => {
      const queryKey = boardQueryKey(boardId)

      await queryClient.cancelQueries({ queryKey })

      const previousBoardResponse =
        queryClient.getQueryData<BoardDetailResponse>(queryKey)

      if (previousBoardResponse) {
        queryClient.setQueryData<BoardDetailResponse>(queryKey, {
          ...previousBoardResponse,
          data: {
            board: removeListFromBoard(
              previousBoardResponse.data.board,
              listId,
            ),
          },
        })
      }

      return { previousBoardResponse }
    },
    onError: (_error, _listId, context) => {
      if (context?.previousBoardResponse) {
        queryClient.setQueryData(
          boardQueryKey(boardId),
          context.previousBoardResponse,
        )
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
    },
  })
}

export function useCreateCardMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.createCard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
    },
  })
}

export function useUpdateCardMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      cardId,
      input,
    }: {
      cardId: string
      input: Parameters<typeof boardsApi.updateCard>[1]
    }) => boardsApi.updateCard(cardId, input),
    onMutate: async ({ cardId, input }) => {
      const queryKey = boardQueryKey(boardId)

      await queryClient.cancelQueries({ queryKey })

      const previousBoardResponse =
        queryClient.getQueryData<BoardDetailResponse>(queryKey)

      if (previousBoardResponse) {
        queryClient.setQueryData<BoardDetailResponse>(queryKey, {
          ...previousBoardResponse,
          data: {
            board: updateCardInBoard(
              previousBoardResponse.data.board,
              cardId,
              input,
            ),
          },
        })
      }

      return { previousBoardResponse }
    },
    onError: (_error, _input, context) => {
      if (context?.previousBoardResponse) {
        queryClient.setQueryData(
          boardQueryKey(boardId),
          context.previousBoardResponse,
        )
      }
    },
    onSuccess: (response) => {
      const queryKey = boardQueryKey(boardId)
      const currentBoardResponse =
        queryClient.getQueryData<BoardDetailResponse>(queryKey)

      if (currentBoardResponse) {
        queryClient.setQueryData<BoardDetailResponse>(queryKey, {
          ...currentBoardResponse,
          data: {
            board: updateCardInBoard(
              currentBoardResponse.data.board,
              response.data.card.id,
              response.data.card,
            ),
          },
        })
      }

      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useDeleteCardMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.deleteCard,
    onMutate: async (cardId) => {
      const queryKey = boardQueryKey(boardId)

      await queryClient.cancelQueries({ queryKey })

      const previousBoardResponse =
        queryClient.getQueryData<BoardDetailResponse>(queryKey)

      if (previousBoardResponse) {
        queryClient.setQueryData<BoardDetailResponse>(queryKey, {
          ...previousBoardResponse,
          data: {
            board: removeCardFromBoard(
              previousBoardResponse.data.board,
              cardId,
            ),
          },
        })
      }

      return { previousBoardResponse }
    },
    onError: (_error, _cardId, context) => {
      if (context?.previousBoardResponse) {
        queryClient.setQueryData(
          boardQueryKey(boardId),
          context.previousBoardResponse,
        )
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) })
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useMoveCardMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.moveCard,
    onMutate: async (input) => {
      const queryKey = boardQueryKey(boardId)

      await queryClient.cancelQueries({ queryKey })

      const previousBoardResponse =
        queryClient.getQueryData<BoardDetailResponse>(queryKey)

      if (previousBoardResponse) {
        queryClient.setQueryData(queryKey, {
          ...previousBoardResponse,
          data: {
            board: moveCardInBoard(previousBoardResponse.data.board, input),
          },
        })
      }

      return { previousBoardResponse }
    },
    onError: (_error, _input, context) => {
      if (context?.previousBoardResponse) {
        queryClient.setQueryData(
          boardQueryKey(boardId),
          context.previousBoardResponse,
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({
        queryKey: boardQueryKey(boardId),
        refetchType: 'inactive',
      })
    },
  })
}
