export type DashboardMovement = {
  description: string
  createdAtUtc: string
  amount: number
}

export type Dashboard = {
  craftsmanId: string
  fullName: string
  level: string
  balance: number
  rewardValueTry: number
  pointsToNextLevel: number
  movements: DashboardMovement[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5028'

export async function getDemoDashboard(signal?: AbortSignal): Promise<Dashboard> {
  const response = await fetch(`${apiBaseUrl}/api/demo/dashboard`, { signal })
  if (!response.ok) {
    throw new Error(`Dashboard alınamadı: ${response.status}`)
  }

  return response.json() as Promise<Dashboard>
}
