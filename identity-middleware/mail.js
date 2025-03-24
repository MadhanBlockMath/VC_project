const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Configure Nodemailer with Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kdmadhan007.mk@gmail.com', // Consider using environment variables for sensitive information
    pass: 'ihhd tcop ebmm hqlt'
  }
});

// Another transporter configuration (if needed)
const transporte = nodemailer.createTransport({
  host: 'smtp.freesmtpservers.com',
  port: 25
});

// Function to send email with connection response JSON file
const sendConnectionEmail = async (email, filePath) => {
  const mailOptions = {
    from: "kdmadhan007.mk@gmail.com",
    to: email,
    subject: "GTIN Credential Verification",
    text: `Dear ${email},

Holder has approved your request, please find the proof data in the attached file.

Best regards,
The Team`,
    attachments: [
      {
        filename: path.basename(filePath),
        path: filePath,
        contentType: "application/json",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent to", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  } finally {
    // Clean up the temporary file after sending email
    fs.unlinkSync(filePath);
  }
};

module.exports = { sendConnectionEmail };
