
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("ai-tutor-toggle");
    const panel = document.getElementById("ai-tutor-panel");
    const close = document.getElementById("ai-tutor-close");
    const form = document.getElementById("ai-tutor-form");
    const input = document.getElementById("ai-tutor-input");
    const messages = document.getElementById("ai-tutor-messages");
    const status = document.getElementById("ai-tutor-status");
    const sendButton = document.getElementById("ai-tutor-send");

    const API_URL =
        "https://pipeline-rescue-ai.cbrmdazam.workers.dev/chat";

    if (
        !toggle || !panel || !close || !form ||
        !input || !messages || !status || !sendButton
    ) {
        console.error("AI Tutor: Required HTML elements are missing.");
        return;
    }

    function setOpen(open) {
        panel.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));

        if (open) input.focus();
    }

    function addMessage(text, sender) {
        const message = document.createElement("div");
        message.className = `ai-tutor-message ${sender}`;

        // Use textContent so AI responses are displayed as text,
        // not executed as HTML.
        message.textContent = text;

        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;

        return message;
    }

    toggle.addEventListener("click", () => {
        setOpen(panel.hidden);
    });

    close.addEventListener("click", () => {
        setOpen(false);
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = input.value.trim();

        if (!question) {
            status.textContent = "Please enter a question.";
            return;
        }

        if (question.length > 2000) {
            status.textContent =
                "Your question must be 2000 characters or fewer.";
            return;
        }

        addMessage(question, "user");
        input.value = "";
        input.disabled = true;
        sendButton.disabled = true;
        status.textContent = "AI Tutor is thinking...";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || `Request failed (${response.status}).`
                );
            }

            if (!data.answer) {
                throw new Error("The AI returned an empty answer.");
            }

            addMessage(data.answer, "assistant");
            status.textContent = "Answer received.";
        } catch (error) {
            console.error("AI Tutor error:", error);

            addMessage(
                "Sorry, I couldn't get an answer. Please try again.",
                "assistant"
            );

            status.textContent =
                "Connection failed. Check your connection and try again.";
        } finally {
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    });
});
