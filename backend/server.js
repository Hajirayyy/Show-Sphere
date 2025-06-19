const express = require('express');  
const session = require('express-session');   // middleware for storing user session data (like login status etc)
const cookieParser = require('cookie-parser'); // parses cookies attached to incoming http requests
const { sql, poolPromise } = require('./next');
require('dotenv').config();
const bcrypt = require('bcryptjs'); //for hashing plain text pass
const jwt = require('jsonwebtoken'); //create and verify JSON web tokens
const { authenticateToken, authorizeAdmin, authorizeUser } = require("./middleware/authMiddleware"); 
const crypto = require("crypto");  // secure pass (generate link for reset pass)
const sendResetEmail = require("./emailService");
const cors = require('cors'); // allows frontend to make requests to backend
const multer = require('multer'); // handles file upload for folder : Uploads
const path = require('path');
const {
    insertMovie,
    updateMovie,
    deleteMovie,

    insertTheatre,
    updateTheatre,
    deleteTheatre, 

    insertScreen, 
    updateScreen, 
    deleteScreen, 

    seedSeatsForScreen,

    insertShowtime, 
    updateShowtime, 
    deleteShowtime,

    insertTicket, 
    updateTicket, 
    deleteTicket,

    insertBooking, 
    updateBooking, 
    deleteBooking, 

    updatePayment, 
    deletePayment, 
    
    insertReview, 
    updateReview, 
    deleteReview, 
    deleteAccount,

    runQuery, 
    selectAllRoute,
    handleQueryResponse, 
    callProcedureRoute
} = require("./databaseServer");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////            APIs for SQL queries, IMPLEMENTATION               /////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////    ACCOUNT & SESSION RELATIVE     ////////////////////////////////////////////

// EXPRESS APP SETUP
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// cors setup
app.use(
     cors({
      origin: "http://localhost:3000",  // frontend
     credentials: true                 // allow sending cookies
     })
  );

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Ensure environment variables are set
if (!process.env.JWT_SECRET) {
    console.error("Error: Missing required environment variables!");
    process.exit(1);
}

/////////////////////// Authentication & User Management API's /////////////////////////

