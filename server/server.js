const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/db"); // Database connection
const bcrypt = require("bcrypt"); // Optional: for password hashing

const app = express();

// Middleware setup
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cors());
app.use(express.static(path.join(__dirname, "../client/public")));

// Serve the login.html file
app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/signin.html"));
});

app.get("/signinPage", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/signinPage.html"));
});

// Register a New User
app.post("/registerUser", async (req, res) => {
  const { first_name, last_name, contact_number, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO Users (First_Name, Last_Name, Email_Address, Password, Contact_Number) VALUES (?, ?, ?, ?, ?)`;

    db.query(query, [first_name, last_name, email, hashedPassword, contact_number], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: "Failed to register user" });
      }
      res.status(201).json({ message: "User registered successfully" });
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

// Authenticate a user (login)
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Query the Users table to find the user by email
    const query = "SELECT * FROM Users WHERE Email_Address = ?";
    db.query(query, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to authenticate user" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result[0];
      const passwordMatch = await bcrypt.compare(password, user.Password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.status(200).json({ message: "Login successful", userId: user.User_Id });
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during authentication" });
  }
});

app.get("/upload-car", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/upload-car.html"));
});

// Endpoint to add a new vehicle
app.post("/add-car", (req, res) => {
  const {
    user_id, // Foreign key reference to Users table
    vehicle_name,
    vehicle_company,
    vehicle_type,
    vin_number,
    vehicle_model,
    manufacturing_year,
    horse_power,
    vehicle_mileage,
    num_doors,
    seats,
    transmission,
    vehicle_images, // Optional, can handle multiple paths for images
  } = req.body;

  // Validate required fields
  if (!vehicle_name || !vin_number || !vehicle_model || !manufacturing_year ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // SQL query for inserting a new vehicle
  const query = `
    INSERT INTO Vehicless 
    (Seller_Id, Vehicle_Name,Vehicle_Variant, Vehicle_Company, Vehicle_Type, VIN_Number, Vehicle_Model, 
     Manufacturing_Year, Horse_Power, Vehicle_Mileage, NumDoors, Seats, Transmission, 
     Vehicle_Images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    user_id,  // Seller_Id is required for referencing the Users table
    vehicle_name,
    vehicle_company || null,
    vehicle_type || null,
    vin_number,
    vehicle_model,
    manufacturing_year,
    horse_power || null,
    vehicle_mileage || null,
    num_doors || null,
    seats || null,
    transmission || null,
    vehicle_images || null,  // Optional column for vehicle images (can be null)
  ];

  // Execute query
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.sqlMessage || "Failed to add vehicle." });
    }

    res.status(201).json({ message: "Vehicle added successfully!", vehicleId: result.insertId });
  });
});

// Set up the server to listen
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// I added some changes here ebejkhf;jkerbjnebrnmbejrhuierbn 