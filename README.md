
# Pipeline Rescue Lab 

An interactive, browser-based learning platform for aspiring Data Engineers to practise SQL, investigate data quality problems, and develop practical debugging skills.

##  Project Overview

Pipeline Rescue Lab helps learners move beyond SQL theory by solving hands-on database challenges. Users can execute SQL queries directly in their browser, check their answers, view hints and solutions, and track their learning progress.

The project is built using HTML, CSS, and JavaScript, with SQL.js providing an SQLite engine that runs in the browser.

##  Features

- **Interactive SQL Editor:** Write and execute SQL queries in the browser.
- **Multiple SQL Challenges:** Practise duplicate detection, missing-record investigation, and revenue calculation.
- **Automated Answer Checking:** Compare query results against expected outputs.
- **Hints and Solutions:** Get guidance and review reference SQL queries.
- **Learning Progress Tracker:** Track completed challenges with a progress bar.
- **Persistent Progress:** Save completion progress in browser local storage.
- **Reset Progress:** Clear saved challenge completion and start again.
- **Dynamic Query Results:** Display SQL output in a results table.
- **Browser-Based Execution:** Practise without installing a separate database server.

##  Available Challenges

### 1. Find Duplicate Customers
Identify email addresses that occur more than once using `GROUP BY`, `COUNT()`, and `HAVING`.

### 2. Investigate Missing Records
Find records with missing values using SQL null checks, including `IS NULL`.

### 3. Fix Incorrect Revenue
Calculate total revenue from order items using quantity, unit price, and aggregation.

##  Technologies Used

- HTML5
- CSS3
- JavaScript
- SQL
- SQLite through SQL.js
- Git and GitHub

##  Project Structure

```text
pipeline-rescue-lab/
├── index.html
├── README.md
├── .gitignore
├── css/
│   └── style.css
├── exercises/
│   └── sql-exercises.js
└── js/
    ├── app.js
    └── sql-lab.js
```

##  How to Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/MD5680/pipeline-rescue-lab.git
   ```

2. Open the project folder in VS Code.

3. Open `index.html` using a local development server, such as the Live Server extension.

4. Navigate to the SQL Practice Lab section.

5. Select a challenge, execute a query, check the answer, and explore the hints and solutions.

**Note:** The SQL.js library is loaded from a CDN, so an internet connection is required for the SQL engine to initialize.

##  Learning Outcomes

This project demonstrates practical understanding of:

- SQL queries and aggregations
- Data quality investigation
- Handling missing and duplicate records
- Revenue calculations and analytical queries
- JavaScript event handling and DOM manipulation
- Browser-based SQL execution
- Client-side progress persistence
- Git version control and GitHub workflows

##  Future Improvements

- Add more SQL challenges from beginner to advanced levels.
- Introduce difficulty levels and challenge categories.
- Add Python and PySpark practice labs.
- Include realistic ETL debugging scenarios.
- Add a user dashboard and additional learning statistics.
- Improve accessibility and responsive design.

##  Author

**MD AZAM**

Aspiring Data Engineer interested in SQL, Python, PySpark, data pipelines, and data analytics.

## License

This project is available for learning and educational purposes. A formal open-source license can be added if the project is intended for public reuse.
