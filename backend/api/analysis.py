import re
import os
import logging
import csv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from openai import AzureOpenAI
from dotenv import load_dotenv
import io
from fastapi.responses import FileResponse
from typing import List, Tuple, Dict

load_dotenv()

OUTPUT_DIR = "analysis_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)
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
agent1 = AzureOpenAI(
    api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT"),
    api_version=os.environ.get("AZURE_OPENAI_VERSION"),
)
agent2 = AzureOpenAI(
    api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT"),
    api_version=os.environ.get("AZURE_OPENAI_VERSION"),
)

def process_excel(file: UploadFile) -> List[str]:
    try:
        df = pd.read_excel(file.file)
        return df.iloc[:, 0].dropna().tolist()
    except Exception as e:
        logger.error(f"Error processing Excel file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

def parse_categories(categories: str) -> List[Tuple[str, str]]:
    category_list = []
    for item in categories.split(","):
        item = item.strip()
        if not item:
            continue
        parts = item.split(":", 1)
        category = parts[0].strip().lower()
        sentiment = parts[1].strip().lower() if len(parts) > 1 else ""
        category_list.append((category, sentiment))
    return category_list

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='text/csv', filename=filename)
    else:
        raise HTTPException(status_code=404, detail="File not found")

@app.post("/analyze")
async def analyze_sentiment(file: UploadFile = File(...), categories: str = Form(...)):
    try:
        comments = process_excel(file)
        category_list = parse_categories(categories)
        if not category_list:
            raise HTTPException(status_code=400, detail="At least one category must be provided.")

        comments_text = "\n".join(comments)

        messages = [
            {"role": "system", "content": "You are an AI specializing in sentiment analysis of employee feedback."},
            {"role": "user", "content": f"""Analyze the following comments and categorize them into: {category_list}.
                - Identify relevant comments for each category.
                - Print the full comment if it matches the category.
                - Classify each comment as either 'Positive' or 'Negative'.
                - If no matching comments exist, return: 'Category,Sentiment,Comment,No relevant comments found.'
                - Provide output strictly in CSV format without additional text.
                
                **Comments for analysis:**
                {comments_text}
            """}
        ]

        response1 = agent1.chat.completions.create(model="gpt-4o", messages=messages, max_tokens=2000)
        response2 = agent1.chat.completions.create(model="gpt-4o", messages=messages, max_tokens=2000)

        content1 = response1.choices[0].message.content.strip() if response1.choices else ""
        content2 = response2.choices[0].message.content.strip() if response2.choices else ""

        comparison_messages = [
            {"role": "system", "content": "You are an AI that compares two responses and eliminates duplicate comments."},
            {"role": "user", "content": f"Compare the following responses and remove duplicates:\n\n{content1}\n\n{content2}\n\nReturn only valid CSV data without additional text."}
        ]

        response3 = agent2.chat.completions.create(model="gpt-4o", messages=comparison_messages, max_tokens=2000)
        final_content = response3.choices[0].message.content.strip() if response3.choices else ""

        cleaned_data = []
        reader = csv.reader(io.StringIO(final_content))
        for row in reader:
            if len(row) == 3:
                category_sentiment, sentiment, comment = row
                category = category_sentiment.split("-")[0].strip()
                if category and sentiment and comment:
                    cleaned_data.append([category.strip(), sentiment.strip(), comment.strip()])

        output_file_name = "analysis_output.csv"
        output_file_path = os.path.join(OUTPUT_DIR, output_file_name)

        with open(output_file_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(cleaned_data)

        return FileResponse(path=output_file_path, media_type='text/csv', filename=output_file_name)

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("analysis:app", host="127.0.0.1", port=8001, reload=True)