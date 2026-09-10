# Capture Test

Tool: OpenCode
Model: `opencode-go/gpt-5.6-luna` for both planning and execution
Mechanism: Project auto-discovered OpenCode plugin subscribing to the `event` lifecycle hook. On `session.idle`, it reads the completed user and assistant message pair through the OpenCode SDK and synchronously appends the capture.
Config file changed: `.opencode/plugins/agent-capture.js` (OpenCode auto-discovers `.opencode/plugins/`; no project `opencode.json` was needed.)
Log directory: `.agent-logs/`
Canary log files:
- `.agent-logs/2026-09-10_06-19-24_ses_f7607be68ffe18YyCDDpVJG3gY.md`
- `.agent-logs/2026-09-10_06-19-24_ses_f7607be68ffe18YyCDDpVJG3gY.md`

## Canary 1

Raw entry from `.agent-logs/2026-09-10_06-19-24_ses_f7607be68ffe18YyCDDpVJG3gY.md`:

```text
[LOG_ENTRY type=PROMPT num=1 session=ses_f760]
timestamp: 2026-09-10T06:19:24.821Z
model: opencode-go/gpt-5.6-luna

"CAPTURE TEST — 8x assignment, filename format first"


[LOG_ENTRY type=RESPONSE num=1 session=ses_f760]
timestamp: 2026-09-10T06:19:24.823Z
model: opencode-go/gpt-5.6-luna

What would you like me to do with this text?

Commit: `No code changes`

---
```

## Canary 2

Raw entry from `.agent-logs/2026-09-10_06-20-06_ses_f76074cc5ffeoRxVIN9HVcoIf3.md`:

```text
[LOG_ENTRY type=PROMPT num=1 session=ses_f760]
timestamp: 2026-09-10T06:20:06.104Z
model: opencode-go/gpt-5.6-luna

"CAPTURE TEST — 8x assignment, filename format second"


[LOG_ENTRY type=RESPONSE num=1 session=ses_f760]
timestamp: 2026-09-10T06:20:06.108Z
model: opencode-go/gpt-5.6-luna

What would you like me to do with this text?

---
```

## Failed Attempts

- The first canary command exceeded a two-minute timeout before returning a response.
- The first plugin version assumed the SDK response was an array; OpenCode returned an SDK result wrapper, so the hook initially failed at `findLastIndex`.
- The first asynchronous append sometimes wrote only the session header before the CLI exited. The hook now uses synchronous filesystem writes for the final capture.
- Temporary `.capture-debug` instrumentation was used to inspect the event shape and was removed after verification.
