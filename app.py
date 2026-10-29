
import pytesseract
import pypdfium2 as pdfium



import os
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
from flask import Flask, render_template, request, jsonify
from pypdf import PdfReader
from google import genai
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


@app.route("/", methods=["GET", "POST"])
def home():
    pages = []
    error = None
    filename = None

    if request.method == "POST":
        uploaded_file = request.files.get("pdf")

        if not uploaded_file or uploaded_file.filename == "":
            error = "Please select a PDF file."
        elif not uploaded_file.filename.lower().endswith(".pdf"):
            error = "Please upload a PDF file only."
        else:
            try:
                pdf_bytes = uploaded_file.read()
                reader = PdfReader(BytesIO(pdf_bytes))

                if reader.is_encrypted:
                    error = "This PDF is password-protected."
                else:
                    # First, try extracting selectable text normally.
                    for page_number, page in enumerate(reader.pages, start=1):
                        text = (page.extract_text() or "").strip()
                        pages.append({
                            "number": page_number,
                            "text": text
                        })

                    # If a page has no selectable text, try OCR on that page.
                    if any(not page["text"] for page in pages):
                        pdf_document = pdfium.PdfDocument(pdf_bytes)

                        for index, page_data in enumerate(pages):
                            if not page_data["text"]:
                                pdf_page = pdf_document[index]
                                image = pdf_page.render(scale=2).to_pil()
                                ocr_text = pytesseract.image_to_string(
                                    image, lang="eng"
                                ).strip()

                                page_data["text"] = ocr_text

                                pdf_page.close()

                        pdf_document.close()

                    if not any(page["text"] for page in pages):
                        pages = []
                        error = (
                            "No readable text was found. "
                            "The PDF may be blank or difficult to scan."
                        )
                    else:
                        filename = uploaded_file.filename


            except Exception as e:
                pages = []
                error = "Could not read this PDF. Please try another file."
                print("PDF error:", e)

    return render_template(
        "index.html",
        pages=pages,
        error=error,
        filename=filename
    )


@app.route("/explain", methods=["POST"])
def explain():
    if client is None:
        return jsonify({
            "error": "Gemini API key is missing. Check your .env file."
        }), 500

    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "No text was provided."}), 400

    if len(text) > 12000:
        text = text[:12000]

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                "Explain the following study material in simple language "
                "for a beginner. Use short paragraphs and examples where "
                "helpful. Keep the explanation accurate.\n\n"
                + text
            )
        )

        return jsonify({"explanation": response.text or "No explanation was returned."})

    except Exception as e:
        print("Gemini error:", e)
        return jsonify({
            "error": "Could not generate an explanation. Check your API key, model access, and quota."
        }), 500


@app.route("/quiz", methods=["POST"])
def generate_quiz():
    if client is None:
        return jsonify({
            "error": "Gemini API key is missing. Check your .env file."
        }), 500

    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "No study text was provided."}), 400

    text = text[:12000]

    prompt = """
Create 5 multiple-choice revision questions based only on the study material below.
Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Brief explanation"
    }
  ]
}
The answer field must be the zero-based index of the correct option.
Do not use Markdown fences.

Study material:
""" + text

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        import json
        quiz = json.loads(response.text)

        if not isinstance(quiz.get("questions"), list):
            raise ValueError("Invalid quiz format")

        return jsonify(quiz)

    except Exception as e:
        print("Quiz generation error:", e)
        return jsonify({
            "error": "Could not generate the quiz. Check the API key, model access, or quota."
        }), 500

@app.errorhandler(413)
def file_too_large(error):
    return "File is too large. Please upload a PDF under 10 MB.", 413


if __name__ == "__main__":
    app.run(debug=True)
