# myIssue plugin

Local Markdown issue boards for Codex and compatible MCP Apps hosts.

Runtime: Node.js 22+. This package is self-contained; no npm installation is needed inside this directory. Register it through a Marketplace and install `myissue`. Codex 0.159.2 with portable Agent Plugins is the verified host version.

The global `myIssue` entry opens the board. `open_board` can also open the board beside a conversation. Select an absolute project root; issue facts stay in that root's `issues/*.md`. Optional `.myissue.json` maps name, fields, sections and columns without migrating files. Unknown properties and states remain visible.

Conversation dispatch uses the host's message capability; the plugin does not own an Agent runtime. The host must support the `openai/message` extension to start a new conversation. A browser preview cannot dispatch.

Full setup, schema examples and verification boundaries: https://github.com/DDonlien/my-issue

Third-party licenses are in `THIRD_PARTY_NOTICES.txt`. The myIssue project's own license remains undecided; this package is for the author's local and team testing, not a published public directory release.
