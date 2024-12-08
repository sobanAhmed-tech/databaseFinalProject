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
      EndingWaqt,
      MinimumBid,
    } = req.body;

    if (!vehicle_name || !vin_number || !vehicle_model || !manufacturing_year) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Calculate start and end times for the auction
    const startTime = new Date(); // Current time
    const endTime = new Date(startTime.getTime() + EndingWaqt * 24 * 60 * 60 * 1000 + 3 * 60 * 1000);
 

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
        INSERT INTO Auctions (User_Id, Vehicle_Id, Starting_Time, Ending_Time, Auction_Status,Winning_Bid)
        VALUES (?, ?, ?, ?, 'open',?)
      `;

      const auctionValues = [user_id, vehicleId, startTime, endTime,MinimumBid];

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

  app.get('/api/maximumBid/:vehicleId', (req, res) => {
    console.log("Received request for Maximum Bid for Vehicle ID:", req.params.vehicleId);

    const vehicleId = parseInt(req.params.vehicleId);

    console.log("Vehicle ID:", vehicleId);

    // Query to fetch the maximum bid for the vehicle
    const query = `
      SELECT 
          MAX(a.Winning_Bid)AS MaximumBid
      FROM 
          Auctions a
      WHERE 
          a.Vehicle_Id = ?
      
    `;

    db.query(query, [vehicleId], (err, result) => {
      if (err) {
        console.error("Error fetching maximum bid:", err);
        return res.status(500).json({ error: "Failed to fetch maximum bid." });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Maximum bid not found." });
      }

      const maximumBid = result[0].MaximumBid;

      // Respond with the maximum bid
      res.status(200).json({ maximumBid });
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


  app.post("/api/questions", (req, res) => {
    const { vehicleId, inquiryContent } = req.body;
    const buyerId = req.session.user_id;

    if (!vehicleId || !inquiryContent) {
      return res.status(400).json({ error: "Vehicle ID and inquiry content are required." });
    }

    const query = `
      INSERT INTO BiddingQuestions (Vehicle_Id, Buyer_Id, Seller_Id, Inquiry_Content) 
      VALUES (?, ?, (SELECT User_Id FROM Vehicles WHERE Vehicle_Id = ?), ?)
    `;

    db.query(query, [vehicleId, buyerId, vehicleId, inquiryContent], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to submit question." });
      }

      res.status(201).json({ message: "Question submitted successfully." });
    });
  });


  app.get("/api/questions/:vehicleId", (req, res) => {
    const vehicleId = req.params.vehicleId;

    const query = `
      SELECT 
        q.Inquiry_Id, 
        q.Buyer_Id, 
        q.Seller_Id, 
        q.Inquiry_Content, 
        q.Question_Answered, 
        q.Answer_Content, 
        q.Inquiry_Time, 
        u.First_Name AS Buyer_FirstName, 
        u.Last_Name AS Buyer_LastName
      FROM BiddingQuestions q
      JOIN Users u ON q.Buyer_Id = u.User_Id
      WHERE q.Vehicle_Id = ?
      ORDER BY q.Inquiry_Time DESC
    `;

    db.query(query, [vehicleId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch questions." });
      }

      res.status(200).json(results);
    });
  });


  app.post("/api/questions/:inquiryId/respond", (req, res) => {
    const inquiryId = req.params.inquiryId;
    const { answerContent } = req.body;
    const sellerId = req.session.user_id;

    if (!answerContent) {
      return res.status(400).json({ error: "Answer content is required." });
    }

    const query = `
      UPDATE BiddingQuestions
      SET Answer_Content = ?, Question_Answered = TRUE
      WHERE Inquiry_Id = ? AND Seller_Id = ?
    `;

    db.query(query, [answerContent, inquiryId, sellerId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to submit response." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Inquiry not found or unauthorized action." });
      }

      res.status(200).json({ message: "Response submitted successfully." });
    });
  });


app.post("/submit-transportation", (req, res) => {
    const { vehicle_id, shipping_method, buyer_address, arrival_date } = req.body;

    if (!vehicle_id || !shipping_method || !buyer_address || !arrival_date) {
        return res.status(400).json({ error: "All fields are required." });
    }

    const getAuctionQuery = `SELECT Auction_Id FROM auctions WHERE Vehicle_Id = ?`;

    db.query(getAuctionQuery, [vehicle_id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch auction." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "No auction found for the given vehicle." });
        }

        const auction_id = result[0].Auction_Id;

        const insertQuery = `INSERT INTO Transportation (Auction_Id, Shipping_Method, Buyer_Address, Arrival_Date) VALUES (?, ?, ?, ?)`;

        const values = [auction_id, shipping_method, buyer_address, arrival_date];

        db.query(insertQuery, values, (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Database error:", insertErr);
                return res.status(500).json({ error: "Failed to submit transportation details." });
            }

            res.status(201).json({ message: "Transportation details submitted successfully!" });
        });
    });
  });



  app.get('/api/GetTime/:vehicleId', (req, res) => {
    console.log("Received request for Maximum Bid for Vehicle ID:", req.params.vehicleId);

    const vehicleId = parseInt(req.params.vehicleId);

    console.log("Vehicle ID:", vehicleId);

    // Query to fetch the maximum bid for the vehicle
    const query = `
      SELECT 
          Ending_Time
      FROM 
          Auctions 
      WHERE 
          Vehicle_Id = ?
      
    `;

    db.query(query, [vehicleId], (err, result) => {
      if (err) {
        console.error("Error fetching Ending Time:", err);
        return res.status(500).json({ error: "Failed to fetch maximum bid." });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Ending Time not found." });
      }

      const Ending_Time = result[0].Ending_Time;

      // Respond with the maximum bid
      res.status(200).json({ Ending_Time });
    });
  });

app.post("/api/placeBid", (req, res) => {
    const { vehicleId, newBid } = req.body;
    const userId = req.session.user_id;

    if (!vehicleId || !userId || !newBid) {
        return res.status(400).json({ error: "Missing required fields." });
    }

      // Query to get the current maximum bid and auction times
      const fetchQuery = `
          SELECT Winning_Bid, Starting_Time, Ending_Time 
          FROM Auctions 
          WHERE Vehicle_Id = ?
      `;

      db.query(fetchQuery, [vehicleId], (err, results) => {
          if (err) {
              console.error("Error fetching auction details:", err);
              return res.status(500).json({ error: "Failed to fetch auction details." });
          }

          if (results.length === 0) {
              return res.status(404).json({ error: "Auction not found." });
          }

          const { Winning_Bid, Starting_Time, Ending_Time } = results[0];

          const currentTime = new Date(); // Get the current time

      if (newBid <= Winning_Bid || currentTime < Starting_Time || currentTime > Ending_Time) {
      return res.status(400).json({
          error: "Bid must be higher than the current maximum bid, or the auction is closed."
      });
    




}


        // Update the auction with the new maximum bid
        const auctionQuery = `
            INSERT INTO Auctions (User_Id, Vehicle_Id, Starting_Time, Ending_Time, Auction_Status, Winning_Bid)
            VALUES (?, ?, ?, ?, 'open', ?)
        `;

        // Use the correct variable names for userId, Starting_Time, and Ending_Time
        const auctionValues = [userId, vehicleId, Starting_Time, Ending_Time, newBid];

        db.query(auctionQuery, auctionValues, (err) => {
            if (err) {
                console.error("Error updating auction details:", err);
                return res.status(500).json({ error: "Failed to place bid." });
            }

            res.status(200).json({
                message: "Bid placed successfully.",
                updatedDetails: {
                    newBid,
                    startTime: Starting_Time,
                    endTime: Ending_Time,
                },
            });
        });
    });
});



app.get("/Purchased-cars", (req, res) => {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const userId = req.session.user_id;

  const query = `
    SELECT * 
    FROM Vehicles 
    WHERE Vehicle_id IN (
        SELECT Vehicle_id 
        FROM Auctions 
        WHERE User_Id = ? 
        AND Winning_Bid = (
            SELECT MAX(Winning_Bid) 
            FROM Auctions AS subA 
            WHERE subA.Vehicle_Id = Auctions.Vehicle_Id
        )
        AND Ending_Time <= NOW()  -- Check if the auction has ended
    )
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching vehicles:", err);
      return res.status(500).json({ error: "Failed to fetch vehicles." });
    }

    res.status(200).json(results);
  });
});


