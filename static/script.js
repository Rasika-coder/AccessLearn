

const uploadForm = document.querySelector("form");
const uploadButton = document.getElementById("upload-button");
const uploadStatus = document.getElementById("upload-status");

if (uploadForm && uploadButton) {
    uploadForm.addEventListener("submit", function () {
        uploadButton.textContent = "Processing PDF...";
        uploadButton.disabled = true;

        if (uploadStatus) {
            uploadStatus.hidden = false;
        }
    });
}


const searchInput = document.getElementById("pdf-search");
const searchResult = document.getElementById("search-result");

if (searchInput && searchResult) {
    const pageCards = document.querySelectorAll(".page-card");

    searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim().toLowerCase();
        let matchingPages = 0;

        pageCards.forEach(function (page) {
            const text = page.querySelector(".page-text").textContent;
            const matches = text.toLowerCase().includes(query);

            if (query !== "" && matches) {
                matchingPages++;
            }

            page.style.display =
                query === "" || matches ? "" : "none";
        });

        if (query === "") {
            searchResult.textContent = "";
        } else {
            searchResult.textContent =
                matchingPages + " page(s) found.";
        }
    });
}

const decreaseFont = document.getElementById("decrease-font");
const increaseFont = document.getElementById("increase-font");
const resetFont = document.getElementById("reset-font");
const contrastToggle = document.getElementById("contrast-toggle");

let fontSize = 18;

function updateFontSize() {
    document.querySelectorAll(".page-text").forEach(function (paragraph) {
        paragraph.style.fontSize = fontSize + "px";
    });
}

if (decreaseFont && increaseFont && resetFont) {
    updateFontSize();

    decreaseFont.addEventListener("click", function () {
        if (fontSize > 12) {
            fontSize -= 2;
            updateFontSize();
        }
    });

    increaseFont.addEventListener("click", function () {
        if (fontSize < 32) {
            fontSize += 2;
            updateFontSize();
        }
    });

    resetFont.addEventListener("click", function () {
        fontSize = 18;
        updateFontSize();
    });
}

if (contrastToggle) {
    contrastToggle.addEventListener("click", function () {
        const enabled = document.body.classList.toggle("high-contrast");

        contrastToggle.textContent = enabled
            ? "High Contrast: On"
            : "High Contrast: Off";

        contrastToggle.setAttribute("aria-pressed", String(enabled));
    });
}

const speakButtons = document.querySelectorAll(".speak-button");

let currentUtterance = null;

speakButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const pageCard = button.closest(".page-card");
        const pageText = pageCard.querySelector(".page-text").textContent.trim();

        if (!pageText) {
            alert("No text is available to read on this page.");
            return;
        }

        if (!("speechSynthesis" in window)) {
            alert("Text-to-speech is not supported by this browser.");
            return;
        }

        window.speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(pageText);
        currentUtterance.lang = "en-IN";
        currentUtterance.rate = 1;

        currentUtterance.onend = function () {
            button.textContent = "Listen to Page " + button.dataset.page;
        };

        button.textContent = "Reading Page " + button.dataset.page;
        window.speechSynthesis.speak(currentUtterance);
    });
});

const explainButtons = document.querySelectorAll(".explain-button");

explainButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
        const pageCard = button.closest(".page-card");
        const pageText = pageCard.querySelector(".page-text").textContent.trim();
        const explanationBox = pageCard.querySelector(".explanation");

        if (!pageText) {
            explanationBox.textContent = "No text is available to explain.";
            return;
        }

        button.disabled = true;
        button.textContent = "Generating explanation...";
        explanationBox.textContent = "Please wait while Gemini explains this page.";

        try {
            const response = await fetch("/explain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: pageText
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not generate an explanation.");
            }

            explanationBox.textContent = data.explanation;
        } catch (error) {
            explanationBox.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Explain Simply";
        }
    });
});

const generateQuizButton = document.getElementById("generate-quiz");
const quizContainer = document.getElementById("quiz-container");

