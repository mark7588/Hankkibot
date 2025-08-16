// Main application file for the server
const express = require('express');
const app = express();
const chatRoutes = require('./routes/chatRoutes');

app.use(express.json());
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
