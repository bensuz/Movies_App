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

//fetching movies for discover section from TMDB

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
        console.log(response.data.results);
    } catch (error) {
        console.error("Error fetching movies:", error);
        res.status(500).json({ error: "Failed to fetch movies" });
    }
});

app.get("/api/public/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get the movie ID from the request parameters
        const options = {
            method: "GET",
            url: `https://api.themoviedb.org/3/movie/${id}`, // Use the movie ID in the URL to fetch details for that specific movie
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            },
        };

        // Fetch the movie details from TMDB API using Axios
        const response = await axios.request(options);

        // Send the movie data to the client
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).json({ error: "Failed to fetch movie details" });
    }
});

//USER -- for fetching the users from pg;
app.get("/api/users", (req, res) => {
    pool.query("SELECT * FROM users;")
        .then((data) => res.json(data.rows))
        .catch((e) => res.status(500).json({ message: e.message }));
});
//USER -- for posting the users to pg;
app.post("/api/users", (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    pool.query(
        "INSERT INTO movies (title, director, year, rating, poster) VALUES ($1, $2, $3, $4) RETURNING *;",
        [first_name, last_name, email, password]
    )
        .then(({ rows }) => {
            console.log(rows);
            res.status(200).json(rows[0]);
        })
        .catch((e) => res.status(500).json({ message: e.message }));
});

//USER -- for deleting the users from pg;
app.delete("/api/users/:user_id", (req, res) => {
    const { user_id } = req.params;
    const { first_name, last_name, email, password } = req.body;
    pool.query("DELETE FROM movies WHERE id=$1 RETURNING *;", [user_id])
        .then(({ rows }) => {
            console.log(rows);
            res.status(200).json(rows[0]);
        })
        .catch((e) => res.status(500).json({ message: e.message }));
});
//USER -- to update user account info on pg
app.put("/api/users/:user_id", (req, res) => {
    const { user_id } = req.params;
    const { first_name, last_name, email, password } = req.body;
    pool.query(
        "UPDATE users SET first_name = $1, last_name=$2, email=$3, password=$4 WHERE user_id=$6 RETURNING *;",
        [first_name, last_name, email, password, user_id]
    )
        .then(({ rows }) => {
            console.log(rows);
            res.status(200).json(rows[0]);
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
