const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const db = require("./config/db");
const bcrypt = require("bcrypt");

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "../client/public")));

// Configure session middleware
// hellioejkrhfjkerhfjkenrjk
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Use true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);


// Global middleware to redirect unauthenticated users
app.use((req, res, next) => {
  const publicRoutes = ["/signin", "/registerUser", "/authenticate"];
  
  // Allow access to public routes
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Check if the user is authenticated
  if (req.session && req.session.user_id) {
    return next();
  }

  // Redirect to login page if not authenticated
  return res.redirect("/signin");
});


// Routes
app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/signin.html"));
});

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

app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
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

      req.session.user_id = user.User_Id;
      res.status(200).json({ message: "Login successful", userId: user.User_Id });
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during authentication" });
  }
});
/*
app.post("/add-car", (req, res) => {
  const user_id = req.session.user_id;

  const {
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
  } = req.body;

  if (!vehicle_name || !vin_number || !vehicle_model || !manufacturing_year) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const query = `
    INSERT INTO Vehicles 
    (User_Id, Vehicle_Name, Vehicle_Company, Vehicle_Type, VIN_Number, Vehicle_Model, 
     Manufacturing_Year, Horse_Power, Vehicle_Mileage, NumDoors, Seats, Transmission)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    user_id,
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
  ];


  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.sqlMessage || "Failed to add vehicle." });
    }

    
    res.status(201).json({ message: "Vehicle added successfully!", vehicleId: result.insertId });
  });
});

*/

app.post("/add-car", (req, res) => {
  const user_id = req.session.user_id;

  const {
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
  } = req.body;

  if (!vehicle_name || !vin_number || !vehicle_model || !manufacturing_year) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Calculate start and end times for the auction
  const startTime = new Date(); // Current time
  const endTime = new Date(startTime.getTime() + 2 * 60 * 1000); // Add 2 minutes

  // Insert into the Vehicles table
  const vehicleQuery = `
    INSERT INTO Vehicles 
    (User_Id, Vehicle_Name, Vehicle_Company, Vehicle_Type, VIN_Number, Vehicle_Model, 
     Manufacturing_Year, Horse_Power, Vehicle_Mileage, NumDoors, Seats, Transmission)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const vehicleValues = [
    user_id,
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
  ];

  db.query(vehicleQuery, vehicleValues, (err, vehicleResult) => {
    if (err) {
      console.error("Database error (Vehicles):", err);
      return res.status(500).json({ error: "Failed to add vehicle." });
    }

    const vehicleId = vehicleResult.insertId; // Get the inserted Vehicle_Id

    // Insert into the Auctions table
    const auctionQuery = `
      INSERT INTO Auctions (User_Id, Vehicle_Id, Starting_Time, Ending_Time, Auction_Status)
      VALUES (?, ?, ?, ?, 'open')
    `;

    const auctionValues = [user_id, vehicleId, startTime, endTime];

    db.query(auctionQuery, auctionValues, (err, auctionResult) => {
      if (err) {
        console.error("Database error (Auctions):", err);
        return res.status(500).json({ error: "Failed to create auction." });
      }

      res.status(201).json({
        message: "Vehicle and auction added successfully!",
        vehicleId: vehicleId,
        auctionId: auctionResult.insertId,
        timer: { start: startTime, end: endTime },
      });
    });
  });
});


app.get("/api/vehicles", (req, res) => {
  const userId = req.session.user_id;
  const query = "SELECT * FROM Vehicles WHERE User_Id != ?"; // Use a parameterized query

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error("Error fetching vehicles:", err);
          return res.status(500).json({ error: "Failed to fetch vehicles." });
      }

      res.status(200).json(results);
  });
});

app.get("/user-cars", (req, res) => {
  const userId = req.session.user_id;
  const query = "SELECT * FROM Vehicles WHERE User_Id = ?"; // Use a parameterized query

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error("Error fetching vehicles:", err);
          return res.status(500).json({ error: "Failed to fetch vehicles." });
      }

      res.status(200).json(results);
  });
});




app.get('/api/vehicles/:vehicleId', (req, res) => {
  console.log("Received request for Vehicle ID:", req.params.vehicleId);

  const vehicleId = parseInt(req.params.vehicleId);

  console.log("Vehicle ID:", vehicleId);

  // Query to fetch vehicle details by ID
    const query = "SELECT * FROM Vehicles WHERE Vehicle_Id = ?";
  
  db.query(query, [vehicleId], (err, result) => {
    if (err) {
      console.error("Error fetching vehicle details:", err);
      return res.status(500).json({ error: "Failed to fetch car details." });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Vehicle not found." });
    }

    res.status(200).json(result[0]); // Send the first result as the vehicle details
  });
});


app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).json({ error: "Failed to log out." });
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.status(200).json({ message: "Logged out successfully." });
  });
});

app.get("/api/user", (req, res) => {
    const userId = req.session.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const query = `
        SELECT 
            User_Id, 
            First_Name, 
            Last_Name, 
            Email_Address, 
            Contact_Number, 
            Profile_Picture, 
            Items_Sold, 
            Vehicles_Purchased, 
            Seller_Rating 
        FROM Users 
        WHERE User_Id = ?
    `;

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch user data" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(result[0]);
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  console.log('server is running');
});


