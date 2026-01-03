const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8000"

export interface AgentResponse {
  content: string
  confidence_score: number
  Reason?: string
}

export interface BasePromptResponse {
  round: number
  responses: {
    gpt: AgentResponse
    grok: AgentResponse
    gemini: AgentResponse
  }
  confidence_scores: number[][]
}

export interface DiscussionResponse {
  round: number
  responses: {
    gpt: AgentResponse
    grok: AgentResponse
    gemini: AgentResponse
  }
  confidence_scores: number[][]
}

export interface VerdictResponse {
  wallet: string
  verdict: string
  sealed: boolean
}

export const api = {
  async basePrompt(walletAddress: string, prompt: string): Promise<BasePromptResponse> {
    if (!walletAddress) {
      throw new Error("Wallet address is required")
    }
    
    const res = await fetch(`${API_BASE}/base-prompt/${walletAddress}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || `HTTP error ${res.status}`)
    }
    
    return res.json()
  },

  async discuss(
    walletAddress: string,
    roundNo: number,
    userBoost: number[]
  ): Promise<DiscussionResponse> {
    if (!walletAddress) {
      throw new Error("Wallet address is required")
    }
    
    const res = await fetch(`${API_BASE}/discuss/${walletAddress}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round_no: roundNo, user_boost: userBoost }),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || `HTTP error ${res.status}`)
    }
    
    return res.json()
  },

  async verdict(walletAddress: string): Promise<VerdictResponse> {
    if (!walletAddress) {
      throw new Error("Wallet address is required")
    }
    
    const res = await fetch(`${API_BASE}/verdict/${walletAddress}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || `HTTP error ${res.status}`)
    }
    
    return res.json()
  },

  async health(): Promise<{ status: string; redis: string }> {
    const res = await fetch(`${API_BASE}/health`)
    return res.json()
  },
}