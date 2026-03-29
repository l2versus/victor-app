/**
 * Bot Flow Executor
 *
 * Executes CrmBotFlow records when triggers fire.
 * Flows are stored as node/edge graphs in the DB.
 *
 * Supported triggers: new_lead, status_change, keyword
 * Supported nodes: trigger, delay, message, condition
 *
 * Usage (fire-and-forget):
 *   executeFlowTrigger("new_lead", { leadId, botType, leadName, phone }).catch(console.error)
 */

import { prisma } from "./prisma"
import type { BotType, BotConfig } from "./bot-config"
import { BOT_CONFIGS, sendBotMessage } from "./bot-config"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type FlowTrigger = "new_lead" | "status_change" | "keyword"

export interface FlowContext {
  leadId: string
  botType: BotType
  leadName: string
  phone: string
  message?: string       // for keyword trigger
  oldStatus?: string     // for status_change
  newStatus?: string     // for status_change
}

interface FlowNode {
  id: string
  type: "trigger" | "delay" | "message" | "condition"
  data?: {
    /** delay node: amount of time */
    delayAmount?: number
    /** delay node: unit — minutes, hours, days */
    delayUnit?: "minutes" | "hours" | "days"
    /** message node: text template (supports {{leadName}}, {{phone}}) */
    messageText?: string
    /** condition node: field to check */
    conditionField?: "status" | "temperature"
    /** condition node: operator */
    conditionOp?: "equals" | "not_equals"
    /** condition node: value to compare */
    conditionValue?: string
    /** keyword trigger: keyword to match */
    keyword?: string
    /** status_change trigger: target status */
    targetStatus?: string
  }
}