// USER REGISTRATION API
app.post('/api/signup', async (req, res) => {
    const { userName, email, password, roleID } = req.body;

    try {
        if (!userName || !email || !password || !roleID) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 10) {
            return res.status(400).json({ message: "Password must be at least 10 characters long" });
        }

        const pool = await poolPromise;

        // Check if email already exists in Users table
        const existingUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`SELECT email FROM Users WHERE email = @email`);

        // Check if email already exists in Admins table
        const existingAdmin = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`SELECT email FROM Admins WHERE email = @email`);

        if (existingUser.recordset.length > 0 || existingAdmin.recordset.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Insert into correct table based on roleID
        if (roleID === 2) { // Assuming roleID 2 is for Admins
            await pool.request()
                .input('userName', sql.VarChar, userName)
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, password)
                .input('roleID', sql.Int, roleID)
                .query(`
                    INSERT INTO Admins (adminName, email, hashedPasscode, roleID) 
                    VALUES (@userName, @email, HASHBYTES('SHA2_256', @password), @roleID)
                `);
        } else { // Register as a regular user2
            await pool.request()
                .input('userName', sql.VarChar, userName)
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, password)
                .input('roleID', sql.Int, roleID)
                .query(`
                    INSERT INTO Users (userName, email, hashedPasscode, roleID) 
                    VALUES (@userName, @email, HASHBYTES('SHA2_256', @password), @roleID)
                `);
        }

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// USER LOGIN API
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
  
      const pool = await poolPromise;
      let result = await pool.request()
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, password)
        .query(`
          SELECT userID AS id, userName, roleID FROM Users 
          WHERE email = @email 
          AND hashedPasscode = HASHBYTES('SHA2_256', @password)
        `);
  
      // Check in Admins table if not found in Users
      if (result.recordset.length === 0) {
        result = await pool.request()
          .input('email', sql.VarChar, email)
          .input('password', sql.VarChar, password)
          .query(`
            SELECT adminID AS id, adminName AS userName, roleID FROM Admins 
            WHERE email = @email 
            AND hashedPasscode = HASHBYTES('SHA2_256', @password)
          `);
      }
  
      if (result.recordset.length > 0) {
        const { id, userName, roleID } = result.recordset[0];
  
        // Generate JWT token
        const token = jwt.sign(
          { userID: id, userName, roleID },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );       
  
        // Set token as HTTP-only cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: false,      
          sameSite: "Lax",    
          maxAge: 3600000
        });
        
        // Send response to frontend without sending token in body
        return res.json({
          message: "Login successful",
          userName,
          roleID,
          userID: id
        });

      } else {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
//  request password reset enpoint (Update password)
app.post('/api/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const pool = await poolPromise;

        // Check if the email exists in the database
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`SELECT userName FROM Users WHERE email = @email`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        const { userName } = result.recordset[0];

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString("hex"); // 64 chars hex string
        const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

        // Save the token and expiry in the database
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('resetToken', sql.VarChar, resetToken)
            .input('resetTokenExpiry', sql.DateTime, resetTokenExpiry)
            .query(`
                UPDATE Users
                SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry
                WHERE email = @email
            `);

        // Generate the reset link
        const resetLink = `http://localhost:3000/reset-password/new?token=${resetToken}&email=${email}`;

        // Send the reset email
        await sendResetEmail(email, userName, resetLink);

        res.status(200).json({ message: "Password reset email sent successfully" });
    } catch (error) {
        console.error("Error requesting password reset:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reset password endoint ( that actually resets )
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ message: "Email, token, and new password are required" });
        }

        const pool = await poolPromise;

        // Validate the token and email
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('token', sql.VarChar, token)
            .query(`
                SELECT resetTokenExpiry FROM Users
                WHERE email = @email AND resetToken = @token
            `);

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const { resetTokenExpiry } = result.recordset[0];
        if (new Date(resetTokenExpiry) < new Date()) {
            return res.status(400).json({ message: "Reset token has expired" });
        }

        // Update the password
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('newPassword', sql.VarChar, newPassword)
            .query(`
                UPDATE Users
                SET hashedPasscode = HASHBYTES('SHA2_256', @newPassword),
                    resetToken = NULL,
                    resetTokenExpiry = NULL
                WHERE email = @email
            `);

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// DELETE ACCOUNT API
app.delete('/api/delete-account', async (req, res) => {
  try {
    const { email } = req.body;
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Basic ')) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Decode Basic Auth (base64: email:password)
    const encoded = auth.split(' ')[1];
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    if (username !== email) {
      return res.status(400).json({ message: 'Email mismatch in auth and body.' });
    }

    const pool = await poolPromise;

    // Corrected: use userID instead of id
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .query(`
        SELECT userID FROM Users 
        WHERE email = @email 
        AND hashedPasscode = HASHBYTES('SHA2_256', @password)
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const userID = user.userID;

    // Step 1: Delete user’s reviews
    await pool.request()
      .input('userID', sql.Int, userID)
      .query('DELETE FROM Reviews WHERE userID = @userID');

    // Step 2: Delete user
    await pool.request()
      .input('userID', sql.Int, userID)
      .query('DELETE FROM Users WHERE userID = @userID');

    return res.json({ message: 'Account and related reviews deleted successfully.' });

  } catch (err) {
    console.error('❌ Error deleting account:', err);
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }
});

// DELETE /api/users/:id  (Admin only)
app.delete('/api/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userID = parseInt(req.params.id, 10);
    const pool   = await poolPromise;

    await pool.request()
    .input('userID', sql.Int, userID)
    .query(`
    DELETE FROM Users
    WHERE userID = @userID
    `);                   

    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// To tell fronten Who am I 
app.get('/api/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Logout API 
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

/////////////////////////////////////    CRUD OPERATIONS (CUD)    /////////////////////////////////////////////////
// Insert Movie (Admin only)
app.post('/api/movies', upload.single('image'), async (req, res) => {
  const { title, genre, releaseDate, duration, description } = req.body;
  const imageFile = req.file;

  if (!imageFile) {
    return res.status(400).json({ message: 'Image is required' });
  }

  const imageURL = `http://localhost:5000/uploads/${imageFile.filename}`;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.VarChar, title)
      .input('genre', sql.VarChar, genre)
      .input('releaseDate', sql.Date, releaseDate)
      .input('duration', sql.Int, duration)
      .input('description', sql.VarChar, description)
      .input('imageURL', sql.VarChar, imageURL)
      .query(`
        INSERT INTO Movies (title, genre, releaseDate, duration, description, imageURL)
        OUTPUT INSERTED.movieID
        VALUES (@title, @genre, @releaseDate, @duration, @description, @imageURL)
      `);

    const newMovieID = result.recordset[0].movieID;
    res.status(201).json({ message: 'Movie added successfully', movieID: newMovieID });

  } catch (err) {
    console.error('❌ Error inserting movie:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update Movie
app.put('/api/movies/:id', authenticateToken, authorizeAdmin, upload.single('image'), async (req, res) => {
  const { title, releaseDate, genre, duration, description } = req.body;
  const movieID = parseInt(req.params.id);
  const imageFile = req.file;

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('movieID', sql.Int, movieID);

    if (title) request.input('title', sql.VarChar, title);
    if (releaseDate) request.input('releaseDate', sql.Date, releaseDate);
    if (genre) request.input('genre', sql.VarChar, genre);
    if (duration) request.input('duration', sql.Int, duration);
    if (description) request.input('description', sql.VarChar, description);
    if (imageFile) {
      const imageURL = `http://localhost:5000/uploads/${imageFile.filename}`;
      request.input('imageURL', sql.VarChar, imageURL);
    }

    const updates = [];
    if (title) updates.push('title = @title');
    if (releaseDate) updates.push('releaseDate = @releaseDate');
    if (genre) updates.push('genre = @genre');
    if (duration) updates.push('duration = @duration');
    if (description) updates.push('description = @description');
    if (imageFile) updates.push('imageURL = @imageURL');

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update.' });
    }

    const updateQuery = `
      UPDATE Movies
      SET ${updates.join(', ')}
      WHERE movieID = @movieID
    `;

    await request.query(updateQuery);
    res.status(200).json({ message: 'Movie updated successfully!' });
  } catch (error) {
    console.error('❌ Error in updating movie:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete Movie
app.delete('/api/movies/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const movieID = parseInt(req.params.id);
    await deleteMovie(movieID);
    res.status(200).json({ message: 'Movie deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Insert Theatre (Admin only)
app.post("/api/theatres", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { theatreName, theatreLocation, totalSeats } = req.body;
        await insertTheatre(theatreName, theatreLocation, totalSeats);
        res.status(201).json({ message: "Theatre added successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Theatre (Admin only)
app.put("/api/theatres/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { theatreName, theatreLocation, totalSeats } = req.body;
        const theatreID = parseInt(req.params.id);
        await updateTheatre(theatreID, theatreName, theatreLocation, totalSeats);
        res.status(200).json({ message: "Theatre updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Theatre (Admin only)
app.delete("/api/theatres/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const theatreID = parseInt(req.params.id);
        await deleteTheatre(theatreID);
        res.status(200).json({ message: "Theatre deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.post('/api/screens',
  authenticateToken, authorizeAdmin,
  async (req, res) => {
    try {
      const theatreID  = Number(req.body.theatreID);
      const screenName = String(req.body.screenName || '').trim();

      if (!theatreID || !screenName)
        return res.status(400).json({ message: 'theatreID and screenName are required.' });

      // 1. Create the screen 
      const screenID = await insertScreen(theatreID, screenName, 100);

      // 2. Seed 100 seats A‑T × 1‑5
      await seedSeatsForScreen(screenID);

      res.status(201).json({ message: 'Screen added with 100 seats.', screenID });
    } catch (err) {
      console.error('Add screen failed:', err);
      res.status(500).json({ message: 'Internal server error', detail: err.message });
    }
});

// Update Screen (Admin only)
app.put("/api/screens/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { newTheatreID, newScreenName, newTotalSeats } = req.body;
        const screenID = parseInt(req.params.id);
        
        await updateScreen(screenID, newTheatreID, newScreenName, newTotalSeats);
        res.status(200).json({ message: "Screen updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Screen (Admin only)
app.delete("/api/screens/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const screenID = parseInt(req.params.id);
        await deleteScreen(screenID);
        res.status(200).json({ message: "Screen deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Insert Showtime (Admin only)
app.post("/api/showtimes", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { movieID, screenID, showDate, showStartTime, showEndTime, availableSeats } = req.body;

        await insertShowtime(movieID, screenID, showDate, showStartTime, showEndTime, availableSeats);
        res.status(201).json({ message: "Showtime added successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Update Showtime (Admin only)
app.put("/api/showtimes/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
      const showtimeID = parseInt(req.params.id);
      const {
        newMovieID,
        newScreenID,
        newShowDate,
        newShowStartTime,
        newShowEndTime,
        newAvailableSeats
      } = req.body;
  
      await updateShowtime(
        showtimeID,
        newMovieID,
        newScreenID,
        newShowDate,
        newShowStartTime,
        newShowEndTime,
        newAvailableSeats
      );
  
      res.status(200).json({ message: "Showtime updated successfully!" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
// Delete Showtime (Admin only)
app.delete("/api/showtimes/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const showtimeID = parseInt(req.params.id);
        await deleteShowtime(showtimeID);
        res.status(200).json({ message: "Showtime deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remain as it is because atabaseServer has changed logic 

// Insert Ticket (Admin only)
app.post("/api/tickets", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { showtimeID, price, availableTickets } = req.body;
        await insertTicket(showtimeID, price, availableTickets);
        res.status(201).json({ message: "Ticket added successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Ticket (Admin only)
app.put("/api/tickets/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const ticketID = parseInt(req.params.id);
        const { newShowtimeID, newPrice, newAvailableTickets } = req.body;
        await updateTicket(ticketID, newShowtimeID, newPrice, newAvailableTickets);
        res.status(200).json({ message: "Ticket updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Ticket (Admin only)
app.delete("/api/tickets/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const ticketID = parseInt(req.params.id);
        await deleteTicket(ticketID);
        res.status(200).json({ message: "Ticket deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get ticket Prices (changed logic with the new schema)
app.get('/api/tickets/prices', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT t.ticketID, td.showtimeID, td.price, td.availableTickets
      FROM Tickets t
      JOIN TicketDetails td ON t.showtimeID = td.showtimeID
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching ticket prices:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Insert Booking (Authenticated Users)
app.post("/api/bookings", authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userID, showtimeID, seatsBooked, bookingStatus } = req.body;
        await insertBooking(userID, showtimeID, seatsBooked, bookingStatus);
        res.status(201).json({ message: "Booking added successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Booking (Users only update their own)
app.put("/api/bookings/:id", authenticateToken, authorizeUser, async (req, res) => {
    try {
        const bookingID = parseInt(req.params.id);
        const { seatsBooked, bookingStatus } = req.body;
        await updateBooking(bookingID, seatsBooked, bookingStatus);
        res.status(200).json({ message: "Booking updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Booking (Users only delete their own)
app.delete("/api/bookings/:id", authenticateToken, authorizeUser, async (req, res) => {
    try {
        const bookingID = parseInt(req.params.id);
        await deleteBooking(bookingID);
        res.status(200).json({ message: "Booking deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Payment (Authenticated Users)
app.put("/api/payments/:id", authenticateToken, authorizeUser, async (req, res) => {
    try {
        const paymentID = parseInt(req.params.id);
        const { amount, paymentMethod, paymentStatus } = req.body;
        await updatePayment(paymentID, amount, paymentMethod, paymentStatus);
        res.status(200).json({ message: "Payment updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Payment (Authenticated Users)
app.delete("/api/payments/:id", authenticateToken, authorizeUser, async (req, res) => {
    try {
        const paymentID = parseInt(req.params.id);
        await deletePayment(paymentID);
        res.status(200).json({ message: "Payment deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Insert Review (Authenticated Users)
app.post("/api/reviews", authenticateToken, authorizeUser, async (req, res) => {
  try {
    const { movieID, rating, reviewText } = req.body;
    const userID = req.user.userID;
    await insertReview(userID, movieID, rating, reviewText);
    res.status(201).json({ message: "Review added successfully!" });

  } catch (error) {
    console.error("❌ Error inserting review:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Review (Authenticated Users)
app.put("/api/reviews/:id", authenticateToken, authorizeUser, async (req, res) => {
    try {
        const reviewID = parseInt(req.params.id);
        const { rating, reviewText } = req.body;
        await updateReview(reviewID, rating, reviewText);
        res.status(200).json({ message: "Review updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Review (Authenticated Users)
app.delete("/api/reviews/:id", authenticateToken, authorizeUser, async (req, res) => {
  try {
    const reviewID = parseInt(req.params.id);
    const userID = req.user.userID;

    const pool = await poolPromise;

    // Optional: Check if review exists and belongs to user
    const result = await pool.request()
      .input("reviewID", sql.Int, reviewID)
      .input("userID", sql.Int, userID)
      .query(`
        DELETE FROM Reviews
        WHERE reviewID = @reviewID AND userID = @userID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Review not found or not yours to delete." });
    }

    return res.status(200).json({ message: "Review deleted successfully!" });

  } catch (error) {
    console.error("❌ Error deleting review:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get('/api/my-reviews', authenticateToken, authorizeUser, async (req, res) => {
  try {
    const pool = await poolPromise;

    // use the logged-in user info from token
    const userID = req.user?.userID;

    if (!userID) return res.status(401).json({ message: 'Unauthorized' });

    const reviewResult = await pool.request()
      .input('userID', sql.Int, userID)
      .query(`
        SELECT 
        r.reviewID, 
        r.reviewText,
        r.rating,
        r.reviewDate,
        m.title AS movieTitle
      FROM Reviews r
      JOIN Movies m ON r.movieID = m.movieID
      WHERE r.userID = @userID
      ORDER BY r.reviewID DESC
      `);

    return res.json(reviewResult.recordset);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

app.delete('/reviews/:id',authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Reviews WHERE reviewID = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting review');
  }
});


/////////////////////////////////////      SELECT * ROUTES      /////////////////////////////////////////////////

app.get('/api/roles', selectAllRoute('Roles'));
app.get('/api/admins', selectAllRoute('Admins'));
app.get('/api/users', selectAllRoute('Users'));
app.get('/api/movies', selectAllRoute('Movies'));
app.get('/api/theatres', selectAllRoute('Theatres'));
app.get('/api/screens', selectAllRoute('Screens'));
app.get('/api/showtimes', selectAllRoute('Showtimes'));
app.get('/api/bookings', selectAllRoute('Bookings'));
app.get('/api/seatLayout', selectAllRoute('SeatLayout'));
app.get('/api/seatReservation', selectAllRoute('SeatReservation'));
app.get('/api/payments', selectAllRoute('Payments'));
app.get('/api/reviews', selectAllRoute('Reviews'));

// GET movies by theatre ID
app.get('/api/movies/by-theatre/:theatreID', async (req, res) => {
  try {
    const theatreID = parseInt(req.params.theatreID);
    const pool = await poolPromise;

    const result = await pool.request()
      .input('theatreID', sql.Int, theatreID)
      .query(`
        SELECT DISTINCT m.*
        FROM Movies m
        JOIN Showtimes s ON m.movieID = s.movieID
        JOIN Screens sc ON s.screenID = sc.screenID
        WHERE sc.theatreID = @theatreID;
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching movies by theatre:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/tickets', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        t.ticketID,
        td.price,
        td.availableTickets,
        td.showtimeID,
        m.title AS movieTitle,
        s.screenName,
        th.theatreName,
        st.showDate,
        st.showStartTime,
        st.showEndTime
      FROM Tickets t
      JOIN TicketDetails td ON t.showtimeID = td.showtimeID
      JOIN Showtimes st ON t.showtimeID = st.showtimeID
      JOIN Movies m ON st.movieID = m.movieID
      JOIN Screens s ON st.screenID = s.screenID
      JOIN Theatres th ON s.theatreID = th.theatreID
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


///////////////////////////////      SQL RETRIEVAL QUERIES FROM DB       ///////////////////////////////////////

// Query 1: Get total users and admins
app.get('/api/roleCounts', authenticateToken, authorizeAdmin, async (req, res) => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM Users) AS TotalUsers,
        (SELECT COUNT(*) FROM Admins) AS TotalAdmins;
    `;
    await handleQueryResponse(res, query);
  });
  

// Query 2: Get available movies
app.get('/api/availableMovies', async (req, res) => {
  const query = `SELECT * FROM Movies WHERE releaseDate <= GETDATE()`;
  await handleQueryResponse(res, query);
});

// Query 3: Get upcoming showtimes
app.get('/api/upcomingShowtimes', async (req, res) => {
  const query = `
    SELECT M.movieID, M.title, M.genre, S.showDate, S.showStartTime, S.showEndTime
    FROM Movies M
    JOIN Showtimes S ON M.movieID = S.movieID
    WHERE S.showDate >= GETDATE()
    ORDER BY S.showDate, S.showStartTime;
  `;
  await handleQueryResponse(res, query);
});

// Query 4: Get upcoming movies
app.get('/api/upcomingMovies', async (req, res) => {
  const query = `SELECT * FROM Movies WHERE releaseDate > GETDATE() ORDER BY releaseDate ASC`;
  await handleQueryResponse(res, query);
});

// Query 5: Get most popular upcoming showtimes movie
app.get('/api/mostPopularMovieByShowimes', async (req, res) => {
  const query = `
    SELECT TOP 1 M.title, COUNT(S.showtimeID) AS TotalShowtimes
    FROM Movies M
    JOIN Showtimes S ON M.movieID = S.movieID
    WHERE S.showDate >= GETDATE()
    GROUP BY M.title
    ORDER BY TotalShowtimes DESC;
  `;
  await handleQueryResponse(res, query);
});

// Query 6: Count showtimes per theatre
app.get('/api/showtimesPerTheatre', async (req, res) => {
  const query = `
    SELECT T.theatreName, COUNT(S.showtimeID) AS TotalShowtimes
    FROM Theatres T
    JOIN Screens SC ON T.theatreID = SC.theatreID
    JOIN Showtimes S ON SC.screenID = S.screenID
    WHERE S.showDate >= GETDATE()
    GROUP BY T.theatreName
    ORDER BY TotalShowtimes DESC;
  `;
  await handleQueryResponse(res, query);
});

// Query 7: Get most popular movie based on booking
app.get('/api/mostPopularMovieByBookings', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(`
          SELECT M.title, COUNT(B.bookingID) AS TotalBookings
          FROM Movies M
          LEFT JOIN Showtimes S ON M.movieID = S.movieID
          LEFT JOIN Bookings B ON S.showtimeID = B.showtimeID
          GROUP BY M.title
          HAVING COUNT(B.bookingID) > 0
          ORDER BY TotalBookings DESC;
        `);
      
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching booking data:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
// Query 8: Most popular theatre
app.get('/api/mostBookedTheatre', async (req, res) => {
  const query = `
    SELECT TOP 1 T.theatreName, COUNT(B.bookingID) AS TotalBookings
    FROM Theatres T
    JOIN Screens S ON T.theatreID = S.theatreID
    JOIN Showtimes ST ON S.screenID = ST.screenID
    JOIN Bookings B ON ST.showtimeID = B.showtimeID
    GROUP BY T.theatreName
    ORDER BY TotalBookings DESC;
  `;
  await handleQueryResponse(res, query);
});

// Query 9: Users with no bookings
app.get('/api/usersWithNoBookings', async (req, res) => {
  const query = `
    SELECT U.userID, U.userName, U.email
    FROM Users U
    LEFT JOIN Bookings B ON U.userID = B.userID
    WHERE B.userID IS NULL;
  `;
  await handleQueryResponse(res, query);
});

// Query 10: Most loyal customers (top 5)
app.get('/api/mostLoyalCustomers', async (req, res) => {
  const query = `
 SELECT TOP 5 userName, COUNT(*) AS totalBookings
FROM Bookings B
JOIN Users U ON B.userID = U.userID
GROUP BY userName
ORDER BY totalBookings DESC;
  `;
  await handleQueryResponse(res, query);
});

// Query 11: Movies with Low Bookings & Ratings
app.get('/api/underperformingMovies', async (req, res) => {
  const query = `
    SELECT m.title, 
           COUNT(b.bookingID) AS totalBookings, 
           AVG(r.rating) AS avgRating
    FROM Movies m
    JOIN Reviews r ON m.movieID = r.movieID
    JOIN Showtimes s ON m.movieID = s.movieID
    LEFT JOIN Bookings b ON s.showtimeID = b.showtimeID
    GROUP BY m.title
    HAVING COUNT(b.bookingID) < 5 AND AVG(r.rating) < 3;
  `;
  await handleQueryResponse(res, query);
});

// Query 12: Successful Payments
app.get('/api/successfulPayments', async (req, res) => {
  const query = `
    SELECT * FROM Payments WHERE paymentStatus = 'Paid';
  `;
  await handleQueryResponse(res, query);
});

// Query 13: Payment Method Popularity
app.get('/api/paymentMethodPopularity', async (req, res) => {
  const query = `
    SELECT paymentMethod, COUNT(paymentID) AS TotalTransactions, SUM(amount) AS TotalAmount
    FROM Payments
    WHERE paymentStatus = 'Paid'
    GROUP BY paymentMethod
    ORDER BY TotalTransactions DESC;
  `;
  await handleQueryResponse(res, query);
});

// Query 14: Top 5 Movies with Highest Rating
app.get('/api/topRatedMovies', async (req, res) => {
  const query = `
    SELECT TOP 5
  M.movieID,
  M.title,
  M.genre,
  M.imageURL,
  AVG(R.rating) AS AvgRating
FROM Movies M
JOIN Reviews R ON M.movieID = R.movieID
GROUP BY M.movieID, M.title, M.genre, M.imageURL
ORDER BY AvgRating DESC;
  `;
  await handleQueryResponse(res, query);
});

/////////////////////////////////////      VIEWS      /////////////////////////////////////////////////

app.get('/api/activeShowtimes', selectAllRoute('ActiveShowtimes'));
app.get('/api/paymentDetails', selectAllRoute('PaymentDetails'));
app.get('/api/theatreEarnings', selectAllRoute('TheatreEarnings'));
app.get('/api/userBookingHistory', selectAllRoute('UserBookingHistory'));
app.get('/api/moviePopularity', selectAllRoute('MoviePopularity'));
app.get('/api/bookingDetails', selectAllRoute('BookingDetails'));


/////////////////////////////////////      PROCEDURE ROUTEs           /////////////////////////////////////

//  Procedure 1: Total Revenue in a Date Range
app.get('/api/totalRevenue', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).send("Both startDate and endDate are required.");
  }

  const params = {
    StartDate: startDate,
    EndDate: endDate,
  };

  try {
    const result = await callProcedureRoute('GetTotalRevenue', params);
    res.json(result);
  } catch (err) {
    console.error("Error in /api/totalRevenue:", err);
    res.status(500).send("Something went wrong while fetching total revenue.");
  }
});

//  Procedure 2: High-Spending Customers
app.get('/api/highSpendingCustomers', async (req, res) => {
  const { topN } = req.query;

  // Ensure 'topN' is provided and is a valid number
  if (!topN || isNaN(topN) || topN <= 0) {
    return res.status(400).send("Please provide a valid positive number for 'topN'.");
  }

  const params = { TopN: parseInt(topN) };

  try {
    const result = await callProcedureRoute('GetHighSpendingCustomers', params);

    res.json(result);
  } catch (err) {
    res.status(500).send("Something went wrong while fetching high spending customers.");
  }
});

//  Procedure 3: Avg Amount spent per user
app.get('/api/avgSpentPerUser', async (req, res) => {
  try {
    const result = await callProcedureRoute('GetAvgSpentPerUser', {});

    res.json(result);
  } catch (err) {
    res.status(500).send("Something went wrong while fetching average amount spent per user.");
  }
});


///////////////////////////////////////////////// NEW ONES /////////////////////////


// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// To get detail of single movie
app.get('/api/movieDetails/:id', async (req, res) => {
    const movieID = req.params.id;
  
    try {
      const pool = await poolPromise; 
      const result = await pool
        .request()
        .input('movieID', sql.Int, movieID)
        .query('SELECT * FROM Movies WHERE movieID = @movieID');
  
      if (result.recordset.length > 0) {
        res.json(result.recordset[0]);
      } else {
        res.status(404).json({ message: 'Movie not found' });
      }
    } catch (err) {
      console.error('Error fetching movie details:', err);
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  });
  
  // to make the booking and payments combine in frontend
  app.post('/api/book', authenticateToken, authorizeUser, async (req, res) => {
    const { userID, showtimeID, seatIDs } = req.body;
  
    if (!Array.isArray(seatIDs) || seatIDs.length === 0) {
      return res.status(400).json({ error: 'No seats selected.' });
    }
  
    const seatsBooked = seatIDs.length;
  
    try {
      const pool = await poolPromise;
  
      // Create temp table for OUTPUT
      await pool.request().query(`
        IF OBJECT_ID('tempdb..#InsertedBookings') IS NOT NULL DROP TABLE #InsertedBookings;
        CREATE TABLE #InsertedBookings (bookingID INT);
      `);
  
      // Insert Booking with OUTPUT INTO
      await pool.request()
        .input('userID', sql.Int, userID)
        .input('showtimeID', sql.Int, showtimeID)
        .input('seatsBooked', sql.Int, seatsBooked)
        .input('bookingStatus', sql.VarChar, 'Booked')
        .query(`
          INSERT INTO Bookings (userID, showtimeID, seatsBooked, bookingStatus)
          OUTPUT INSERTED.bookingID INTO #InsertedBookings
          VALUES (@userID, @showtimeID, @seatsBooked, @bookingStatus);
        `);
  
      // Retrieve bookingID
      const result = await pool.request().query('SELECT TOP 1 bookingID FROM #InsertedBookings');
      const bookingID = result.recordset[0].bookingID;
  
      // Insert SeatReservations
      for (const seatID of seatIDs) {
        await pool.request()
          .input('bookingID', sql.Int, bookingID)
          .input('seatID', sql.Int, seatID)
          .query(`
            INSERT INTO SeatReservation (bookingID, seatID)
            VALUES (@bookingID, @seatID);
          `);
      }
  
      res.status(201).json({ success: true, bookingID });
    } catch (err) {
      console.error('Booking error:', err);
      res.status(500).json({ error: 'Booking failed', details: err.message });
    }
  });
  
  // Query: Total number of bookings
app.get('/api/totalBookings', authenticateToken, authorizeAdmin, async (req, res) => {
  const query = `
    SELECT COUNT(*) AS totalBookings FROM Bookings
  `;
  await handleQueryResponse(res, query);
});

// Query: Detailed bookings of all users
app.get('/api/allBookingDetails', authenticateToken, authorizeAdmin, async (req, res) => {
  const query = `
   SELECT 
  u.userName,
  p.paymentID, 
  m.title AS movieTitle,
  FORMAT(b.bookingTime, 'yyyy-MM-dd') AS bookingDate,
  b.seatsBooked,
  p.paymentMethod,
  p.paymentStatus
FROM Bookings b
JOIN Users u ON b.userID = u.userID
JOIN Showtimes s ON b.showtimeID = s.showtimeID
JOIN Movies m ON s.movieID = m.movieID
LEFT JOIN Payments p ON b.bookingID = p.bookingID
WHERE b.bookingStatus = 'Booked'
ORDER BY b.bookingTime DESC;
  `;

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('🔥 Failed to fetch allBookingDetails:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.post('/api/togglePaymentStatus', async (req, res) => {
  const { paymentID } = req.body;

  if (!paymentID) {
    return res.status(400).json({ error: 'paymentID is required' });
  }

  try {
    const pool = await poolPromise; 
    const request = pool.request(); 

    request.input('paymentID', sql.Int, paymentID);

    const query = `
      UPDATE Payments
      SET paymentStatus = 
        CASE 
          WHEN paymentStatus = 'Pending' THEN 'Paid'
          ELSE 'Pending'
        END
      WHERE paymentID = @paymentID;
    `;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment status toggled successfully' });
  } catch (error) {
    console.error('Error toggling payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  // Backend route to get booking details
  app.get('/api/bookingDetails/:bookingID', async (req, res) => {
    const { bookingID } = req.params;
  
    try {
      const pool = await poolPromise;
  
      const result = await pool.request()
        .input('bookingID', sql.Int, bookingID)
        .query(`
          SELECT 
            B.bookingID,
            M.title AS movieTitle,
            T.theatreName,
            S.screenName,
            B.seatsBooked,
            B.bookingStatus,
            P.paymentMethod,
            P.paymentStatus,
            P.amount
          FROM Bookings B
          JOIN Showtimes ST ON B.showtimeID = ST.showtimeID
          JOIN Screens S ON ST.screenID = S.screenID
          JOIN Theatres T ON S.theatreID = T.theatreID
          JOIN Movies M ON ST.movieID = M.movieID
          JOIN Payments P ON B.bookingID = P.bookingID
          WHERE B.bookingID = @bookingID
        `);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
  
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  });  
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// GET /api/users/:id/bookings   – all bookings for a single user
app.get('/api/users/:id/bookings', authenticateToken, async (req, res) => {
  const userID = parseInt(req.params.id);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .query(`
        SELECT  B.*, 
                M.title        AS movieTitle,
                T.theatreName,
                S.screenName,
                P.paymentStatus,
                P.paymentID, 
                P.amount
        FROM Bookings B
        JOIN Showtimes ST  ON B.showtimeID = ST.showtimeID
        JOIN Movies    M   ON ST.movieID   = M.movieID
        JOIN Screens   S   ON ST.screenID  = S.screenID
        JOIN Theatres  T   ON S.theatreID  = T.theatreID
        LEFT JOIN Payments P ON B.bookingID = P.bookingID
        WHERE B.userID = @userID
        ORDER BY B.bookingTime DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET: Showtimes for booking (for front-end filter)
app.get('/api/showtimesForBooking', async (_req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT  ST.*, SC.theatreID          -- add theatreID for front‑end filter
      FROM    Showtimes ST
      JOIN    Screens  SC ON ST.screenID = SC.screenID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching showtimes:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/refundPayment
app.post('/api/refundPayment', authenticateToken, authorizeUser, async (req, res) => {
  const { paymentID } = req.body;
  if (!paymentID) return res.status(400).json({ error: 'paymentID is required' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('paymentID', sql.Int, paymentID)
      .query(`
        UPDATE Payments
        SET paymentStatus = 'Refunded'
        WHERE paymentID = @paymentID AND paymentStatus = 'Paid'
      `);

    if (result.rowsAffected[0] === 0)
      return res
        .status(404)
        .json({ error: 'Payment not found, not paid, or already refunded' });

    res.json({ message: 'Payment refunded successfully' });
  } catch (err) {
    console.error('Error refunding payment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
