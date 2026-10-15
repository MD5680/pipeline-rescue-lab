
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

    
    // Dataset Explorer sample data
    const explorerDatasets = {
        ecommerce: {
            name: "E-commerce Dataset",
            tables: {
                customers: {
                    columns: [
                        "customer_id",
                        "customer_name",
                        "email",
                        "city"
                    ],
                    rows: [
                        [1, "Ali", "ali@example.com", "Hyderabad"],
                        [2, "Sara", "sara@example.com", "Pune"],
                        [3, "John", "john@example.com", "Bengaluru"],
                        [4, "Ayesha", "ayesha@example.com", "Hyderabad"],
                        [5, "Ravi", "ravi@example.com", "Pune"]
                    ]
                },
                products: {
                    columns: [
                        "product_id",
                        "product_name",
                        "category",
                        "price"
                    ],
                    rows: [
                        [101, "Laptop", "Electronics", 55000],
                        [102, "Mouse", "Accessories", 500],
                        [103, "Keyboard", "Accessories", 1200],
                        [104, "Monitor", "Electronics", 12000]
                    ]
                },
                orders: {
                    columns: [
                        "order_id",
                        "customer_id",
                        "order_date",
                        "status"
                    ],
                    rows: [
                        [1001, 1, "2026-10-01", "Delivered"],
                        [1002, 2, "2026-10-02", "Pending"],
                        [1003, 1, "2026-10-03", "Delivered"],
                        [1004, 4, "2026-10-04", "Cancelled"]
                    ]
                },
                order_items: {
                    columns: [
                        "item_id",
                        "order_id",
                        "product_id",
                        "quantity",
                        "unit_price"
                    ],
                    rows: [
                        [1, 1001, 101, 1, 55000],
                        [2, 1001, 102, 2, 500],
                        [3, 1002, 103, 1, 1200],
                        [4, 1003, 104, 2, 12000],
                        [5, 1004, 102, 1, 500]
                    ]
                }
            }
        }
    };

    let explorerDatabase = null;
    let selectedExplorerTable = null;

    
    // CSV upload controls
    const csvFileInput = document.getElementById("csv-file-upload");

    const browseCsvButton = document.getElementById("browse-csv-button");

