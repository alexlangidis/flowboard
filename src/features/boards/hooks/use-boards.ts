import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as boardsApi from '../api/boards-api'
import { moveCardInBoard } from '../lib/board-dnd'
import type { BoardDetail } from '../types'

export const boardsQueryKey = ['boards'] as const
export const boardQueryKey = (boardId: string) => ['boards', boardId] as const

export function useBoardsQuery() {
  return useQuery({
    queryKey: boardsQueryKey,
    queryFn: boardsApi.listBoards,
  })
}

export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => boardsApi.getBoard(boardId),
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

export function useMoveCardMutation(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsApi.moveCard,
    onMutate: async (input) => {
      const queryKey = boardQueryKey(boardId)

      await queryClient.cancelQueries({ queryKey })

      const previousBoardResponse = queryClient.getQueryData<{
        success: true
        data: {
          board: BoardDetail
        }
      }>(queryKey)

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
