from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:  # optional for local/serverless deployments
    AsyncIOMotorClient = None

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except Exception:  # optional; deterministic fallback keeps the chatbot working
    LlmChat = None
    UserMessage = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "portfolio")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

client = AsyncIOMotorClient(MONGO_URL) if AsyncIOMotorClient and MONGO_URL else None
db = client[DB_NAME] if client else None

ASSISTANT_SYSTEM_PROMPT = """
Você é o assistente virtual do portfólio de Emanuel Medeiros.
Responda em português brasileiro, com tom profissional, direto e natural.
Use respostas curtas, úteis e sem inventar dados.

BASE CONFIÁVEL
- Nome público: Emanuel Medeiros.
- Identidade/handle: Emanuel.Medeiros quando for estilo de usuário.
- Área: estudante de Tecnologia da Informação.
- Foco: organização de dados, informática administrativa e lógica de programação.
- Habilidades: Excel avançado, Power BI, SQL básico, C# intermediário, lógica de programação, Pacote Office e Windows.
- Formação acadêmica: Ensino Médio — 1º ano, cursando; previsão de conclusão em 2028.
- Formação complementar: Microlins Barcarena — formação profissionalizante em andamento.
- Cursos/módulos: Lógica de Programação, Programação C#, Banco de Dados SQL, Power BI, Excel 2021, Excel Avançado, Word, PowerPoint, Windows 11, Atendimento ao Cliente, Marketing Digital, Google AdWords, Empreendedor de Sucesso e Segurança na Era Digital.
- Objetivo: Jovem Aprendiz, Estagiário ou Auxiliar Administrativo Técnico em área de tecnologia ou administrativa.
- Disponibilidade: integral ou meio período; presencial ou home office.
- Localização pública: Barcarena — PA. Não exponha bairro ou endereço completo.
- E-mail: emanuelmedeiros291220@gmail.com.
- LinkedIn: em breve; não está ativo.
- Currículo: disponível online na rota /curriculo.

REGRAS
1. Não invente experiência profissional, certificações ou projetos concluídos.
2. Diferencie estudo, curso em andamento e projeto em desenvolvimento.
3. Não exponha idade, bairro, endereço completo ou dados sensíveis.
4. Se a pergunta fugir do portfólio, redirecione para formação, habilidades, currículo ou contato.
"""


def normalize(text: str) -> str:
    import unicodedata
    return "".join(
        ch for ch in unicodedata.normalize("NFD", text.lower())
        if unicodedata.category(ch) != "Mn"
    )


def deterministic_reply(message: str) -> str:
    q = normalize(message or "")
    if not q:
        return "Envie uma pergunta sobre Emanuel Medeiros, currículo, formação, habilidades, disponibilidade ou contato."

    def any_word(words):
        return any(word in q for word in words)

    if any_word(["linkedin", "linkdee", "linkdin"]):
        return "O LinkedIn do Emanuel ainda não está ativo. No portfólio, ele aparece de forma discreta como “Em breve”."
    if any_word(["curriculo", "cv", "resume"]):
        return "O currículo do Emanuel está disponível online na rota /curriculo, com objetivo, formação, cursos, competências e disponibilidade."
    if any_word(["contato", "email", "e-mail", "whats", "telefone", "instagram"]):
        return "Para contato profissional com Emanuel Medeiros, use os botões do site. O e-mail é emanuelmedeiros291220@gmail.com."
    if any_word(["habilidade", "competencia", "excel", "power bi", "sql", "c#", "programacao", "office", "windows"]):
        return "Emanuel tem foco em Excel avançado, Power BI, SQL básico, C# intermediário, lógica de programação, Pacote Office e Windows."
    if any_word(["formacao", "curso", "microlins", "escola", "ensino medio"]):
        return "Emanuel cursa o Ensino Médio e faz formação profissionalizante na Microlins Barcarena, com módulos de C#, SQL, Power BI, Excel, Office, marketing digital, atendimento e segurança digital."
    if any_word(["vaga", "oportunidade", "objetivo", "aprendiz", "estagio", "auxiliar", "trabalho"]):
        return "Emanuel busca oportunidade como Jovem Aprendiz, Estagiário ou Auxiliar Administrativo Técnico em tecnologia, dados ou área administrativa."
    if any_word(["projeto", "portfolio", "dashboard", "planilha", "sistema", "experiencia"]):
        return "O portfólio apresenta a base técnica do Emanuel e pode evoluir com dashboards, planilhas automatizadas, consultas SQL e sistemas simples em C#. O assistente não inventa experiência profissional."
    if any_word(["onde", "cidade", "local", "mora", "barcarena", "endereco", "bairro"]):
        return "A localização profissional exibida é Barcarena — PA. Por privacidade, o site não divulga bairro ou endereço completo."

    return "Posso responder sobre Emanuel Medeiros, currículo online, formação, cursos, habilidades técnicas, disponibilidade, contato e portfólio."


app = FastAPI(title="Emanuel Medeiros Portfolio API")
api_router = APIRouter(prefix="/api")


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str


@api_router.get("/")
async def root():
    return {"message": "Emanuel Medeiros Portfolio API — online"}


@api_router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="message is required")

    session_id = payload.session_id or str(uuid.uuid4())

    reply_text = None
    if EMERGENT_LLM_KEY and LlmChat and UserMessage:
        try:
            chat_client = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=ASSISTANT_SYSTEM_PROMPT,
            ).with_model("openai", os.environ.get("LLM_MODEL", "gpt-4o-mini"))
            reply_text = await chat_client.send_message(UserMessage(text=payload.message.strip()))
        except Exception as exc:
            logger.warning("Falha no LLM; usando resposta determinística: %s", exc)

    if not reply_text:
        reply_text = deterministic_reply(payload.message.strip())

    if db is not None:
        try:
            await db.chat_messages.insert_many([
                {
                    "id": str(uuid.uuid4()),
                    "session_id": session_id,
                    "role": "user",
                    "content": payload.message.strip(),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
                {
                    "id": str(uuid.uuid4()),
                    "session_id": session_id,
                    "role": "assistant",
                    "content": reply_text,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            ])
        except Exception as persist_err:
            logger.warning("Falha ao persistir histórico de chat: %s", persist_err)

    return ChatResponse(session_id=session_id, reply=reply_text)


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
