const { sql, poolPromise } = require('./next');
const bcrypt = require('bcryptjs');

// Delete Account
async function deleteAccount(email) {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('email', sql.NVarChar, email)
            .execute('DeleteAccount');
        return { message: 'Account deleted successfully' };
    } catch (err) {
        console.error('Error deleting account:', err);
        throw new Error('Failed to delete account');
    }
}

// Insert Movie
async function insertMovie(title, releaseDate, genre, duration) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("title", sql.VarChar(255), title)
            .input("releaseDate", sql.Date, releaseDate)
            .input("genre", sql.VarChar(100), genre)
            .input("duration", sql.Int, duration)
            .execute("InsertMovie");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}
const updateMovie = async (movieID, title, releaseDate, genre, duration) => {
    const pool = await poolPromise;
    await pool.request()
      .input('movieID', sql.Int, movieID)
      .input('title', sql.VarChar, title)
      .input('releaseDate', sql.Date, releaseDate)
      .input('genre', sql.VarChar, genre)
      .input('duration', sql.Int, duration)
      .query(`
        UPDATE Movies
        SET title = @title,
            releaseDate = @releaseDate,
            genre = @genre,
            duration = @duration
        WHERE movieID = @movieID
      `);
  };
  
  const deleteMovie = async (movieID) => {
    const pool = await poolPromise;
    await pool.request()
      .input('movieID', sql.Int, movieID)
      .query(`DELETE FROM Movies WHERE movieID = @movieID`);
  };
  
// Insert Theatre
async function insertTheatre(theatreName, theatreLocation, totalSeats) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("theatreName", sql.VarChar(50), theatreName)
            .input("theatreLocation", sql.VarChar(50), theatreLocation)
            .input("totalSeats", sql.Int, totalSeats)
            .execute("InsertTheatre");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update Theatre
async function updateTheatre(theatreID, theatreName, theatreLocation, totalSeats) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("theatreID", sql.Int, theatreID)
            .input("theatreName", sql.VarChar(50), theatreName || null)
            .input("theatreLocation", sql.VarChar(50), theatreLocation || null)
            .input("totalSeats", sql.Int, totalSeats || null)
            .execute("UpdateTheatre");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Delete Theatre
async function deleteTheatre(theatreID) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("theatreID", sql.Int, theatreID)
            .execute("DeleteTheatre");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update Screen
async function updateScreen(screenID, newTheatreID, newScreenName, newTotalSeats) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("screenID", sql.Int, screenID)
            .input("newTheatreID", sql.Int, newTheatreID || null)
            .input("newScreenName", sql.VarChar(50), newScreenName || null)
            .input("newTotalSeats", sql.Int, newTotalSeats || null)
            .execute("UpdateScreenDynamic");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Delete Screen
async function deleteScreen(screenID, theatreID, screenName) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("screenID", sql.Int, screenID || null)
            .input("theatreID", sql.Int, theatreID || null)
            .input("screenName", sql.VarChar(50), screenName || null)
            .execute("DeleteScreenDynamic");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}
// INSERT SCREEN
async function insertScreen(theatreID, screenName, totalSeats) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('theatreID',  sql.Int,      theatreID)
      .input('screenName', sql.VarChar,  screenName)
      .input('totalSeats', sql.Int,      totalSeats)
      .query(`
        INSERT INTO Screens (theatreID, screenName, totalSeats)
        OUTPUT INSERTED.screenID
        VALUES (@theatreID, @screenName, @totalSeats)
      `);
  
    return result.recordset[0].screenID;   // return new id
  }
  
 async function seedSeatsForScreen(screenID) {
   const pool = await poolPromise;
 
   // Build a table‑value parameter (TVP) or bulk INSERT string
   // Here we use a single VALUES list for simplicity.
   let values = '';
   for (let r = 0; r < 20; r++) {
     const rowLetter = String.fromCharCode(65 + r); // 'A'..'T'
     for (let n = 1; n <= 5; n++) {
       values += `(${screenID}, '${rowLetter}', ${n}),`;
     }
   }
   values = values.slice(0, -1); // remove trailing comma
 
   await pool.request().query(`
     INSERT INTO SeatLayout (screenID, seatRow, seatNumber)
     VALUES ${values};
   `);
 }
 
