# GovBot: AI-Powered Governance Agent for Polkadot OpenGov

GovBot is an AI-powered governance agent designed to participate in Polkadot's OpenGov system. It enables transparent, interactive, and explainable proposal evaluation and voting, allowing users to engage with the bot through a contextual chat interface. GovBot holds delegated voting power and can vote on referenda, providing clear reasoning for its decisions.

## Features

- **AI Chat Interface:** Users can interact with GovBot on each proposal, ask questions, and provide arguments to influence its vote.
- **Automated Voting:** GovBot evaluates proposals and votes Aye, Nay, or Abstain based on merit, Polkadot's goals, and community input.
- **Transparent Reasoning:** Every vote is accompanied by a public summary explaining the rationale behind the decision.
- **Proposal Discovery:** Browse and search active and imported proposals, view details, and chat history.
- **Mobile Responsive UI:** Fully responsive design for seamless use on desktop and mobile devices.
- **Integration with Polkassembly:** Fetches proposal metadata and discussion context from Polkassembly for richer analysis.

## How It Works

1. **Proposal Listing:** View active and imported proposals with details, status, and links to Polkassembly.
2. **Chat to Convince:** Users chat with GovBot to clarify, justify, or improve proposals. The bot asks questions and provides feedback.
3. **AI Decision:** When satisfied, GovBot votes and posts a decision summary, visible to all users.
4. **On-Chain Actions:** Votes are submitted on-chain using delegated voting power.

## Tech Stack

- **Next.js (App Router)**
- **TypeScript**
- **Prisma (PostgreSQL)**
- **Polkadot.js API**
- **AI SDK (Groq, OpenAI, etc.)**
- **Tailwind CSS**

## Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/vmmuthu31/govbot
   cd govbot
   ```
2. Install dependencies:
   ```sh
   bun install
   # or
   npm install
   ```
3. Set up environment variables (see `.env.example`).
4. Run the development server:
   ```sh
   bun run dev
   # or
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

## License

MIT

---

### GitHub Description

> AI-powered governance agent for Polkadot OpenGov. Chat with the bot, convince it to vote, and see transparent, explainable on-chain decisions. Built with Next.js, Prisma, and Polkadot.js.
