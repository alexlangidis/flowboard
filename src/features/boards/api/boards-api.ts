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

export function createCard(input: CreateCardInput) {
  return apiClient.post<CardResponse, CreateCardInput>('/api/cards', input, {
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
