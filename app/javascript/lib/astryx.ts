export function astryxStatus(messages?: string[]) {
  if (!messages?.length) return undefined

  return {
    type: "error" as const,
    message: messages.join(". "),
  }
}
