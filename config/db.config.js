const mongoose = require('mongoose');

function initial() {
  // Your initialization code here
}

mongoose
  .connect("mongodb://127.0.0.1:27017/Mwencha", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial(); // Call your initialization function here
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit(1); // Exit the application on connection error
  });
