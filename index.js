const express = require("express");
const app = express();
require("dotenv/config");
const PORT = process.env.PORT || 8000;
const { Pool } = require("pg");
const cors = require("cors");
const axios = require("axios");

const pool = new Pool({
    connectionString: process.env.ELEPHANT_SQL_CONNECTION_STRING,
});

app.use(cors());
app.use(express.json());
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

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

app.get("/api/public", async (req, res) => {
    try {
        const options = {
            method: "GET",
            url: "https://api.themoviedb.org/3/movie/popular",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            },
        };

        // Fetch popular movies from TMDB API using Axios
        const response = await axios.request(options);

        // Send the movie data to the client
        res.json(response.data.results);
        // console.log(response.data);
    } catch (error) {
        console.error("Error fetching movies:", error);
        res.status(500).json({ error: "Failed to fetch movies" });
    }
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
