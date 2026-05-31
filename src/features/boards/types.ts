export type Board = {
  id: string
  workspaceId: string
  workspaceName: string
  name: string
  description: string | null
  visibility: 'Workspace'
  isStarred: boolean
  updatedAt: string
}

export type BoardCard = {
  id: string
  listId: string
  title: string
  description: string | null
  completed: boolean
  position: number
  comments?: BoardCardComment[]
}

export type BoardCardComment = {
  id: string
  cardId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  updatedAt: string
}

export type BoardListWithCards = {
  id: string
  boardId: string
  name: string
  position: number
  cards: BoardCard[]
}

export type BoardDetail = Board & {
  lists: BoardListWithCards[]
}

export type CreateBoardInput = {
  name: string
  description?: string
}

export type UpdateBoardInput = {
  name?: string
  description?: string | null
}

export type ToggleBoardStarInput = {
  isStarred: boolean
}

export type CreateListInput = {
  boardId: string
  name: string
}

export type UpdateListInput = {
  name: string
}

export type CreateCardInput = {
  listId: string
  title: string
  description?: string
}

export type UpdateCardInput = {
  title?: string
  description?: string | null
  completed?: boolean
}

export type MoveCardInput = {
  cardId: string
  toListId: string
  toIndex: number
}

export type MoveListInput = {
  listId: string
  toIndex: number
}

export type CreateCardCommentInput = {
  body: string
}

export type UpdateCardCommentInput = {
  body: string
}