if (generateQuizButton && quizContainer) {
    generateQuizButton.addEventListener("click", async function () {
        const pageTexts = Array.from(
            document.querySelectorAll(".page-text")
        ).map(function (page) {
            return page.textContent.trim();
        }).filter(Boolean);

        if (pageTexts.length === 0) {
            quizContainer.textContent = "No study text is available.";
            return;
        }

        generateQuizButton.disabled = true;
        generateQuizButton.textContent = "Generating quiz...";
        quizContainer.textContent = "Preparing your questions...";

        try {
            const response = await fetch("/quiz", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: pageTexts.join("\n\n").slice(0, 12000)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Quiz generation failed.");
            }

            quizContainer.replaceChildren();

            data.questions.forEach(function (question, index) {
                const questionBox = document.createElement("section");
                const heading = document.createElement("h3");
                heading.textContent = (index + 1) + ". " + question.question;
                questionBox.appendChild(heading);

                question.options.forEach(function (option, optionIndex) {
                    const label = document.createElement("label");
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = "quiz-question-" + index;
                    radio.value = optionIndex;

                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(" " + option));
                    questionBox.appendChild(label);
                    questionBox.appendChild(document.createElement("br"));
                });

                const feedback = document.createElement("p");
                const checkButton = document.createElement("button");
                checkButton.type = "button";
                checkButton.textContent = "Check Answer";

                checkButton.addEventListener("click", function () {
                    const selected = questionBox.querySelector(
                        'input[name="quiz-question-' + index + '"]:checked'
                    );

                    if (!selected) {
                        feedback.textContent = "Please select an answer.";
                        return;
                    }

                    if (Number(selected.value) === question.answer) {
                        feedback.textContent =
                            "Correct! " + question.explanation;
                    } else {
                        feedback.textContent =
                            "Not quite. " + question.explanation;
                    }
                });

                questionBox.appendChild(checkButton);
                questionBox.appendChild(feedback);
                quizContainer.appendChild(questionBox);
            });

        } catch (error) {
            quizContainer.textContent = error.message;
        } finally {
            generateQuizButton.disabled = false;
            generateQuizButton.textContent = "Generate Quiz";
        }
    });
}

const stopReadingButton = document.getElementById("stop-reading");

if (stopReadingButton) {
    stopReadingButton.addEventListener("click", function () {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    });
}

const progressBar = document.getElementById("reading-progress");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

const readPages = new Set();

function markPageAsRead(pageCard) {
    if (!pageCard) return;

    const pageNumber = pageCard.querySelector("h3").textContent;
    readPages.add(pageNumber);

    const totalPages = document.querySelectorAll(".page-card").length;

    if (totalPages === 0) return;

    const percentage = Math.round(
        (readPages.size / totalPages) * 100
    );

    if (progressFill) {
        progressFill.style.width = percentage + "%";
    }

    if (progressText) {
        progressText.textContent =
            "Reading progress: " + percentage + "% (" +
            readPages.size + " of " + totalPages + " pages)";
    }

    if (progressBar) {
        progressBar.setAttribute("aria-valuenow", percentage);
    }
}

document.querySelectorAll(".speak-button, .explain-button")
    .forEach(function (button) {
        button.addEventListener("click", function () {
            markPageAsRead(button.closest(".page-card"));
        });
    });

const downloadNotesButton = document.getElementById("download-notes");

if (downloadNotesButton) {
    downloadNotesButton.addEventListener("click", function () {
        const pageCards = document.querySelectorAll(".page-card");

        if (pageCards.length === 0) {
            alert("No study notes are available to download.");
            return;
        }

        const filenameHeading = document.querySelector("main h2");

const filename = filenameHeading
    ? filenameHeading.textContent.replace("Extracted content: ", "").trim()
    : "Uploaded PDF";

let notes = "AccessLearn - Study Notes\n";
notes += "PDF: " + filename + "\n";
notes += "Total Pages: " + pageCards.length + "\n\n";

        pageCards.forEach(function (pageCard) {
            const heading = pageCard.querySelector("h3").textContent;
            const text = pageCard.querySelector(".page-text").textContent.trim();

            notes += heading + "\n\n";
            notes += text + "\n\n";
            notes += "----------------------------------------\n\n";
        });

        const blob = new Blob([notes], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "AccessLearn-Study-Notes.txt";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}

const clearSearchButton = document.getElementById("clear-search");

if (clearSearchButton && searchInput) {
    clearSearchButton.addEventListener("click", function () {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("input"));
        searchInput.focus();
    });
}

const backToTopButton = document.getElementById("back-to-top");

if (backToTopButton) {
    backToTopButton.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}
