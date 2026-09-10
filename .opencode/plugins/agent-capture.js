import { mkdirSync, writeFileSync, appendFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"

const MODEL = "opencode-go/gpt-5.6-luna"
const logged = new Set()

function textFromParts(parts = []) {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
}

function timestamp() {
  return new Date().toISOString()
}

function yaml(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("\n", " ").replaceAll('"', '\\"')
}

export const AgentCapture = async ({ directory, client }) => {
  const logsDir = path.join(directory, ".agent-logs")

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      const sessionId = event.properties?.sessionID
      if (!sessionId || logged.has(sessionId)) return

      const messageResult = await client.session.messages({ path: { id: sessionId } })
      const messages = messageResult.data ?? messageResult
      const userIndex = messages.findLastIndex((message) => message.info?.role === "user")
      if (userIndex < 0) return

      const user = messages[userIndex]
      const assistant = messages
        .slice(userIndex + 1)
        .findLast((message) => message.info?.role === "assistant" && textFromParts(message.parts))
      if (!assistant) return

      const prompt = textFromParts(user.parts)
      const response = textFromParts(assistant.parts)
      if (!prompt || !response) return

      mkdirSync(logsDir, { recursive: true })
      const date = timestamp()
      const fileName = `${date.slice(0, 19).replace("T", "_").replaceAll(":", "-")}_${sessionId}.md`
      const filePath = path.join(logsDir, fileName)
      const existing = await readFile(filePath, "utf8").catch(() => "")
      const count = (existing.match(/\[LOG_ENTRY type=PROMPT/g) || []).length + 1
      const model = assistant.info?.modelID ? `${assistant.info.providerID}/${assistant.info.modelID}` : MODEL

      if (!existing) {
        writeFileSync(
          filePath,
          `---\nsession_id: ${yaml(sessionId)}\ndate: ${date.slice(0, 10)}\nauthor: opencode-user\nmodel: ${yaml(model)}\ntool: opencode\nproject: ${yaml(path.basename(directory))}\ntotal_exchanges: ${count}\nfirst_prompt_time: ${date}\nlast_prompt_time: ${date}\n---\n\n# Session Log - ${date.slice(0, 10)}\n\nSession: \`${sessionId.slice(0, 8)}\` | Project: \`${path.basename(directory)}\` | Author: opencode-user\n\n---\n\n`,
          "utf8",
        )
      }

      appendFileSync(
        filePath,
        `[LOG_ENTRY type=PROMPT num=${count} session=${sessionId.slice(0, 8)}]\ntimestamp: ${date}\nmodel: ${model}\n\n${prompt}\n\n\n[LOG_ENTRY type=RESPONSE num=${count} session=${sessionId.slice(0, 8)}]\ntimestamp: ${timestamp()}\nmodel: ${model}\n\n${response}\n\n---\n\n`,
        "utf8",
      )
      logged.add(sessionId)
    },
  }
}