// Insert Showtime
async function insertShowtime(movieID, screenID, showDate, showStartTime, showEndTime, availableSeats = 100) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("movieID", sql.Int, movieID)
            .input("screenID", sql.Int, screenID)
            .input("showDate", sql.Date, showDate)
            .input("showStartTime", sql.Time, showStartTime)
            .input("showEndTime", sql.Time, showEndTime)
            .input("availableSeats", sql.Int, availableSeats)
            .execute("CreateShowtime");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}


// Update Showtime
async function updateShowtime(
    showtimeID,
    newMovieID = null,
    newScreenID = null,
    newShowDate = null,
    newShowStartTime = null,
    newShowEndTime = null,
    newAvailableSeats = null
  ) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("showtimeID", sql.Int, showtimeID)
        .input("newMovieID", sql.Int, newMovieID)
        .input("newScreenID", sql.Int, newScreenID)
        .input("newShowDate", sql.Date, newShowDate)
        .input("newShowStartTime", sql.Time, newShowStartTime)
        .input("newShowEndTime", sql.Time, newShowEndTime)
        .input("newAvailableSeats", sql.Int, newAvailableSeats)
        .execute("UpdateShowtimeDynamic");
  
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
// Delete Showtime
  async function deleteShowtime(showtimeID) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("showtimeID", sql.Int, showtimeID)
            .input("movieID", sql.Int, null)
            .input("screenID", sql.Int, null)
            .input("showDate", sql.Date, null)
            .execute("DeleteShowtimeDynamic");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

 // Insert, delete an upaate tickets chanhged accordingly with new normalized schema
// Insert Ticket
async function insertTicket(showtimeID, price, availableTickets = 100) {
    try {
        const pool = await poolPromise;

        // Start a transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);

        // Insert into Tickets
        const ticketInsert = await request
            .input("showtimeID", sql.Int, showtimeID)
            .query("INSERT INTO Tickets (showtimeID) OUTPUT INSERTED.ticketID VALUES (@showtimeID)");

        const ticketID = ticketInsert.recordset[0].ticketID;

        // Insert into TicketDetails
        await request
            .input("price", sql.Decimal(10, 2), price)
            .input("availableTickets", sql.Int, availableTickets)
            .query(`
                INSERT INTO TicketDetails (showtimeID, price, availableTickets)
                VALUES (@showtimeID, @price, @availableTickets)
            `);

        await transaction.commit();
        return { ticketID, showtimeID, price, availableTickets };
    } catch (error) {
        if (transaction) await transaction.rollback();
        throw new Error(`Insert Ticket Error: ${error.message}`);
    }
}

// Update Ticket
async function updateTicket(ticketID, newShowtimeID, newPrice, newAvailableTickets) {
    try {
        const pool = await poolPromise;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);

        // Update Tickets table
        await request
            .input("ticketID", sql.Int, ticketID)
            .input("newShowtimeID", sql.Int, newShowtimeID)
            .query(`
                UPDATE Tickets
                SET showtimeID = @newShowtimeID
                WHERE ticketID = @ticketID
            `);

        // Update TicketDetails table
        await request
            .input("newPrice", sql.Decimal(10, 2), newPrice)
            .input("newAvailableTickets", sql.Int, newAvailableTickets)
            .query(`
                UPDATE TicketDetails
                SET price = @newPrice, availableTickets = @newAvailableTickets
                WHERE showtimeID = @newShowtimeID
            `);

        await transaction.commit();
        return { ticketID, newShowtimeID, newPrice, newAvailableTickets };
    } catch (error) {
        if (transaction) await transaction.rollback();
        throw new Error(`Update Ticket Error: ${error.message}`);
    }
}


