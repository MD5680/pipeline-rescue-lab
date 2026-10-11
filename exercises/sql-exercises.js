
"use strict";

/*
 * Pipeline Rescue Lab
 * SQL Exercise Library
 *
 * Each exercise contains:
 * - Basic metadata
 * - Problem description
 * - SQL task
 * - Sample data
 * - Expected result
 * - Hint
 * - Solution and explanation
 */

window.PRL_CHALLENGES = {

    // =========================================
    // CHALLENGE 001: Find Duplicate Customers
    // =========================================

    duplicates: {
        id: "duplicates",
        title: "Find Duplicate Customers",
        category: "SQL",
        difficulty: "Beginner",

        description:
            "A customer database contains multiple records " +
            "with the same email address.",

        task:
            "Write a SQL query to identify email addresses " +
            "that appear more than once. Display the email " +
            "address and its occurrence count.",

        tables: {
            customers: {
                columns: [
                    "customer_id",
                    "name",
                    "email"
                ],

                rows: [
                    [1, "Ali", "ali@example.com"],
                    [2, "Sara", "sara@example.com"],
                    [3, "Ali Khan", "ali@example.com"],
                    [4, "John", "john@example.com"],
                    [5, "Ayesha", "sara@example.com"]
                ]
            }
        },

        hint:
            "Group records by email and use an aggregate " +
            "function to count each group.",

        example:
`SELECT email, COUNT(*) AS total
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;`,

        expectedResult: [
            {
                email: "ali@example.com",
                total: 2
            },
            {
                email: "sara@example.com",
                total: 2
            }
        ],

        explanation:
            "GROUP BY combines rows with the same email. " +
            "COUNT(*) counts the rows in each group. " +
            "HAVING COUNT(*) > 1 keeps only duplicate emails."
    },


    // =========================================
    // CHALLENGE 002: Investigate Missing Records
    // =========================================

    "missing-records": {
        id: "missing-records",
        title: "Investigate Missing Records",
        category: "Data Quality",
        difficulty: "Intermediate",

        description:
            "A daily ETL pipeline received 100,000 source " +
            "records, but only 92,000 records reached the " +
            "destination table.",

        task:
            "Identify the checks you would perform to " +
            "investigate the missing 8,000 records. " +
            "Consider filtering, rejected rows, null values, " +
            "and transformation failures.",

        tables: {
            source_orders: {
                columns: [
                    "order_id",
                    "customer_id",
                    "amount"
                ],

                rows: [
                    [101, 1, 500],
                    [102, 2, 750],
                    [103, 3, null],
                    [104, 4, 1200],
                    [105, 5, 650]
                ]
            },

            target_orders: {
                columns: [
                    "order_id",
                    "customer_id",
                    "amount"
                ],

                rows: [
                    [101, 1, 500],
                    [102, 2, 750],
                    [104, 4, 1200],
                    [105, 5, 650]
                ]
            }
        },

        hint:
            "Start by comparing source and target counts. " +
            "Then identify source records missing from the " +
            "target and inspect the transformation rules.",

        example:
`SELECT s.order_id
FROM source_orders s
LEFT JOIN target_orders t
    ON s.order_id = t.order_id
WHERE t.order_id IS NULL;`,

        expectedResult: [
            {
                order_id: 103
            }
        ],

        explanation:
            "The LEFT JOIN keeps all source records. " +
            "When a source order has no matching target " +
            "order, the target columns are NULL. This " +
            "helps identify missing records in the sample. " +
            "In a real incident, inspect rejection logs, " +
            "filters, null handling and failed batches too."
    },


    // =========================================
    // CHALLENGE 003: Fix Incorrect Revenue
    // =========================================

    "incorrect-revenue": {
        id: "incorrect-revenue",
        title: "Fix Incorrect Revenue",
        category: "SQL Analytics",
        difficulty: "Intermediate",

        description:
            "A revenue report returns unexpectedly high " +
            "sales after joining order data with another " +
            "table.",

        task:
            "Investigate whether duplicate rows introduced " +
            "by a join are inflating the reported revenue.",

        tables: {
            orders: {
                columns: [
                    "order_id",
                    "customer_id",
                    "amount"
                ],

                rows: [
                    [201, 1, 100],
                    [202, 2, 200],
                    [203, 3, 150]
                ]
            },

            order_items: {
                columns: [
                    "item_id",
                    "order_id",
                    "product_name"
                ],

                rows: [
                    [1, 201, "Keyboard"],
                    [2, 201, "Mouse"],
                    [3, 202, "Monitor"],
                    [4, 203, "Headphones"],
                    [5, 203, "Webcam"]
                ]
            }
        },

        hint:
            "Check the relationship between orders and " +
            "order_items. One order can have multiple items, " +
            "so joining the tables may repeat order amounts.",

        example:
`SELECT
    o.order_id,
    o.amount,
    COUNT(i.item_id) AS item_count
FROM orders o
JOIN order_items i
    ON o.order_id = i.order_id
GROUP BY o.order_id, o.amount;`,

        expectedResult: [
            {
                order_id: 201,
                amount: 100,
                item_count: 2
            },
            {
                order_id: 202,
                amount: 200,
                item_count: 1
            },
            {
                order_id: 203,
                amount: 150,
                item_count: 2
            }
        ],

        explanation:
            "An order can match multiple order_items rows. " +
            "Summing o.amount after the join repeats the " +
            "order amount for every matching item. " +
            "Aggregate order-level revenue at the correct " +
            "grain before combining it with item-level data."
    }

};


// =========================================
// Export confirmation
// =========================================

console.log(
    "SQL exercise library loaded:",
    Object.keys(window.PRL_CHALLENGES).length,
    "challenges"
);
