const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const port = 3001 || process.env.PORT;

// pasar a env
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Configuración de CORS
app.use(cors());
app.use(express.json());

// Configura multer para manejar la subida de archivos
const upload = multer({ dest: "uploads/" });

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

app.get("/", (req, res) => {
  res.json("Welcome to DHNN's freelancer form API");
});

app.post("/proxy", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileMetadata = {
      name: req.file.originalname,
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath),
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const { webViewLink } = driveResponse.data;

    fs.unlinkSync(filePath);

    console.table(req.body);

    const newBody = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      len: req.body.len,
      region: req.body.region,
      portfolio: req.body.portfolio,
      rol: req.body.rol,
      ts: req.body.ts,
      as: req.body.as,
      interes: req.body.interes,
      hourRate: req.body.hourRate,
      resumeLink: webViewLink,
    };
    console.log(newBody);

    const sheetResponse = await axios.post(process.env.URL_POST_POST, newBody);

    res.json({
      message: "Data sent to Google Sheets and file uploaded to Drive.",
      sheetResponse: sheetResponse.data,
      driveLink: webViewLink,
    });
  } catch (error) {
    console.error("Error in proxy request:", error);
    res.status(500).send("Error in proxy request");
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
