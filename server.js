const express = require("express");
const app = express();
const { Pool } = require("pg");
const bodyParser = require("body-parser");

// middleware
app.use(bodyParser.json());

const pool = new Pool({
  user: "thonynava",
  host: "localhost",
  database: "cyf_hotels",
  password: "",
  port: 5432,
});

// Validation Functions
let validatingEmail = (text) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
};

app.get("/hotels", async (req, res) => {
  try {
    let query = `SELECT * FROM hotels ORDER BY name`;

    if (req.query.name) {
      query = `SELECT * FROM hotels WHERE name LIKE '%${req.query.name}%'`;
    }

    await pool.query(query).then((results) => res.json(results.rows));
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/hotels/:hotelId", async (req, res) => {
  try {
    const hotelId = req.params.hotelId;
    await pool
      .query("SELECT * FROM hotels WHERE id = $1", [hotelId])
      .then((results) => res.json(results.rows[0]));
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/hotels", async (req, res) => {
  try {
    const newHotelName = req.body.name;
    const newHotelRooms = req.body.rooms;
    const newHotelPostcode = req.body.postcode;

    if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
      return res
        .status(400)
        .send("The number of rooms should be a positive integer.");
    }

    await pool
      .query("SELECT * FROM hotels WHERE name = $1", [newHotelName])
      .then(async (result) => {
        if (result.rows.length > 0) {
          return res
            .status(400)
            .send("There is already a hotel with that name.");
        } else {
          const query =
            "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3)";
          await pool
            .query(query, [newHotelName, newHotelRooms, newHotelPostcode])
            .then((results) => res.send("New Hotel added successfully."));
        }
      });
  } catch (err) {
    console.error(err.message);
  }
});

app.delete("/hotels/:hotelId", async (req, res) => {
  try {
    const hotelId = req.params.hotelId;

    await pool
      .query("DELETE FROM bookings WHERE hotel_id=$1", [hotelId])
      .then(async () => {
        await pool
          .query("DELETE FROM hotels WHERE id=$1", [hotelId])
          .then(() => res.send(`Hotel ${hotelId} deleted!`));
      });
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/customers", async (req, res) => {
  try {
    let query = `SELECT * FROM customers ORDER BY name`;

    if (req.query.name) {
      query = `SELECT * FROM customers WHERE name LIKE '%${req.query.name}%'`;
    }

    await pool.query(query).then((results) => res.json(results.rows));
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    await pool
      .query("SELECT * FROM customers WHERE id = $1", [customerId])
      .then((results) => res.json(results.rows[0]));
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/customers/:customerId/bookings", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const query =
      "SELECT checkin_date, nights, hotels.name AS hotels_name, hotels.postcode AS hotels_postcode FROM bookings JOIN hotels ON bookings.hotel_id = hotels.id WHERE customer_id = $1";
    await pool
      .query(query, [customerId])
      .then((results) => res.json(results.rows[0]));
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/customers", async (req, res) => {
  try {
    const newCustomerName = req.body.name;
    const newCustomerEmail = req.body.email;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerPostcode = req.body.postcode;
    const newCustomerCountry = req.body.country;

    await pool
      .query("SELECT * FROM customers WHERE name = $1", [newCustomerEmail])
      .then(async (result) => {
        if (result.rows.length > 0) {
          return res
            .status(400)
            .send("There is already a customer with that email.");
        } else {
          console.log(newCustomerEmail);
          if (validatingEmail(newCustomerEmail)) {
            const query =
              "INSERT INTO customers (name, email, address, city, postcode, country) VALUES ($1, $2, $3, $4, $5, $6)";
            await pool
              .query(query, [
                newCustomerName,
                newCustomerEmail,
                newCustomerAddress,
                newCustomerCity,
                newCustomerPostcode,
                newCustomerCountry,
              ])
              .then((results) => res.send("New Customer added successfully."));
          } else {
            return res.status(400).send("The email must have a valid format.");
          }
        }
      });
  } catch (err) {
    console.error(err.message);
  }
});

app.patch("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const newEmail = req.body.email;
    const newAddress = req.body.address;
    const newCity = req.body.city;
    const newPostcode = req.body.postcode;
    const newCountry = req.body.country;

    await pool
      .query("SELECT * FROM customers WHERE id=$1;", [customerId])
      .then(async (result) => {
        const customer = result.rows[0];

        if (validatingEmail(req.body.email)) {
          customer.email = newEmail;
        } else {
          return res.status(400).send("The email must have a valid format.");
        }
        if (req.body.address !== "" && req.body.address !== undefined) {
          customer.address = newAddress;
        }
        if (req.body.city !== "" && req.body.city !== undefined) {
          customer.city = newCity;
        }
        if (req.body.postcode !== "" && req.body.postcode !== undefined) {
          customer.postcode = newPostcode;
        }
        if (req.body.country !== "" && req.body.country !== undefined) {
          customer.country = newCountry;
        }

        await pool
          .query(
            "UPDATE customers SET email=$2, address=$3, city=$4, postcode=$5, country=$6 WHERE id=$1",
            [
              customer.id,
              customer.email,
              customer.address,
              customer.city,
              customer.postcode,
              customer.country,
            ]
          )
          .then(() => res.send(`Customer ${customerId} updated!`));
      });
  } catch (err) {
    console.error(err.message);
  }
});

app.delete("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;

    await pool
      .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
      .then(async () => {
        await pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send(`Customer ${customerId} deleted!`));
      });
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
