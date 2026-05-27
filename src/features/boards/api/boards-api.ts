import { apiClient } from '@/lib/api-client'

import type {
  Board,
  BoardCard,
  BoardDetail,
  BoardListWithCards,
  CreateBoardInput,
  CreateCardInput,
  CreateListInput,
  MoveCardInput,
  ToggleBoardStarInput,
  UpdateBoardInput,
  UpdateCardInput,
  UpdateListInput,
} from '../types'

type BoardsResponse = {
  success: true
  data: {
    boards: Board[]
  }
}

type BoardResponse = {
  success: true
  data: {
    board: Board
  }
}

type BoardDetailResponse = {
  success: true
  data: {
    board: BoardDetail
  }
}

type DeleteBoardResponse = {
  success: true
  data: {
    deletedBoardId: string
  }
}

type DeleteCardResponse = {
  success: true
  data: {
    deletedCardId: string
  }
}

type DeleteListResponse = {
  success: true
  data: {
    deletedListId: string
  }
}

type ListResponse = {
  success: true
  data: {
    list: BoardListWithCards
  }
}

type CardResponse = {
  success: true
  data: {
    card: BoardCard
  }
}

export function listBoards() {
  return apiClient.get<BoardsResponse>('/api/boards', {
    credentials: 'include',
  })
}

export function createBoard(input: CreateBoardInput) {
  return apiClient.post<BoardResponse, CreateBoardInput>('/api/boards', input, {
    credentials: 'include',
  })
}

export function getBoard(boardId: string) {
  return apiClient.get<BoardDetailResponse>(`/api/boards/${boardId}`, {
    credentials: 'include',
  })
}

export function updateBoard(boardId: string, input: UpdateBoardInput) {
  return apiClient.patch<BoardResponse, UpdateBoardInput>(
    `/api/boards/${boardId}`,
    input,
    {
      credentials: 'include',
    },
  )
}

export function toggleBoardStar(boardId: string, input: ToggleBoardStarInput) {
  return apiClient.patch<BoardResponse, ToggleBoardStarInput>(
    `/api/boards/${boardId}/star`,
    input,
    {
      credentials: 'include',
    },
  )
}

export function deleteBoard(boardId: string) {
  return apiClient.delete<DeleteBoardResponse>(`/api/boards/${boardId}`, {
    credentials: 'include',
  })
}

export function createList(input: CreateListInput) {
  return apiClient.post<ListResponse, CreateListInput>('/api/lists', input, {
    credentials: 'include',
  })
}

export function updateList(listId: string, input: UpdateListInput) {
  return apiClient.patch<ListResponse, UpdateListInput>(
    `/api/lists/${listId}`,
    input,
    {
      credentials: 'include',
    },
  )
}

export function deleteList(listId: string) {
  return apiClient.delete<DeleteListResponse>(`/api/lists/${listId}`, {
    credentials: 'include',
  })
}

export function createCard(input: CreateCardInput) {
  return apiClient.post<CardResponse, CreateCardInput>('/api/cards', input, {
    credentials: 'include',
  })
}

export function updateCard(cardId: string, input: UpdateCardInput) {
  return apiClient.patch<CardResponse, UpdateCardInput>(
    `/api/cards/${cardId}`,
    input,
    {
      credentials: 'include',
    },
  )
}

export function deleteCard(cardId: string) {
  return apiClient.delete<DeleteCardResponse>(`/api/cards/${cardId}`, {
    credentials: 'include',
  })
}

export function moveCard(input: MoveCardInput) {
  return apiClient.patch<CardResponse, MoveCardInput>(
    '/api/cards/move',
    input,
    {
      credentials: 'include',
    },
  )
}
