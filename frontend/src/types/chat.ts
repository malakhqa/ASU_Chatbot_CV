// Mirrors backend app/schemas/chat.py.

export type MessageRole = 'user' | 'assistant' | 'system'

export type CVActionVerb = 'add' | 'remove' | 'replace' | 'update'
export type CVActionSection =
  'summary' | 'skills' | 'education' | 'experience' | 'projects' | 'certifications' | 'languages'

export interface CVAction {
  type: 'cv_update'
  section: CVActionSection
  action: CVActionVerb
  content: unknown
}

export interface ChatMessage {
  id: number
  role: MessageRole
  content: string
  action: Record<string, unknown> | null
  created_at: string
}

export interface ChatSendRequest {
  message: string
  conversation_id?: number
  cv_id?: number
  job_description_id?: number
}

export interface ChatSendResponse {
  conversation_id: number
  message: ChatMessage
  proposed_action: CVAction | null
  applied: boolean
  cv_version_number: number | null
}

export interface ConversationSummary {
  id: number
  title: string | null
  created_at: string
  updated_at: string
}

export interface ConversationResponse extends ConversationSummary {
  messages: ChatMessage[]
}
