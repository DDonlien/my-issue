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
- Use `append_comment` for progress, questions, results and verification. Set author to the actual identity and actor to human or the exact available model identifier including its variant, such as gpt-6-sol, gpt-6-luna or gpt-6.1-sol. Never shorten it to gpt-6. If the full identity is unavailable, use unknown and state that plainly in the comment rather than inventing a variant. Pass `conversation: {url, title}` with this comment's own verified source whenever available; this is saved atomically with the comment. Never inherit the issue's current execution conversation for historical or another agent's comments. Existing comments are immutable. Use level-four or deeper headings inside new comments; headings in code fences are unrestricted.
- Use `list_issues` to derive ready state, columns and relation diagnostics. Status vocabulary, property names, title source and protocol headings come from `.myissue.json`; do not hardcode these in agent work.
- After receiving a dispatched issue, use `link_conversation` with the latest revision to set the single conversation currently executing this issue, only when its real URL and title are available from trusted host context. This changes `current_conversation` without changing historical comment sources. Never guess a recent chat or convert anonymous session metadata into a link. A comment's source is independent: `link_comment_conversation` can associate an existing comment using its `id` returned by `get_issue`, but only after verifying that exact comment's origin. These are optional ordinary YAML properties, not managed sessions. Never rewrite historical headings. The optional model on link_comment_conversation may refine a generic historical label only when the exact original writing turn proves the full model identifier; otherwise leave it unchanged.
- Board dispatch is an explicit user action. `prepare_dispatch` only prepares the latest context. The UI asks the host to send to the active or a new conversation; report acceptance only after the host confirms it. A message accepting a request is not proof the work completed.

Files are a small structure: name, YAML properties, shared comments, and optional free Markdown content under the name. No account, Issue database, hosted model, runtime, worktree manager or mandatory cloud service is needed.
