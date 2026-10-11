
"use strict";

/* ==========================================
   PIPELINE RESCUE LAB
   Main JavaScript Application
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // 1. DOM Elements
    const dialog = document.getElementById("challenge-dialog");
    const dialogTitle = document.getElementById("dialog-title");
    const dialogDescription = document.getElementById("dialog-description");
    const dialogTask = document.getElementById("dialog-task");
    const dialogExample = document.getElementById("dialog-example");

    const closeDialogBtn = document.getElementById("close-dialog");
    const dialogDoneBtn = document.getElementById("dialog-done");

    const challengeButtons = document.querySelectorAll(
        "[data-challenge]"
    );

    const currentYear = document.getElementById("current-year");

    // 2. Update footer year
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // 3. Temporary challenge data
    // Later, this will move to exercises/sql-exercises.js

    const fallbackChallenges = {
        duplicates: {
            title: "Find Duplicate Customers",

            description:
                "A customer database contains multiple records " +
                "with the same email address.",

            task:
                "Write a SQL query to identify email addresses " +
                "that appear more than once.",

            example:
`SELECT email, COUNT(*) AS total
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;`
        },

        "missing-records": {
            title: "Investigate Missing Records",

            description:
                "An ETL pipeline received 100,000 records, " +
                "but only 92,000 reached the destination.",

            task:
                "Investigate filtering, rejected rows, " +
                "null values and transformation errors. " +
                "Explain how you would locate the missing records.",

            example:
`SELECT COUNT(*) AS source_count
FROM source_orders;

SELECT COUNT(*) AS target_count
FROM target_orders;`
        },

        "incorrect-revenue": {
            title: "Fix Incorrect Revenue",

            description:
                "A revenue report shows higher sales " +
                "than expected after joining multiple tables.",

            task:
                "Investigate whether a one-to-many join " +
                "is duplicating rows before aggregation.",

            example:
`SELECT order_id, COUNT(*) AS row_count
FROM joined_order_data
GROUP BY order_id
HAVING COUNT(*) > 1;`
        }
    };

    // 4. Get challenge data
    function getChallenge(challengeId) {

        // Allows a future exercise file to provide
        // challenge data through window.PRL_CHALLENGES.
        const externalChallenges = window.PRL_CHALLENGES || {};

        return (
            externalChallenges[challengeId] ||
            fallbackChallenges[challengeId] ||
            null
        );
    }

    // 5. Open challenge popup
    function openChallenge(challengeId) {

        if (!dialog || typeof dialog.showModal !== "function") {
            console.error("Challenge dialog is unavailable.");
            return;
        }

        const challenge = getChallenge(challengeId);

        if (!challenge) {
            console.warn("Challenge not found:", challengeId);
            return;
        }

        dialogTitle.textContent =
            challenge.title || "Untitled Challenge";

        dialogDescription.textContent =
            challenge.description || "";

        dialogTask.textContent =
            challenge.task || "";

        // Show an example only when available
        if (challenge.example) {
            dialogExample.textContent = challenge.example;
            dialogExample.hidden = false;
        } else {
            dialogExample.textContent = "";
            dialogExample.hidden = true;
        }

        if (!dialog.open) {
            dialog.showModal();
        }
    }

    // 6. Close challenge popup
    function closeChallenge() {
        if (dialog && dialog.open) {
            dialog.close();
        }
    }

    // 7. Add events to challenge buttons
    challengeButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const challengeId =
                button.getAttribute("data-challenge");

            openChallenge(challengeId);
        });

    });

    // 8. Close button events
    if (closeDialogBtn) {
        closeDialogBtn.addEventListener(
            "click",
            closeChallenge
        );
    }

    if (dialogDoneBtn) {
        dialogDoneBtn.addEventListener(
            "click",
            closeChallenge
        );
    }

    // 9. Close when clicking outside the dialog
    if (dialog) {

        dialog.addEventListener("click", (event) => {

            if (event.target === dialog) {
                closeChallenge();
            }

        });

    }

    // Escape key is handled natively by <dialog>

    console.log("Pipeline Rescue Lab initialized successfully.");

});
