const express = require("express");
const app = express();
require("dotenv/config");
const PORT = process.env.PORT || 8000;
const { Pool } = require("pg");
const cors = require("cors");

const pool = new Pool({
    connectionString: process.env.ELEPHANT_SQL_CONNECTION_STRING,
});

//app.use(cors())
app.use(express.json());

//get movies from pg on route api/movies
app.get("/api/movies", (req, res) => {
    pool.query("SELECT * FROM movies;")
        .then((data) => res.json(data.rows))
        .catch((e) => res.status(500).json({ message: e.message }));
});
//
app.get("/api/movies/:id", (req, res) => {
    const { id } = req.params;
    pool.query("SELECT * FROM movies where id=$1;", [id])
        .then(({ rowCount, rows }) => {
            if (rowCount === 0) {
                res.status(404).json({
                    message: `Movie with id ${id} Not Found`,
                });
            } else {
                console.log(rows);
                res.json(rows[0]);
            }
        })
        .catch((e) => res.status(500).json({ message: e.message }));
});
app.post("/api/movies", (req, res) => {
    const { title, director, year, rating, poster } = req.body;
    pool.query(
        "INSERT INTO movies (title, director, year, rating, poster) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
        [title, director, year, rating, poster]
    )
        .then(({ rows }) => {
            console.log(rows);
            res.status(200).json(rows[0]);
        })
        .catch((e) => res.status(500).json({ message: e.message }));
});
app.put("/api/movies/:id", (req, res) => {
    const { id } = req.params;
    const { title, director, year, rating, poster } = req.body;
    pool.query(
        "UPDATE movies SET title = $1, director=$2, year=$3, rating=$4, poster=$5 WHERE id=$6 RETURNING *;",
        [title, director, year, rating, poster, id]
    )
        .then(({ rows }) => {
            console.log(rows);
            res.status(200).json(rows[0]);
        })
        .catch((e) => res.status(500).json({ message: e.message }));
});

app.delete("/api/movies/:id", (req, res) => {
    const { id } = req.params;
    const { title, director, year, rating, poster } = req.body;
    pool.query("DELETE FROM movies WHERE id=$1 RETURNING *;", [id])
        .then(({ rows }) => {
            console.log(rows);
            res.status(200).json(rows[0]);
        })
        .catch((e) => res.status(500).json({ message: e.message }));
});

app.listen(PORT, () => console.log(`SERVER IS RUNNING ON ${PORT}`));