if (browseCsvButton && csvFileInput) {
    browseCsvButton.addEventListener("click", () => {
        csvFileInput.click();
    });
}

    const uploadCsvButton = document.getElementById("upload-csv-button");
    const restoreSampleButton = document.getElementById("restore-sample-dataset");
    const csvUploadStatus = document.getElementById("csv-upload-status");

    // Parse CSV text, including quoted fields and commas inside quotes
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let field = "";
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const next = text[i + 1];

            if (char === '"' && insideQuotes && next === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === "," && !insideQuotes) {
                row.push(field);
                field = "";
            } else if ((char === "\n" || char === "\r") && !insideQuotes) {
                if (char === "\r" && next === "\n") i++;

                row.push(field);

                if (row.some(value => value.trim() !== "")) {
                    rows.push(row);
                }

                row = [];
                field = "";
            } else {
                field += char;
            }
        }

        if (field.length > 0 || row.length > 0) {
            row.push(field);

            if (row.some(value => value.trim() !== "")) {
                rows.push(row);
            }
        }

        if (insideQuotes) {
            throw new Error("CSV contains an unclosed quoted field.");
        }

        if (rows.length < 2) {
            throw new Error("CSV must contain a header and at least one data row.");
        }

        const columns = rows[0].map((name, index) => {
            const cleaned = name.trim().replace(/^\uFEFF/, "");

            if (!cleaned) {
                throw new Error(`Column ${index + 1} has an empty name.`);
            }

            return cleaned;
        });

        if (new Set(columns.map(name => name.toLowerCase())).size !== columns.length) {
            throw new Error("CSV column names must be unique.");
        }

        const dataRows = rows.slice(1).map((values, index) => {
            if (values.length !== columns.length) {
                throw new Error(
                    `Row ${index + 2} has ${values.length} fields; expected ${columns.length}.`
                );
            }

            return values.map(value => value.trim() === "" ? null : value.trim());
        });

        return { columns, rows: dataRows };
    }

    // Convert a CSV filename into a safe SQL table name
    function csvFilenameToTableName(filename) {
        let name = filename
            .replace(/\.csv$/i, "")
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, "_")
            .replace(/^_+|_+$/g, "");

        if (!name) name = "uploaded_table";
        if (/^[0-9]/.test(name)) name = `table_${name}`;

        return name;
    }

    // Infer a simple SQLite type for each column
    function inferCSVType(rows, columnIndex) {
        const values = rows
            .map(row => row[columnIndex])
            .filter(value => value !== null && value !== "");

        if (values.length === 0) return "TEXT";

        if (values.every(value => /^[-+]?\d+$/.test(value))) {
            return "INTEGER";
        }

        if (values.every(value =>
            /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value)
        )) {
            return "REAL";
        }

        return "TEXT";
    }

    // Load selected CSV files into a separate SQL database
    async function uploadCSVFiles() {
        const files = Array.from(csvFileInput.files || []);

        if (files.length === 0) {
            csvUploadStatus.textContent = "Please select one or more CSV files.";
            return;
        }

        if (files.length > 10) {
            csvUploadStatus.textContent = "Please select no more than 10 CSV files.";
            return;
        }

        if (files.some(file => file.size > 5 * 1024 * 1024)) {
            csvUploadStatus.textContent =
                "Each CSV file must be 5 MB or smaller.";
            return;
        }

        uploadCsvButton.disabled = true;
        csvUploadStatus.textContent = "Reading CSV files...";

        let newDatabase = null;

        try {
            const parsedFiles = [];
            const usedNames = new Set();

            for (const file of files) {
                if (!file.name.toLowerCase().endsWith(".csv")) {
                    throw new Error(`${file.name} is not a CSV file.`);
                }

                const tableName = csvFilenameToTableName(file.name);

                if (usedNames.has(tableName)) {
                    throw new Error(
                        `Multiple files produce the table name "${tableName}". Rename one file.`
                    );
                }

                usedNames.add(tableName);

                const parsed = parseCSV(await file.text());

                parsedFiles.push({
                    tableName,
                    ...parsed
                });
            }

            newDatabase = new window.SQL.Database();

            for (const table of parsedFiles) {
                const definitions = table.columns.map((column, index) => {
                    const type = inferCSVType(table.rows, index);
                    return `${quoteIdentifier(column)} ${type}`;
                });

                newDatabase.run(
                    `CREATE TABLE ${quoteIdentifier(table.tableName)} ` +
                    `(${definitions.join(", ")});`
                );

                const placeholders = table.columns.map(() => "?").join(", ");
                const statement = newDatabase.prepare(
                    `INSERT INTO ${quoteIdentifier(table.tableName)} ` +
                    `VALUES (${placeholders});`
                );

                try {
                    table.rows.forEach(row => statement.run(row));
                } finally {
                    statement.free();
                }
            }

            // Replace the previous custom dataset only after every file succeeds.
            if (explorerDatabase) explorerDatabase.close();
            explorerDatabase = newDatabase;
            newDatabase = null;

            const uploadedDataset = {
                name: "Uploaded Dataset",
                tables: Object.fromEntries(
                    parsedFiles.map(table => [
                        table.tableName,
                        {
                            columns: table.columns,
                            rows: table.rows
                        }
                    ])
                )
            };

            selectedExplorerTable = parsedFiles[0].tableName;
            renderExplorerTables(uploadedDataset);
            renderExplorerPreview(uploadedDataset, selectedExplorerTable);

            csvUploadStatus.textContent =
                `Successfully loaded ${parsedFiles.length} table(s). ` +
                "Your files remain in this browser session.";

            const selector = document.getElementById("dataset-selector");
            selector.value = "custom";
        } catch (error) {
            console.error("CSV upload failed:", error);
            csvUploadStatus.textContent = `Upload failed: ${error.message}`;
        } finally {
            if (newDatabase) newDatabase.close();
            uploadCsvButton.disabled = false;
        }
    }

    if (uploadCsvButton) {
        uploadCsvButton.addEventListener("click", uploadCSVFiles);
    }

    
    // Run SQL queries against the uploaded dataset
    const customSqlEditor = document.getElementById("custom-sql-query");
    const runCustomSqlButton = document.getElementById("run-custom-sql");
    const resetCustomSqlButton = document.getElementById("reset-custom-sql");
    const customSqlStatus = document.getElementById("custom-sql-status");
    const customSqlRowCount = document.getElementById("custom-sql-row-count");
    const customSqlResultTable = document.getElementById("custom-sql-result-table");

    function runCustomSQL() {
        if (!explorerDatabase) {
            customSqlStatus.textContent = "Upload CSV files or restore the sample dataset first.";
            return;
        }

        const query = customSqlEditor.value.trim();

        if (!query) {
            customSqlStatus.textContent = "Enter a SQL query first.";
            return;
        }

        try {
            const results = explorerDatabase.exec(query);
            customSqlResultTable.replaceChildren();

            if (results.length === 0) {
                customSqlResultTable.innerHTML =
                    "<tbody><tr><td>Query executed successfully. No result table returned.</td></tr></tbody>";
                customSqlRowCount.textContent = "0 rows";
                customSqlStatus.textContent = "Query executed successfully.";
                return;
            }

            const result = results[0];
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            result.columns.forEach(column => {
                const th = document.createElement("th");
                th.textContent = column;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);

            const tbody = document.createElement("tbody");

            result.values.forEach(row => {
                const tr = document.createElement("tr");

                row.forEach(value => {
                    const td = document.createElement("td");
                    td.textContent = value === null ? "NULL" : String(value);
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

            customSqlResultTable.append(thead, tbody);
            customSqlRowCount.textContent =
                `${result.values.length} row${result.values.length === 1 ? "" : "s"}`;
            customSqlStatus.textContent = "Query executed successfully.";
        } catch (error) {
            customSqlResultTable.replaceChildren();

            const tbody = document.createElement("tbody");
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.textContent = error.message;
            tr.appendChild(td);
            tbody.appendChild(tr);
            customSqlResultTable.appendChild(tbody);

            customSqlRowCount.textContent = "Query failed";
            customSqlStatus.textContent = `SQL error: ${error.message}`;
        }
    }

    if (runCustomSqlButton) {
        runCustomSqlButton.addEventListener("click", runCustomSQL);
    }

    if (resetCustomSqlButton) {
        resetCustomSqlButton.addEventListener("click", () => {
            customSqlEditor.value = "SELECT * FROM customers;";
            customSqlStatus.textContent = "Query reset.";
            customSqlResultTable.replaceChildren();
            customSqlRowCount.textContent = "0 rows";
        });
    }


    if (restoreSampleButton) {
        restoreSampleButton.addEventListener("click", () => {
            try {
                initializeExplorerDatabase("ecommerce");
                csvFileInput.value = "";
                document.getElementById("dataset-selector").value = "ecommerce";
                csvUploadStatus.textContent = "Sample dataset restored.";
            } catch (error) {
                csvUploadStatus.textContent =
                    `Could not restore sample dataset: ${error.message}`;
            }
        });
    }


    
    // Build the separate database used by Dataset Explorer
    function initializeExplorerDatabase(datasetId = "ecommerce") {
        const dataset = explorerDatasets[datasetId];

        if (!dataset || !window.SQL) {
            throw new Error("Dataset or SQL engine is unavailable.");
        }

        if (explorerDatabase) {
            explorerDatabase.close();
        }

        explorerDatabase = new window.SQL.Database();

        Object.entries(dataset.tables).forEach(([tableName, table]) => {
            const columnDefinitions = table.columns
                .map((column, index) => {
                    const values = table.rows
                        .map(row => row[index])
                        .filter(value => value !== null);

                    const type = values.length > 0 &&
                        values.every(value => typeof value === "number")
                        ? "REAL"
                        : "TEXT";

                    return `"${column}" ${type}`;
                });

            explorerDatabase.run(
                `CREATE TABLE "${tableName}" (${columnDefinitions.join(", ")});`
            );

            if (table.rows.length > 0) {
                const placeholders = table.columns.map(() => "?").join(", ");
                const statement = explorerDatabase.prepare(
                    `INSERT INTO "${tableName}" VALUES (${placeholders});`
                );

                try {
                    table.rows.forEach(row => statement.run(row));
                } finally {
                    statement.free();
                }
            }
        });

        selectedExplorerTable = Object.keys(dataset.tables)[0];

        renderExplorerTables(dataset);
        renderExplorerPreview(dataset, selectedExplorerTable);

        const status = document.getElementById("dataset-preview-status");
        if (status) {
            status.textContent = `${dataset.name} loaded successfully.`;
        }
    }

    // Display the available tables
    function renderExplorerTables(dataset) {
        const list = document.getElementById("dataset-table-list");
        if (!list) return;

        list.replaceChildren();

        Object.entries(dataset.tables).forEach(([tableName, table]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = `${tableName} (${table.rows.length} rows)`;
            button.className = "button button-outline";

            button.addEventListener("click", () => {
                selectedExplorerTable = tableName;
                renderExplorerPreview(dataset, tableName);
            });

            list.appendChild(button);
        });
    }

    // Display columns and sample records for a selected table
    function renderExplorerPreview(dataset, tableName) {
        const table = dataset.tables[tableName];
        const title = document.getElementById("dataset-table-title");
        const description = document.getElementById("dataset-table-description");
        const preview = document.getElementById("dataset-preview-table");

        if (!table || !title || !description || !preview) return;

        title.textContent = `Table: ${tableName}`;
        description.textContent =
            `Columns: ${table.columns.join(", ")} | Sample records: ${table.rows.length}`;

        preview.replaceChildren();

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        table.columns.forEach(column => {
            const th = document.createElement("th");
            th.textContent = column;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        const tbody = document.createElement("tbody");

        table.rows.forEach(row => {
            const tr = document.createElement("tr");

            row.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value === null ? "NULL" : String(value);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        preview.append(thead, tbody);
    }


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

        
        // Initialize the Dataset Explorer independently of the challenge database
        try {
            initializeExplorerDatabase("ecommerce");
        } catch (error) {
            console.error("Dataset Explorer initialization failed:", error);
            const explorerStatus = document.getElementById(
                "dataset-preview-status"
            );

            if (explorerStatus) {
                explorerStatus.textContent =
                    `Could not load dataset: ${error.message}`;
            }
        }

        const datasetSelector = document.getElementById("dataset-selector");

        if (datasetSelector) {
            datasetSelector.addEventListener("change", () => {
                try {
                    initializeExplorerDatabase(datasetSelector.value);
                } catch (error) {
                    console.error("Dataset loading failed:", error);
                }
            });
        }
           

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
