---
name: myissue
description: Use myIssue to turn a conversation into project issues, open a Markdown Kanban board, read issue context, update properties, or append human and Agent comments. Issues live in the project root's issues folder.
---

# myIssue

Use the myissue MCP tools for deterministic file operations. `issues/*.md` in the selected project root is the sole source of truth. Read the project's AGENTS.md before work.

- To open the independent board or conversation panel, call `open_board` with the absolute project root and optional `issueId` (filename stem).
- To create an issue from a conversation, use `create_issue` with a concise name, arbitrary properties and optional free Markdown description. Preserve the user's requirements. Do not silently dispatch it.
- To start work from a conversation, call `get_issue`, read all comments and properties, then perform the user-authorized work in the host's normal project environment. myIssue does not own an Agent runtime.
- Before each mutation, read the latest issue and use its returned `revision`. On CONFLICT, reread, reconcile with the new source and retry only the intended mutation.
- `update_issue` accepts name, selected properties, optional free description and an explicit list of properties to remove. Keep unknown properties. Do not parse arbitrary description subheadings as business rules.
- Use `append_comment` for progress, questions, results and verification. Set author to the actual identity and actor to human or the actual available model identifier. If a model identity is unavailable, state that plainly rather than inventing one. Existing comments are immutable. Use level-four or deeper headings inside new comments; headings in code fences are unrestricted.
- Use `list_issues` to derive ready state, columns and relation diagnostics. Status vocabulary, property names, title source and protocol headings come from `.myissue.json`; do not hardcode these in agent work.
- After receiving a dispatched issue, use `link_conversation` with the latest revision to record the actual current conversation URL and verified title, only when that URL is available from trusted host context. Never guess a recent chat or convert anonymous session metadata into a link. This is an optional ordinary YAML property, not a managed session.
- Board dispatch is an explicit user action. `prepare_dispatch` only prepares the latest context. The UI asks the host to send to the active or a new conversation; report acceptance only after the host confirms it. A message accepting a request is not proof the work completed.

Files are a small structure: name, YAML properties, shared comments, and optional free Markdown content under the name. No account, Issue database, hosted model, runtime, worktree manager or mandatory cloud service is needed.