// Delete Ticket
async function deleteTicket(ticketID) {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Deleting from Tickets will also delete from TicketDetails (via ON DELETE CASCADE)
        await request
            .input("ticketID", sql.Int, ticketID)
            .query("DELETE FROM Tickets WHERE ticketID = @ticketID");

        return { success: true, ticketID };
    } catch (error) {
        throw new Error(`Delete Ticket Error: ${error.message}`);
    }
}

// Insert Booking
async function insertBooking(userID, showtimeID, seatsBooked, bookingStatus) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("userID", sql.Int, userID)
            .input("showtimeID", sql.Int, showtimeID)
            .input("seatsBooked", sql.Int, seatsBooked)
            .input("bookingStatus", sql.VarChar(10), bookingStatus)
            .execute("InsertBooking");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update Booking
async function updateBooking(bookingID, seatsBooked, bookingStatus) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("bookingID", sql.Int, bookingID)
            .input("seatsBooked", sql.Int, seatsBooked)
            .input("bookingStatus", sql.VarChar(10), bookingStatus)
            .execute("UpdateBooking");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Delete Booking
async function deleteBooking(bookingID) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("bookingID", sql.Int, bookingID)
            .execute("DeleteBooking");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update Payment
async function updatePayment(paymentID, amount, paymentMethod, paymentStatus) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("paymentID", sql.Int, paymentID)
            .input("amount", sql.Decimal(10,2), amount)
            .input("paymentMethod", sql.VarChar(20), paymentMethod)
            .input("paymentStatus", sql.VarChar(10), paymentStatus)
            .execute("UpdatePayment");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Delete Payment
async function deletePayment(paymentID) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("paymentID", sql.Int, paymentID)
            .execute("DeletePayment");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Insert Review
async function insertReview(userID, movieID, rating, reviewText) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("userID", sql.Int, userID)
            .input("movieID", sql.Int, movieID)
            .input("rating", sql.Decimal(2,1), rating)
            .input("reviewText", sql.VarChar(sql.MAX), reviewText)
            .execute("InsertReview");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update Review
async function updateReview(reviewID, rating, reviewText) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("reviewID", sql.Int, reviewID)
            .input("rating", sql.Decimal(2,1), rating)
            .input("reviewText", sql.VarChar(sql.MAX), reviewText)
            .execute("UpdateReview");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Delete Review
async function deleteReview(reviewID) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("reviewID", sql.Int, reviewID)
            .execute("DeleteReview");

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function deleteAccount(email) {
    const pool = await poolPromise;
  
    // first try Users table
    let result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`DELETE FROM Users  OUTPUT DELETED.userID WHERE email = @email`);
  
    // if nothing deleted in Users, try Admins
    if (result.rowsAffected[0] === 0) {
      result = await pool.request()
        .input('email', sql.VarChar, email)
        .query(`DELETE FROM Admins OUTPUT DELETED.adminID WHERE email = @email`);
    }
  
    if (result.rowsAffected[0] === 0) {
      throw new Error('No account found with that email');
    }
  
    return { success: true };
  }

function selectAllRoute(tableName) {
    return async (req, res) => {
      try {
        const query = `SELECT * FROM ${tableName}`;
        const result = await runQuery(query);
        res.json(result);
      } catch (err) {
        res.status(500).send("Something went wrong.");
      }
    };
  }
  
  async function runQuery(queryString) {
    try {
      const pool = await poolPromise; 
      const result = await pool.request().query(queryString);
      return result.recordset;
    } catch (err) {
      console.error("Database Query Error:", err);
      throw err; // caller handles error
    }
  }

  // Reusable helper for custom query responses (saves repeated try-catch)
async function handleQueryResponse(res, query) {
    try {
      const result = await runQuery(query);
      res.json(result);
    } catch (err) {
      res.status(500).send("Something went wrong.");
    }
  }
  
  // Reusable helper for calling stored procedures
async function callProcedureRoute(procName, params = {}) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
  
      for (const key in params) {
        request.input(key, sql.VarChar(50), params[key]);
      }
  
      // Execute the stored procedure
      const result = await request.execute(procName);
      return result.recordset;
    } catch (err) {
      console.error("Error calling stored procedure:", err);
      throw err;
    }
  }
  

module.exports = {
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
};