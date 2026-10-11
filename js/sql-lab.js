
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    const editor = document.getElementById("sql-query");
    const runButton = document.getElementById("run-sql");
    const resetButton = document.getElementById("reset-sql");
    const checkButton = document.getElementById("check-answer");
    const selector = document.getElementById("challenge-selector");
    const hintButton = document.getElementById("show-hint");
    const solutionButton = document.getElementById("show-solution");

    const status = document.getElementById("sql-engine-status");
    const message = document.getElementById("sql-query-message");
    const resultTable = document.getElementById("sql-result-table");
    const rowCount = document.getElementById("sql-row-count");

    const feedback = document.getElementById("learning-feedback");
    const feedbackTitle = document.getElementById("feedback-title");
    const feedbackContent = document.getElementById("feedback-content");
    const feedbackSql = document.getElementById("feedback-sql");
    const tableInfo = document.querySelector(".sql-table-info");

    // Learning progress elements
    const progressCount = document.getElementById("progress-count");
    const progressPercentage = document.getElementById("progress-percentage");
    const progressBar = document.getElementById("progress-bar");
    const progressFill = document.getElementById("progress-fill");
    const progressMessage = document.getElementById("progress-message");
    const resetProgressButton = document.getElementById("reset-progress");

    const challengeIds = [
        "duplicates",
        "missing-records",
        "incorrect-revenue"
    ];

    const storageKey = "prl-completed-challenges";

    let completedChallenges = [];

    try {
        const savedProgress = JSON.parse(
            localStorage.getItem(storageKey) || "[]"
        );

        if (Array.isArray(savedProgress)) {
            completedChallenges = savedProgress.filter(id =>
                challengeIds.includes(id)
            );
        }
    } catch (error) {
        console.warn("Could not load saved progress:", error);
    }

    if (
        !editor || !runButton || !resetButton || !checkButton ||
        !selector || !hintButton || !solutionButton ||
        !status || !message || !resultTable || !rowCount ||
        !feedback || !feedbackTitle || !feedbackContent ||
        !feedbackSql || !tableInfo
    ) {
        console.error("SQL Lab: Required HTML elements are missing.");
        return;
    }

    // Built-in challenge data.
    const defaultChallenges = {
        duplicates: {
            title: "Find Duplicate Customers",
            hint: "Group rows by email and use HAVING to keep only emails appearing more than once.",
            explanation: "GROUP BY combines matching email addresses. HAVING filters groups after aggregation.",
            example: `SELECT email, COUNT(*) AS total
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;`,
            tables: {
                customers: {
                    columns: ["customer_id", "name", "email"],
                    rows: [
                        [1, "Ali", "ali@example.com"],
                        [2, "Sara", "sara@example.com"],
                        [3, "Ali Khan", "ali@example.com"],
                        [4, "John", "john@example.com"],
                        [5, "Ayesha", "sara@example.com"]
                    ]
                }
            },
            expectedResult: [
                { email: "ali@example.com", total: 2 },
                { email: "sara@example.com", total: 2 }
            ]
        },

        "missing-records": {
            title: "Investigate Missing Records",
            hint: "Use IS NULL to find records that have no email address. Do not use = NULL.",
            explanation: "SQL uses IS NULL to test for missing values.",
            example: `SELECT customer_id, name
FROM customers
WHERE email IS NULL
ORDER BY customer_id;`,
            tables: {
                customers: {
                    columns: ["customer_id", "name", "email"],
                    rows: [
                        [1, "Ali", "ali@example.com"],
                        [2, "Sara", null],
                        [3, "John", "john@example.com"],
                        [4, "Ayesha", null],
                        [5, "Ravi", "ravi@example.com"]
                    ]
                }
            },
            expectedResult: [
                { customer_id: 2, name: "Sara" },
                { customer_id: 4, name: "Ayesha" }
            ]
        },

        "incorrect-revenue": {
            title: "Fix Incorrect Revenue",
            hint: "Calculate revenue by multiplying quantity by unit_price for each order item, then sum the values.",
            explanation: "Revenue is quantity multiplied by unit price. SUM aggregates the line-item revenue.",
            example: `SELECT SUM(quantity * unit_price) AS total_revenue
FROM order_items;`,
            tables: {
                order_items: {
                    columns: ["item_id", "order_id", "product", "quantity", "unit_price"],
                    rows: [
                        [1, 101, "Keyboard", 2, 500],
                        [2, 101, "Mouse", 1, 300],
                        [3, 102, "Monitor", 2, 5000],
                        [4, 103, "Keyboard", 1, 500]
                    ]
                }
            },
            expectedResult: [
                { total_revenue: 11300 }
            ]
        }
    };

    // Use supplied challenge data when available; otherwise use built-in data.
    const suppliedChallenges = window.PRL_CHALLENGES || {};
    const challenges = {
        ...defaultChallenges,
        ...suppliedChallenges
    };

    let database = null;
    let currentChallenge = null;
    let lastQueryResults = null;
    let initialQuery = editor.value;

    function showMessage(text, type = "") {
        message.textContent = text;
        message.className = type;
    }

    function updateProgress() {
    const completedCount = completedChallenges.length;
    const percentage = Math.round(
        (completedCount / challengeIds.length) * 100
    );

    if (progressCount) {
        progressCount.textContent =
            `${completedCount} of ${challengeIds.length} challenges completed`;
    }

    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressBar) {
        progressBar.setAttribute("aria-valuenow", completedCount);
    }

    if (progressMessage) {
        progressMessage.textContent =
            completedCount === challengeIds.length
                ? "Congratulations! You completed all SQL challenges."
                : completedCount === 0
                    ? "Complete your first challenge to get started!"
                    : "Great work! Keep going with your next challenge.";
    }
}

