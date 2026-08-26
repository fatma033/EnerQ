/**
 * Shared contract every specialist agent returns to the coordinator
 * (EnerQAgentOrchestrator). Each agent hands back the domain data it
 * computed plus a ready-to-display log entry -- the coordinator's only
 * job is to merge that into shared state and notify subscribers.
 */
export interface AgentLogPayload {
  title: string;
  detail: string;
  metrics?: { label: string; value: string }[];
  badge?: string;
}
