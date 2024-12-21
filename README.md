# Research Agent

## **Overview**
This repository contains the foundation for developing an AI application that delivers **cogent, accurate and complete answers** to complex questions. The system is designed to overcome the limitations of standard search engines and chatbots by using a structured and iterative approach to information retrieval, analysis, and response generation.

---

## **Problem Statement**
Standard search engines and bots often struggle with:
- Providing accurate and coherent answers to complex or ambiguous questions.
- Adapting to real-time context changes or evolving topics.
- Delivering responses that align with user expectations of clarity and thoroughness.

This project addresses these issues by implementing a process-oriented approach to handle complexity and ambiguity effectively.

---

## **Solution Approach**
The application is built around a multi-step methodology:
1. **Question Analysis:** Decomposes questions into structured checklists or blueprints to define response criteria.
2. **Information Retrieval:** Generates precise queries to gather relevant resources.
3. **Content Analysis:** Synthesizes and validates retrieved information for accuracy and coherence.
4. **Iterative Refinement:** Continuously updates responses as new information becomes available or contexts evolve.

---

## **Challenges Addressed**
- **Dynamic Understanding:** Adapts to new information that may alter the context or blueprint mid-process.
- **Scalability:** Balances thoroughness and efficiency while maintaining user-centric simplicity.
- **Real-Time Relevance:** Handles current events or changing contexts that require ongoing updates and refinements.

---

## **Implementation Insights**
- **Iterative Workflow:** The system refines checklists and response outputs dynamically as understanding deepens.
- **Context Management:** Orchestration techniques ensure coherent responses across all stages of question answering.
- **Evaluation Metrics:** The system measures performance using accuracy, coherence, and completeness to guide continuous improvement.
- **User Feedback Integration:** Feedback loops allow the system to evolve and enhance its analysis and response strategies.

---

This repository is a starting point for building intelligent, adaptive systems capable of addressing the nuances of complex questions. Contributions and feedback are welcome!

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