app.get("/Sold-cars", (req, res) => {
  const userId = req.session.user_id;

  const query = `
    SELECT V.*
    FROM Vehicles V
    JOIN Auctions A ON V.Vehicle_Id = A.Vehicle_Id
    WHERE V.Vehicle_Id IN (
        SELECT Vehicle_Id
        FROM Vehicles
        WHERE User_Id = ?
    ) -- Select only vehicles owned by the current user
      AND A.User_Id != ? -- Ensure the buyer is not the seller
      AND A.Ending_Time <= NOW() -- Auction has ended
      AND A.Winning_Bid = (
          SELECT MAX(subA.Winning_Bid)
          FROM Auctions subA
          WHERE subA.Vehicle_Id = A.Vehicle_Id
      ) -- Winning bid is the maximum bid
    GROUP BY V.Vehicle_Id;
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching sold cars:", err);
      return res.status(500).json({ error: "Failed to fetch sold cars." });
    }

    res.status(200).json(results);
  });
});


app.post("/submit-transactions", (req, res) => {
  const { vehicle_id, transaction_method, buyer_account, shipping_cost, transaction_amount } = req.body;
  const userId = req.session.user_id;
  // Validate that all required fields are present and valid
  if (!vehicle_id || !transaction_method || !buyer_account || !shipping_cost || !transaction_amount) {
      return res.status(400).json({ error: "All fields are required." });
  }
  
  // SQL query to fetch Auction_Id based on Vehicle_Id
  const getAuctionQuery = `
      SELECT Auction_Id 
      FROM Auctions 
      WHERE Vehicle_Id = ? 
      ORDER BY Winning_Bid DESC LIMIT 1;
  `;

  db.query(getAuctionQuery, [vehicle_id], (err, result) => {
      if (err) {
          console.error("Database query error while fetching auction:", err);
          return res.status(500).json({ error: "Failed to fetch auction." });
      }

      console.log("Auction query result:", result);

      if (result.length === 0) {
          console.log("No auction found for the given vehicle.");
          return res.status(404).json({ error: "No auction found for the given vehicle." });
      }

      const auction_id = result[0].Auction_Id;

      // SQL query to insert transaction details
      const insertQuery = `
          INSERT INTO Transactions (Buyer_id,Auction_Id, Transaction_Method, Buyer_Account, Shipping_Cost, Transaction_Amount) 
          VALUES (?, ?, ?, ?, ?,?)
      `;
      const values = [userId,auction_id, transaction_method, buyer_account, shipping_cost, transaction_amount];

      db.query(insertQuery, values, (insertErr) => {
          if (insertErr) {
              console.error("Database error while inserting transaction:", insertErr);
              return res.status(500).json({ error: "Failed to submit transaction details." });
          }

          res.status(201).json({ message: "Transaction details submitted successfully!" });
      });
  });
});
