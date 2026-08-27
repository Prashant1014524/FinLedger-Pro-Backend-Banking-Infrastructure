require("dotenv").config();

const nodemailer = require("nodemailer");


// ==========================================
// Create SMTP Transporter
// ==========================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        type: "OAuth2",

        user: process.env.EMAIL_USER,

        clientId: process.env.CLIENT_ID,

        clientSecret: process.env.CLIENT_SECRET,

        refreshToken: process.env.REFRESH_TOKEN
    }
});


// ==========================================
// Verify Email Server Connection
// ==========================================

transporter.verify((error, success) => {

    if (error) {

        console.error(
            "Error connecting to email server:",
            error
        );

    } else {

        console.log(
            "Email server is ready to send messages"
        );

    }

});


// ==========================================
// Generic Send Email Function
// ==========================================

const sendEmail = async (
    to,
    subject,
    text,
    html
) => {

    try {

        const info = await transporter.sendMail({

            from: `"FinLedger" <${process.env.EMAIL_USER}>`,

            to: to,

            subject: subject,

            text: text,

            html: html

        });

        console.log(
            "Message sent:",
            info.messageId
        );

    } catch (error) {

        console.error(
            "Error sending email:",
            error
        );

        throw error;
    }
};


// ==========================================
// Registration Email
// ==========================================

async function sendRegistrationEmail(
    userEmail,
    name,
    otp
) {

    const subject = "Welcome to FinLedger!";


    // Plain text email

    const text = `Hello ${name},

Thank you for registering at FinLedger.

Your OTP for verification is: ${otp}

Please do not share this OTP with anyone.

Regards,
FinLedger Team
`;


    // HTML email

    const html = `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
        ">

            <h2>Welcome to FinLedger!</h2>

            <p>
                Hello <strong>${name}</strong>,
            </p>

            <p>
                Thank you for registering at FinLedger.
            </p>

            <p>
                Your OTP for verification is:
            </p>

            <h2>
                ${otp}
            </h2>

            <p>
                Please do not share this OTP with anyone.
            </p>

            <p>
                Regards,<br>
                <strong>FinLedger Team</strong>
            </p>

        </div>
    `;


    await sendEmail(
        userEmail,
        subject,
        text,
        html
    );
}


// ==========================================
// Transaction Success Email
// ==========================================

async function sendTransactionEmail(
    userEmail,
    name,
    amount,
    toAccount
) {

    const subject = "Transaction Successful!";


    // Plain text email

    const text = `Hello ${name},

Your transaction of ₹${amount} to account ${toAccount} was successful.

Transaction Details:

Amount: ₹${amount}
To Account: ${toAccount}
Status: Successful

Thank you for using FinLedger.

Regards,
FinLedger Team
`;


    // HTML email

    const html = `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
        ">

            <h2>
                Transaction Successful!
            </h2>

            <p>
                Hello <strong>${name}</strong>,
            </p>

            <p>
                Your transaction has been completed successfully.
            </p>

            <hr>

            <h3>
                Transaction Details
            </h3>

            <p>
                <strong>Amount:</strong>
                ₹${amount}
            </p>

            <p>
                <strong>To Account:</strong>
                ${toAccount}
            </p>

            <p>
                <strong>Status:</strong>
                <span style="color: green;">
                    Successful
                </span>
            </p>

            <hr>

            <p>
                Thank you for using FinLedger.
            </p>

            <p>
                Regards,<br>
                <strong>FinLedger Team</strong>
            </p>

        </div>
    `;


    await sendEmail(
        userEmail,
        subject,
        text,
        html
    );
}


// ==========================================
// Transaction Failure Email
// ==========================================

async function sendTransactionFailureEmail(
    userEmail,
    name,
    amount,
    toAccount
) {

    const subject = "Transaction Failed!";


    // Plain text email

    const text = `Hello ${name},

Your transaction of ₹${amount} to account ${toAccount} has failed.

Transaction Details:

Amount: ₹${amount}
To Account: ${toAccount}
Status: Failed

Please try again later.

Regards,
FinLedger Team
`;


    // HTML email

    const html = `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
        ">

            <h2>
                Transaction Failed!
            </h2>

            <p>
                Hello <strong>${name}</strong>,
            </p>

            <p>
                Your transaction could not be completed.
            </p>

            <hr>

            <h3>
                Transaction Details
            </h3>

            <p>
                <strong>Amount:</strong>
                ₹${amount}
            </p>

            <p>
                <strong>To Account:</strong>
                ${toAccount}
            </p>

            <p>
                <strong>Status:</strong>
                <span style="color: red;">
                    Failed
                </span>
            </p>

            <hr>

            <p>
                Please try again later.
            </p>

            <p>
                Regards,<br>
                <strong>FinLedger Team</strong>
            </p>

        </div>
    `;


    await sendEmail(
        userEmail,
        subject,
        text,
        html
    );
}


// ==========================================
// Export All Functions
// ==========================================

module.exports = {

    sendEmail,

    sendRegistrationEmail,

    sendTransactionEmail,

    sendTransactionFailureEmail

};