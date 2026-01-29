"""Utility functions for AI assistant"""
import base64
import json
from cryptography.fernet import Fernet
from django.conf import settings


def _get_fernet():
    """Get Fernet instance using Django SECRET_KEY as the encryption key"""
    # Derive a 32-byte key from SECRET_KEY
    key = base64.urlsafe_b64encode(settings.SECRET_KEY.encode()[:32].ljust(32, b'\0'))
    return Fernet(key)


def encrypt_api_key(plaintext):
    """Encrypt an API key for storage"""
    if not plaintext:
        return ''
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_api_key(encrypted):
    """Decrypt a stored API key"""
    if not encrypted:
        return ''
    f = _get_fernet()
    return f.decrypt(encrypted.encode()).decode()


def mask_api_key(plaintext):
    """Mask an API key for display (e.g. sk-...xxxx)"""
    if not plaintext or len(plaintext) < 8:
        return '***'
    return plaintext[:3] + '...' + plaintext[-4:]


def extract_text_from_pdf(file_obj):
    """Extract text from a PDF file"""
    import pdfplumber
    text_parts = []
    with pdfplumber.open(file_obj) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return '\n\n'.join(text_parts)


def extract_text_from_docx(file_obj):
    """Extract text from a DOCX file"""
    import docx
    doc = docx.Document(file_obj)
    return '\n\n'.join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text_from_file(file_obj, filename):
    """Extract text from an uploaded file based on extension"""
    lower = filename.lower()
    if lower.endswith('.pdf'):
        return extract_text_from_pdf(file_obj)
    elif lower.endswith('.docx'):
        return extract_text_from_docx(file_obj)
    else:
        raise ValueError(f"Unsupported file type: {filename}. Only PDF and DOCX are supported.")


def build_system_prompt(course, syllabus_text, assignment_context):
    """Build the system prompt for OpenAI"""
    prompt = (
        "You are an AI teaching assistant that helps instructors create assignment questions. "
        "You must return your response as valid JSON with two fields:\n"
        "1. \"message\": A brief conversational response to the instructor\n"
        "2. \"questions\": An array of question objects\n\n"
        "Each question object must have:\n"
        "- \"question_type\": one of \"multiple_choice\", \"numerical\", or \"text_response\"\n"
        "- \"text\": the question text\n"
        "- \"points\": number of points (integer)\n"
        "- \"order\": 0-based index\n\n"
        "For multiple_choice questions, also include:\n"
        "- \"choices\": array of {\"text\": string, \"is_correct\": boolean, \"order\": integer}\n"
        "  (exactly one choice must have is_correct: true)\n\n"
        "For numerical questions, also include:\n"
        "- \"correct_answer_numeric\": the correct numeric answer (float)\n"
        "- \"numeric_tolerance\": acceptable tolerance (float, e.g. 0.01)\n\n"
        "For text_response questions, no additional fields are needed.\n\n"
        "If the instructor asks you to modify, refine, or discuss questions without generating new ones, "
        "return an empty \"questions\" array and put your response in \"message\".\n\n"
        "IMPORTANT: Always return valid JSON. Do not include markdown formatting or code blocks."
    )

    if course:
        prompt += f"\n\nCourse: {course.code} - {course.name}"
        if course.description:
            prompt += f"\nCourse Description: {course.description}"

    if syllabus_text:
        # Truncate to ~8000 chars to stay within context limits
        truncated = syllabus_text[:8000]
        if len(syllabus_text) > 8000:
            truncated += "\n... [syllabus truncated]"
        prompt += f"\n\nCourse Syllabus:\n{truncated}"

    if assignment_context:
        prompt += "\n\nAssignment Context:"
        if assignment_context.get('title'):
            prompt += f"\n- Title: {assignment_context['title']}"
        if assignment_context.get('type'):
            prompt += f"\n- Type: {assignment_context['type']}"
        if assignment_context.get('points_possible'):
            prompt += f"\n- Total Points: {assignment_context['points_possible']}"

    return prompt


def call_openai(messages, ai_settings):
    """Call OpenAI API and return the parsed response"""
    from openai import OpenAI

    api_key = decrypt_api_key(ai_settings.openai_api_key_encrypted)
    if not api_key:
        raise ValueError("OpenAI API key is not configured. An admin must set it in AI Settings.")

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model=ai_settings.model_name,
        messages=messages,
        max_tokens=ai_settings.max_tokens,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    parsed = json.loads(content)

    # Ensure expected structure
    if 'message' not in parsed:
        parsed['message'] = ''
    if 'questions' not in parsed:
        parsed['questions'] = []

    # Assign order to questions if missing
    for i, q in enumerate(parsed['questions']):
        if 'order' not in q:
            q['order'] = i

    return parsed