function saveCompletedChallenge(challengeId) {
    if (!challengeIds.includes(challengeId)) return;

    if (!completedChallenges.includes(challengeId)) {
        completedChallenges.push(challengeId);

        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(completedChallenges)
            );
        } catch (error) {
            console.warn("Could not save progress:", error);
        }
    }

    updateProgress();
}

    if (resetProgressButton) {
    resetProgressButton.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Are you sure you want to reset all completed challenges?"
        );

        if (!confirmed) return;

        completedChallenges = [];

        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn("Could not clear saved progress:", error);
        }

        updateProgress();
        showMessage("Learning progress has been reset.", "success");
    });
}

    function showFeedback(title, content, sql = "") {
        feedback.hidden = false;
        feedbackTitle.textContent = title;
        feedbackContent.textContent = content;
        feedbackSql.textContent = sql;
        feedbackSql.hidden = !sql;
    }

    function hideFeedback() {
        feedback.hidden = true;
        feedbackTitle.textContent = "";
        feedbackContent.textContent = "";
        feedbackSql.textContent = "";
        feedbackSql.hidden = true;
    }

    function quoteIdentifier(identifier) {
        return `"${String(identifier).replace(/"/g, '""')}"`;
    }

    function inferColumnType(rows, columnIndex) {
        const values = rows
            .map(row => row[columnIndex])
            .filter(value => value !== null && value !== undefined);

        if (
            values.length > 0 &&
            values.every(value =>
                typeof value === "number" && Number.isInteger(value)
            )
        ) {
            return "INTEGER";
        }

        if (
            values.length > 0 &&
            values.every(value => typeof value === "number")
        ) {
            return "REAL";
        }

        return "TEXT";
    }

    function clearResults() {
        lastQueryResults = null;
        rowCount.textContent = "0 rows";

        resultTable.replaceChildren();

        const tbody = document.createElement("tbody");
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.textContent = "Run a query to see results.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        resultTable.appendChild(tbody);
    }

    function renderResults(result) {
        resultTable.replaceChildren();

        if (!result || !result.columns) {
            rowCount.textContent = "0 rows";

            const tbody = document.createElement("tbody");
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.textContent = "Query completed without a result set.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            resultTable.appendChild(tbody);
            return;
        }

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        result.columns.forEach(column => {
            const th = document.createElement("th");
            th.textContent = column;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        const tbody = document.createElement("tbody");

        result.values.forEach(values => {
            const tr = document.createElement("tr");

            values.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value === null ? "NULL" : String(value);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        resultTable.append(thead, tbody);

        rowCount.textContent =
            `${result.values.length} row` +
            (result.values.length === 1 ? "" : "s");
    }

    function loadChallengeTables(challenge) {
        if (!challenge.tables) {
            throw new Error("This challenge has no sample tables.");
        }

        Object.entries(challenge.tables).forEach(([tableName, table]) => {
            if (!Array.isArray(table.columns) || !Array.isArray(table.rows)) {
                throw new Error(`Invalid sample data for ${tableName}.`);
            }

            if (table.columns.length === 0) {
                throw new Error(`Table ${tableName} has no columns.`);
            }

            const definitions = table.columns.map((column, index) => {
                return `${quoteIdentifier(column)} ${inferColumnType(
                    table.rows, index
                )}`;
            });

            database.run(
                `CREATE TABLE ${quoteIdentifier(tableName)} (${definitions.join(", ")});`
            );

            if (table.rows.length > 0) {
                const placeholders = table.columns.map(() => "?").join(", ");
                const statement = database.prepare(
                    `INSERT INTO ${quoteIdentifier(tableName)} VALUES (${placeholders});`
                );

                try {
                    table.rows.forEach(row => {
                        if (row.length !== table.columns.length) {
                            throw new Error(
                                `A row in ${tableName} has the wrong number of values.`
                            );
                        }

                        statement.run(row);
                    });
                } finally {
                    statement.free();
                }
            }
        });
    }

    function updateTableInfo(challenge) {
        tableInfo.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = "Available tables";
        tableInfo.appendChild(heading);

        Object.entries(challenge.tables || {}).forEach(([name, table]) => {
            const nameElement = document.createElement("p");
            const code = document.createElement("code");

            code.textContent = name;
            nameElement.appendChild(code);

            const columns = document.createElement("small");
            columns.textContent = table.columns.join(", ");

            tableInfo.append(nameElement, columns);
        });
    }

    function loadChallenge(challengeId) {
        const challenge = challenges[challengeId];

        if (!challenge) {
            showMessage("Challenge data could not be found.", "error");
            return;
        }

        try {
            if (database) {
                database.close();
            }

            database = new window.SQL.Database();
            loadChallengeTables(challenge);

            currentChallenge = challenge;
            initialQuery = challenge.example || "SELECT * FROM customers;";
            editor.value = initialQuery;

            clearResults();
            hideFeedback();
            updateTableInfo(challenge);

            showMessage("Challenge loaded. Run your query to begin.", "success");
            status.textContent = "SQL engine ready";
        } catch (error) {
            console.error("Could not load challenge:", error);
            showMessage(`Could not load challenge: ${error.message}`, "error");
        }
    }

    function normalizeValue(value) {
        if (value === null || value === undefined) {
            return "null";
        }

        if (typeof value === "number") {
            return String(value);
        }

        return String(value);
    }

    function checkAnswer() {
        if (!currentChallenge || !currentChallenge.expectedResult) {
            showMessage("No expected answer is configured.", "error");
            return;
        }

        if (!lastQueryResults) {
            showMessage("Run a SELECT query successfully first.", "error");
            return;
        }

        const expectedRows = currentChallenge.expectedResult;

        if (expectedRows.length === 0) {
            showMessage("This challenge needs an expected result.", "error");
            return;
        }

        const expectedColumns = Object.keys(expectedRows[0]);
        const actualColumns = lastQueryResults.columns;

        const missingColumn = expectedColumns.some(
            column => !actualColumns.includes(column)
        );

        if (missingColumn) {
            showMessage(
                `Your results must include: ${expectedColumns.join(", ")}.`,
                "error"
            );
            return;
        }

        function rowKey(row, columns) {
            return JSON.stringify(
                columns.map(column => normalizeValue(row[column]))
            );
        }

        const actualRows = lastQueryResults.values.map(values => {
            const row = {};

            actualColumns.forEach((column, index) => {
                row[column] = values[index];
            });

            return row;
        });

        const expectedKeys = expectedRows
            .map(row => rowKey(row, expectedColumns))
            .sort();

        const actualKeys = actualRows
            .map(row => rowKey(row, expectedColumns))
            .sort();

        const correct =
            actualKeys.length === expectedKeys.length &&
            actualKeys.every((key, index) => key === expectedKeys[index]);

        if (correct) {

            saveCompletedChallenge(selector.value);

            showFeedback(
                "Correct! Great work.",
                currentChallenge.explanation ||
                    "Your query returned the expected results."
            );

            showMessage("Correct answer!", "success");
        } else {
            showFeedback(
                "Not quite yet",
                "Your results do not match the expected output. Review the hint and try again."
            );

            showMessage("Check your query and try again.", "error");
        }
    }

    // Initialize SQL.js.
    try {
        if (typeof window.initSqlJs !== "function") {
            throw new Error(
                "SQL.js did not load. Check your internet connection and script URL."
            );
        }

        const SQL = await window.initSqlJs({
            locateFile: file =>
                `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });

        window.SQL = SQL;
        status.textContent = "SQL engine ready";

        // Ensure every dropdown option has a matching challenge.
        Array.from(selector.options).forEach(option => {
            if (!challenges[option.value]) {
                option.disabled = true;
            }
        });

        const initialId = challenges[selector.value]
            ? selector.value
            : Object.keys(challenges)[0];

        if (!initialId) {
            throw new Error("No SQL challenges are configured.");
        }

        selector.value = initialId;
        loadChallenge(initialId);
        updateProgress();
        console.log("SQL Practice Lab initialized successfully.");
    } catch (error) {
        console.error("SQL engine initialization failed:", error);
        status.textContent = "Engine unavailable";
        showMessage(error.message, "error");
        runButton.disabled = true;
        checkButton.disabled = true;
        hintButton.disabled = true;
        solutionButton.disabled = true;
        return;
    }

    // Execute SQL.
    runButton.addEventListener("click", () => {
        const query = editor.value.trim();

        if (!query) {
            clearResults();
            showMessage("Enter a SQL query first.", "error");
            return;
        }

        try {
            const results = database.exec(query);

            lastQueryResults = results.length > 0 ? results[0] : null;

            renderResults(lastQueryResults);
            hideFeedback();
            showMessage("Query executed successfully.", "success");
        } catch (error) {
            lastQueryResults = null;
            console.error("SQL query error:", error);
            rowCount.textContent = "Query failed";

            resultTable.replaceChildren();

            const tbody = document.createElement("tbody");
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.textContent = error.message;
            tr.appendChild(td);
            tbody.appendChild(tr);
            resultTable.appendChild(tbody);

            showMessage(`SQL error: ${error.message}`, "error");
        }
    });

    // Check answer.
    checkButton.addEventListener("click", checkAnswer);

    // Show hint.
    hintButton.addEventListener("click", () => {
        if (!currentChallenge) return;

        showFeedback(
            "Hint",
            currentChallenge.hint || "No hint is available for this challenge."
        );
    });

    // Show solution.
    solutionButton.addEventListener("click", () => {
        if (!currentChallenge) return;

        showFeedback(
            "Reference Solution",
            currentChallenge.explanation || "Review the SQL query below.",
            currentChallenge.example || ""
        );
    });

    // Reset query and previous results.
    resetButton.addEventListener("click", () => {
        editor.value = initialQuery;
        clearResults();
        hideFeedback();
        showMessage("Query reset.", "success");
    });

    // Switch challenges.
    selector.addEventListener("change", () => {
        loadChallenge(selector.value);
    });
});
