import time
import os
import io
import logging
import uuid
import pandas as pd
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AzureOpenAI
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
ASSISTANT_ID = os.getenv("AZURE_ASSISTANT_ID")
API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_VERSION")

if not ASSISTANT_ID or not API_KEY or not AZURE_ENDPOINT or not AZURE_API_VERSION:
    raise ValueError("Missing Azure OpenAI credentials. Check environment variables.")

agent = AzureOpenAI(
    api_key=API_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    api_version=AZURE_API_VERSION,
)

session_threads: Dict[str, str] = {}

async def process_excel(file: UploadFile) -> List[str]:
    """Extracts first column values from an uploaded Excel file directly in memory."""
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        return df.iloc[:, 0].dropna().astype(str).tolist()
    except Exception as e:
        logger.error(f"Error processing Excel file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

async def generate_summary_with_openai(session_id: str, comments: List[str], user_message: str):
    comments_text = "\n".join(comments)
    if session_id not in session_threads:
        thread = agent.beta.threads.create()
        session_threads[session_id] = thread.id
        is_new_session = True
    else:
        is_new_session = False
    thread_id = session_threads[session_id]
    if is_new_session:
        
        full_prompt = f'''You are a sentiment analysis assistant. You will:
- Analyze and summarize comments based on the user's input.
- Classify them into relevant categories like "Location", "Transport", "HR", etc.
- Consider follow-up questions using prior context.
- Always respond clearly, using simple and formal language.

User Task: {user_message}

Comments to analyze:
{comments_text}

Format your response using 10 bullet points.'''
    else:
        full_prompt = user_message
    agent.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=full_prompt,
    )
    run = agent.beta.threads.runs.create(thread_id=thread_id, assistant_id=ASSISTANT_ID)

    def event_generator():
        try:
            while True:
                run_status = agent.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
                logger.info(f"OpenAI status: {run_status.status}")

                if run_status.status == "completed":
                    break
                elif run_status.status in ["failed", "cancelled"]:
                    yield "Error: Assistant run failed.\n"
                    return

                time.sleep(1)

            messages = agent.beta.threads.messages.list(thread_id=thread_id, order="desc")
            for msg in messages.data:
                if msg.role == "assistant":
                    for line in msg.content[0].text.value.splitlines():
                        yield line + "\n"
                    break  
        except Exception as e:
            logger.error(f"Error streaming response: {str(e)}")
            yield "Error: Could not fetch assistant response.\n"

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/chatbot")
async def analyze_sentiment(
    file: UploadFile = File(...),
    user_input: str = Form(...),
    session_id: str = Form(None)
):
    logger.info(f"Received request - session_id: {session_id} | user_message: {user_input}")

    try:
        if not user_input.strip():
            raise HTTPException(status_code=400, detail=" User message cannot be empty.")

        if not session_id:
            session_id = str(uuid.uuid4())

        comments = await process_excel(file)
        return await generate_summary_with_openai(session_id, comments, user_input)

    except HTTPException as http_err:
        logger.error(f"HTTP Error: {str(http_err)}")
        raise http_err

    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f" Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("analysis:app", host="127.0.0.1", port=8002, reload=True)