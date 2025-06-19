const nodemailer = require("nodemailer");

async function sendFun(to, name, resetLink) {
    const transporter = nodemailer.createTransport({
        service: "Gmail", // Or use another email service like Outlook, Yahoo, etc.
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS  
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: "Reset Your ShowSphere Password",
        text: `Dear ${name},

We received a request to reset your ShowSphere account password. Click the link below to proceed:

🔗 ${resetLink}

If you did not request this, please ignore this email. Your account security is important to us.

Best regards,  
The ShowSphere Team 🎬`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = sendFun;
