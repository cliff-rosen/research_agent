# Research Agent

An intelligent research assistant that uses LLMs to helps analyze complex questions and synthesize comprehensive answers from multiple sources. Based on a multi-step workflow to:

1. Analyze the question and break it down into key components, scope boundaries, and success criteria
2. Expand the question into multiple search queries to help ensure all relevant information is captured
3. Retrieve sources based on the search queries and filter out irrelevant sources
4. Synthesize an answer, evaluate it against the question analysis, and iteratively refine it

## Tech Stack

### Frontend

- React with TypeScript
- Tailwind CSS for styling
- Dark mode support

### Backend

- Python
- FastAPI
- Support for multiple LLM providers (Anthropic Claude, OpenAI)
- MariaDB/MySQL

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.8+
- MariaDB/MySQL instance (local or cloud)
- API keys for LLM providers (Anthropic/OpenAI)
- Google API key and Programmable Search Engine ID

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required API Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Database Configuration
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=research_agent
```

5. Run database migrations:

   ```bash
   alembic upgrade head
   ```

6. Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with Swagger documentation at `/docs`.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure settings in `src/config/settings.ts`:

```typescript:frontend/src/config/settings.ts
export const settings = {
  apiUrl: 'http://localhost:8000',
}
```

4. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.
