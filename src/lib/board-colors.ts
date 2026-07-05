const boardAccentClasses = [
  'bg-flow-blue',
  'bg-flow-purple',
  'bg-flow-green',
  'bg-flow-yellow',
  'bg-flow-cyan',
  'bg-flow-pink',
  'bg-flow-orange',
] as const

export function getBoardAccentClass(boardId: string) {
  let hash = 0

  for (const character of boardId) {
    hash = (hash + character.charCodeAt(0)) % boardAccentClasses.length
  }

  return boardAccentClasses[hash]!
}
