const express = require("express");
const http = require("http");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// Define the port on which the server will run
const port = process.env.PORT || 3000;

// Connect to the database
connectDB().catch((err) => {
  console.error("Database connection error:", err);
  process.exit(1); // Exit the process if the connection fails
});

// Create the Express application
const app = express();

// CORS configuration
let corsOptions = {
  origin: [], // Fill in allowed origins in production
  optionsSuccessStatus: 200,
};

if (process.env.NODE_ENV === "development") {
  // Allow all origins in development
  corsOptions = {
    origin: true, // Reflect request origin
    optionsSuccessStatus: 200,
  };
}

// Enable cross-origin resource sharing
app.use(cors(corsOptions));

// Parse incoming JSON data
// app.use(express.json());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "50mb",
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse incoming URL-encoded data
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const usersRoute = require('./routes/userRoutes');
const clientsRoute = require('./routes/clientRoutes');
const botsRoute = require('./routes/botRoutes');
const botInstancesRoute = require('./routes/botInstanceRoutes');
const docsRoute = require('./routes/docRoutes.js');
const settingsRoute = require('./routes/settingsRoutes.js');
const metricsRoute = require('./routes/metricsRoutes.js');
const recipientsRoute = require('./routes/recipientRoutes.js');
const leadsRoute = require('./routes/leadRoutes.js');

const { authenticate, authorize } = require("./middleware/auth.js");

app.use("/api/users", usersRoute);
app.use("/api/clients", clientsRoute);
app.use("/api/bots", botsRoute);
app.use("/api/bot_instances", botInstancesRoute);
app.use("/api/docs", docsRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/metrics", metricsRoute);
app.use("/api/recipients", recipientsRoute);
app.use("/api/leads", leadsRoute);

const telephonyRouter = require("./telephony/router");
app.use("/api/telephony", telephonyRouter);

const widgetRoute = require("./routes/widgetRoutes");
app.use("/", widgetRoute);

const emailWebhookRoute = require("./routes/emailWebhookRoutes");
app.use("/api/webhooks/email", emailWebhookRoute);

const smsWebhookRoute = require("./routes/smsWebhookRoutes");
app.use("/api/webhooks/sms", smsWebhookRoute);

const crmWebhookRoute = require("./routes/crmWebhookRoutes");
app.use("/api/webhooks/crm", crmWebhookRoute);

const server = http.createServer(app);

// Error handling for server startup
server.listen(port, (err) => {
  if (err) {
    console.error("Server startup error:", err);
    return;
  }
  console.log(`Server started on port ${port}`);
});
