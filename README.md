# AccessLearn — AI-Powered Accessible Study Companion

AccessLearn is a Python-based web application designed to make learning from PDF documents easier and more accessible. It combines PDF text extraction, OCR, text-to-speech, and AI-powered study tools in one simple interface.

## Features

- **PDF Upload:** Upload PDF documents for reading and study.
- **Text Extraction:** Extract text from PDF pages using `pypdf`.
- **OCR Support:** Read scanned PDFs using Tesseract OCR.
- **AI-Powered Explanations:** Simplify difficult concepts using the Gemini API.
- **AI-Generated Quizzes:** Generate multiple-choice questions for revision.
- **Text-to-Speech:** Listen to extracted PDF content.
- **PDF Search:** Search for specific words or topics within extracted content.
- **Accessibility Controls:** Adjust font size and enable high-contrast mode.
- **Study Notes:** Download generated study notes.
- **Reading Progress:** Track pages you have interacted with while studying.

## Technology Stack

- **Language:** Python
- **Backend:** Flask
- **Frontend:** HTML, CSS, JavaScript
- **PDF Processing:** pypdf
- **OCR:** Tesseract OCR, pypdfium2, pytesseract
- **AI Integration:** Google Gemini API

## Getting Started

### Prerequisites

Install Python, Git, and Tesseract OCR. You will also need a Google Gemini API key.

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd AccessLearn
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   ```

   On Windows PowerShell:

   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root and add your API key:

   ```text
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. If Tesseract is installed in a custom location, update its executable path in `app.py` to match your system.

### Run the Application

```bash
python app.py
```

Open the local URL displayed in the terminal in your browser.

## Security

- Keep your `.env` file and API keys private.
- Never commit secrets or credentials to GitHub.
- Store API keys in environment variables rather than directly in source code.

## Future Improvements

- Add user accounts and saved study sessions.
- Improve accessibility and keyboard navigation.
- Add more revision formats and learning progress analytics.
- Deploy the application online.

## Author

Developed as a project focused on accessible learning and AI-assisted education.