interface FlowEdge {
  id: string
  source: string
  target: string
  /** For condition nodes: "true" or "false" branch */
  sourceHandle?: string
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════

export async function executeFlowTrigger(
  trigger: FlowTrigger,
  context: FlowContext
): Promise<void> {
  const { botType } = context
  const bot = BOT_CONFIGS[botType]

  console.log(`[FlowExecutor] Trigger "${trigger}" fired for ${bot.name} — lead: ${context.leadName}`)

  // Find active flows matching this trigger
  // For victor/nutri bots, flows may have trainerId/nutritionistId
  // For b2b, flows have trainerId=null AND nutritionistId=null
  const flows = await prisma.crmBotFlow.findMany({
    where: {
      active: true,
      trigger,
      ...(botType === "b2b"
        ? { trainerId: null, nutritionistId: null }
        : botType === "nutri"
          ? { nutritionistId: { not: null } }
          : { trainerId: { not: null } }),
    },
  })

  if (flows.length === 0) {
    console.log(`[FlowExecutor] No active flows for trigger "${trigger}" (${bot.name})`)
    return
  }

  console.log(`[FlowExecutor] Found ${flows.length} flow(s) to execute`)

  for (const flow of flows) {
    try {
      await executeFlow(flow.id, flow.name, flow.nodes as unknown as FlowNode[], flow.edges as unknown as FlowEdge[], context, bot)
    } catch (err) {
      console.error(`[FlowExecutor] Error executing flow "${flow.name}" (${flow.id}):`, err)
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FLOW EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════

async function executeFlow(
  flowId: string,
  flowName: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  context: FlowContext,
  bot: BotConfig
): Promise<void> {
  console.log(`[FlowExecutor] Executing flow "${flowName}" (${flowId})`)

  if (!nodes || nodes.length === 0) {
    console.log(`[FlowExecutor] Flow "${flowName}" has no nodes — skipping`)
    return
  }

  // Find the trigger node (entry point)
  const triggerNode = nodes.find((n) => n.type === "trigger")
  if (!triggerNode) {
    console.log(`[FlowExecutor] Flow "${flowName}" has no trigger node — skipping`)
    return
  }

  // For keyword trigger, check if message matches
  if (context.message && triggerNode.data?.keyword) {
    const keyword = triggerNode.data.keyword.toLowerCase()
    if (!context.message.toLowerCase().includes(keyword)) {
      console.log(`[FlowExecutor] Keyword "${keyword}" not found in message — skipping flow "${flowName}"`)
      return
    }
  }

  // For status_change trigger, check if target status matches
  if (triggerNode.data?.targetStatus && context.newStatus) {
    if (triggerNode.data.targetStatus !== context.newStatus) {
      console.log(`[FlowExecutor] Status "${context.newStatus}" doesn't match target "${triggerNode.data.targetStatus}" — skipping`)
      return
    }
  }

  // Build adjacency map: nodeId → next node ids
  const adjacency = buildAdjacencyMap(edges)

  // Walk the graph starting from the trigger node
  await walkNodes(triggerNode.id, nodes, adjacency, context, bot, flowName)

  console.log(`[FlowExecutor] Flow "${flowName}" completed`)
}

// ═══════════════════════════════════════════════════════════════
// NODE PROCESSORS
// ═══════════════════════════════════════════════════════════════

async function walkNodes(
  currentId: string,
  nodes: FlowNode[],
  adjacency: Map<string, FlowEdge[]>,
  context: FlowContext,
  bot: BotConfig,
  flowName: string
): Promise<void> {
  const node = nodes.find((n) => n.id === currentId)
  if (!node) return

  console.log(`[FlowExecutor] [${flowName}] Processing node: ${node.type} (${node.id})`)

  switch (node.type) {
    case "trigger":
      // Entry point — just continue to next
      break

    case "delay":
      await processDelayNode(node, context, bot, nodes, adjacency, flowName)
      return // delay schedules continuation — don't continue synchronously

    case "message":
      await processMessageNode(node, context, bot)
      break

    case "condition": {
      const result = await processConditionNode(node, context)
      // Follow the correct branch
      const outEdges = adjacency.get(node.id) || []
      const branchEdge = outEdges.find((e) => e.sourceHandle === (result ? "true" : "false"))
      if (branchEdge) {
        await walkNodes(branchEdge.target, nodes, adjacency, context, bot, flowName)
      } else {
        console.log(`[FlowExecutor] [${flowName}] No "${result}" branch from condition — stopping`)
      }
      return // condition handles its own branching
    }

    default:
      console.log(`[FlowExecutor] [${flowName}] Unknown node type: ${node.type} — skipping`)
  }

  // Continue to next nodes (non-branching)
  const nextEdges = adjacency.get(currentId) || []
  for (const edge of nextEdges) {
    await walkNodes(edge.target, nodes, adjacency, context, bot, flowName)
  }
}

async function processDelayNode(
  node: FlowNode,
  context: FlowContext,
  bot: BotConfig,
  nodes: FlowNode[],
  adjacency: Map<string, FlowEdge[]>,
  flowName: string
): Promise<void> {
  const amount = node.data?.delayAmount ?? 1
  const unit = node.data?.delayUnit ?? "minutes"

  let delayMs: number
  switch (unit) {
    case "hours":
      delayMs = amount * 60 * 60 * 1000
      break
    case "days":
      delayMs = amount * 24 * 60 * 60 * 1000
      break
    default: // minutes
      delayMs = amount * 60 * 1000
  }

  // Cap at 24 hours for setTimeout safety (longer delays should use cron)
  const maxDelay = 24 * 60 * 60 * 1000
  if (delayMs > maxDelay) {
    console.log(`[FlowExecutor] [${flowName}] Delay ${amount} ${unit} exceeds 24h — capping at 24h`)
    delayMs = maxDelay
  }

  console.log(`[FlowExecutor] [${flowName}] Scheduling continuation after ${amount} ${unit} (${delayMs}ms)`)

  // Schedule continuation (fire-and-forget)
  setTimeout(() => {
    const nextEdges = adjacency.get(node.id) || []
    for (const edge of nextEdges) {
      walkNodes(edge.target, nodes, adjacency, context, bot, flowName).catch((err) =>
        console.error(`[FlowExecutor] [${flowName}] Delayed continuation error:`, err)
      )
    }
  }, delayMs)
}

async function processMessageNode(
  node: FlowNode,
  context: FlowContext,
  bot: BotConfig
): Promise<void> {
  let text = node.data?.messageText
  if (!text) {
    console.log(`[FlowExecutor] Message node has no text — skipping`)
    return
  }

  // Template substitution
  text = text
    .replace(/\{\{leadName\}\}/g, context.leadName)
    .replace(/\{\{phone\}\}/g, context.phone)
    .replace(/\{\{botName\}\}/g, bot.displayName)

  console.log(`[FlowExecutor] Sending message to ${context.phone}: "${text.slice(0, 80)}..."`)

  const sent = await sendBotMessage(bot, context.phone, text)
  if (!sent) {
    console.error(`[FlowExecutor] Failed to send message to ${context.phone}`)
  }
}

async function processConditionNode(
  node: FlowNode,
  context: FlowContext
): Promise<boolean> {
  const field = node.data?.conditionField
  const op = node.data?.conditionOp ?? "equals"
  const value = node.data?.conditionValue

  if (!field || !value) {
    console.log(`[FlowExecutor] Condition node missing field/value — defaulting to true`)
    return true
  }

  // Fetch current lead state from DB
  let currentValue: string | null = null

  if (context.botType === "b2b") {
    const lead = await prisma.saasLead.findUnique({
      where: { id: context.leadId },
      select: { status: true, temperature: true },
    })
    if (lead) {
      currentValue = field === "status" ? lead.status : lead.temperature
    }
  } else {
    const lead = await prisma.lead.findUnique({
      where: { id: context.leadId },
      select: { status: true, temperature: true },
    })
    if (lead) {
      currentValue = field === "status" ? lead.status : lead.temperature
    }
  }

  const result = op === "equals"
    ? currentValue === value
    : currentValue !== value

  console.log(`[FlowExecutor] Condition: ${field} ${op} "${value}" → current="${currentValue}" → ${result}`)

  return result
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

function buildAdjacencyMap(edges: FlowEdge[]): Map<string, FlowEdge[]> {
  const map = new Map<string, FlowEdge[]>()
  if (!edges) return map

  for (const edge of edges) {
    const existing = map.get(edge.source) || []
    existing.push(edge)
    map.set(edge.source, existing)
  }

  return map
}
