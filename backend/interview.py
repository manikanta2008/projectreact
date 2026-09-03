import os
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import pdfplumber
from docx import Document
from groq import Groq
from dotenv import load_dotenv

# 1. Load environment variables explicitly for this router scope
load_dotenv()

# 2. Initialize the FastAPI APIRouter instance
router = APIRouter()

# 3. Instantiate the Groq client securely using the API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable is missing in interview.py!")

client = Groq(api_key=GROQ_API_KEY)

# 4. Global in-memory chat session manager
session_storage = {}

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), session_id: str = Form(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        resume_text = ""
        if file.filename.endswith(".pdf"):
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        resume_text += text + "\n"
        elif file.filename.endswith(".docx"):
            doc = Document(file_path)
            for para in doc.paragraphs:
                resume_text += para.text + "\n"
        else:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

        system_prompt = (
            "You are a strict, concise technical interviewer. "
            "Candidate Resume: " + resume_text + "\n\n"
            "RULES FOR YOU:\n"
            "1. LIMIT YOUR RESPONSE TO MAXIMUM 3 SENTENCES TOTAL.\n"
            "2. First sentence: Acknowledge their response or state a targeted correction directly if applicable.\n"
            "3. You must then output exactly three dashes '---' on a brand new line.\n"
            "4. Following the dashes, ask your next single technical question based on their skills and resume data.\n"
            "5. DO NOT add conversational filler like 'Great answer!' or 'Moving along now'. Keep the tone sharp, direct, and professional."
        )

        session_storage[session_id] = [
            {"role": "system", "content": system_prompt}
        ]

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=session_storage[session_id],
            temperature=0.7
        )
        first_question = completion.choices[0].message.content
        session_storage[session_id].append({"role": "assistant", "content": first_question})
        
        return {"question": first_question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")


@router.post("/interview-chat")
async def interview_chat(session_id: str = Form(...), user_answer: str = Form(...)):
    if session_id not in session_storage:
        raise HTTPException(status_code=404, detail="Interview session context missing. Please upload resume first.")

    session_storage[session_id].append({"role": "user", "content": user_answer})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=session_storage[session_id],
            temperature=0.7
        )
        reply = completion.choices[0].message.content
        session_storage[session_id].append({"role": "assistant", "content": reply})
        
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq Chat Execution Error: {str(e)}")


@router.post("/stop-interview")
async def stop_interview(session_id: str = Form(...)):
    if session_id not in session_storage:
        raise HTTPException(status_code=404, detail="Active interview session context not found.")
    
    # OVERRIDE/APPEND system behavior so it forgets the 3-sentence rule
    session_storage[session_id].append({
        "role": "system", 
        "content": "The interview phase is now complete. Ignore all previous rules regarding the 3-sentence maximum limit, dashes, or asking follow-up questions."
    })

    evaluation_prompt = (
        "Perform a CRITICAL, objective, and realistic evaluation of the candidate's technical precision based on the interview history. "
        "DO NOT use a safe or default rating (like 4.2). Calculate an exact score between 1.0 and 5.0 based strictly on:\n"
        "1. Technical Accuracy (Were their coding/architectural responses accurate?)\n"
        "2. Depth of Knowledge (Did they explain concepts fully or give vague definitions?)\n"
        "3. Communication Skills (Was their terminology professional and direct?)\n\n"
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        "  \"resume_rating\": \"A distinct dynamic float out of 5 (e.g., 2.8, 3.5, 4.7) matching performance directly\",\n"
        "  \"strengths\": [\"Clear strength item 1\", \"Clear strength item 2\"],\n"
        "  \"skills_to_develop\": [\"Specific targeted skill gap 1\", \"Specific targeted skill gap 2\"],\n"
        "  \"summary\": \"A realistic, professional summary highlighting their exact competence level.\"\n"
        "}"
    )

    session_storage[session_id].append({"role": "user", "content": evaluation_prompt})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=session_storage[session_id],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        raw_content = completion.choices[0].message.content.strip()
        
        # Clean up Markdown wrapper if Llama accidentally creates them despite the JSON mode parameter
        if raw_content.startswith("```"):
            lines = [line for line in raw_content.splitlines() if "```" not in line]
            raw_content = "\n".join(lines).strip()
            
        report = json.loads(raw_content)
        
        # Clear the memory for this session
        del session_storage[session_id]
        return report
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, 
            detail="The AI generated an unparsable evaluation layout. Please retry stopping."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed compiling final metric report: {str(e)}")