const express = require("express");
const app = express();

const mysql = require("mysql2");
const bodyParser = require("body-parser");
const dotenv = require("dotenv")

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

db.connect((error) => {
	if (error) {
		console.error("database connection error", error);
		return;
	}
	console.log("connection success");
});

// function using distance formula to find out distance between user and school.
// note -> I hven't used Haversine formula to calculate extact distance.
const calDistance = (latUser, longUser, latSchool, longSchool) => {
	const dx = latSchool - latUser;
	const dy = longSchool - longUser;

	return Math.sqrt(dx**2 + dy**2);
}

app.get("/", (req, res) => {
	res.send("Welcome to 'School Management System'. Please use '/addSchool' and '/listSchools' to perform API calls.")
});

app.post("/addSchool", (req, res) => {
	const { name, address, latitude, longitude } = req.body;

	if (!name || !address || !latitude || !longitude) {
		return res.status(400).json({error: "Please send a valid inputs."});
	}

	const query = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
	db.query(query, [name, address, latitude, longitude], (error, result) => {
		if (error) {
			return res.status(500).json({ error: "error: can't add." });			
		}
		res.status(201).json({ message: "success.", schoolId: result.insertId })
	});
});

app.get("/listSchools", (req, res) => {
	const { latitude, longitude } = req.query;

	if (!latitude || !longitude) {
		return res.status(400).json({ error: "incorrect request." });
	}

	const userLat = parseFloat(latitude);
	const userLong = parseFloat(longitude);

	db.query("SELECT * FROM schools", (error, schools) => {
		if (error) {
			return res.status(500).json({ error: "can't fetch data." });
		}

		schools.forEach(school => {
			school.distance = calDistance(userLat, userLong, school.latitude, school.longitude);
		});

		schools.sort((a, b) => a.distance - b.distance);

		res.status(200).json({ schools });
	});
});

app.listen(3000, () => console.log("Running..."));