import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (user, verificationCode) => {
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'Gmail',  // You can use other services like Yahoo, Outlook, etc.
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS  // Your email password
            }
        });

        // Set up email data

        const mailOptions = {
            from: 'imina3951@gmail.com', // Sender address
            to: user.email,  // Recipient's email
            subject: 'Verify Your Email Address',  // Subject line
            html: `
                <h1>Verify Your Email Address</h1>
                <p>Hi ${user.firstName + ' ' + user.lastName},</p>
                
                <p>Thank you for signing up for GIVORA! Please verify your email address by clicking the link below:</p>
                <p>use the following code to verify your email address: <strong>${verificationCode}</strong></p>
                
                <p>If you did not sign up for this account, please ignore this email.</p>
                <p>Thank you,<br/>GIVORA Team</p>
                
            ` // HTML body content
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', user.email);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};



export const sendPasswordResetEmail = async (user, resetToken) => {
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'Gmail',  // You can use other services like Yahoo, Outlook, etc.
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS  // Your email password
            }
        });

        // Set up email data

        const mailOptions = {
            from: 'imina3951@gmail.com', // Sender address
            to: user.email,  // Recipient's email
            subject: 'Reset Your Password',  // Subject line
            html: `
                <h1>Reset Your Password</h1>
                <p>Hi ${user.firstName + ' ' + user.lastName},</p>
                
                <p>You have requested to reset your password. Please click the link below to reset your password:</p>
                <p>use the following token to reset your password: <strong>${resetToken}</strong></p>
                
                <p>If you did not request this, please ignore this email.</p>
                <p>Thank you,<br/>GIVORA Team</p>
                
            ` // HTML body content
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', user.email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};

export const sendWelcomeEmail = async (user) => {
    try {
        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'Gmail',  // You can use other services like Yahoo, Outlook, etc.
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS  // Your email password
            }
        });

        // Set up email data

        const mailOptions = {
            from: 'imina3951@gmail.com', // Sender address
            to: user.email,  // Recipient's email
            subject: 'Welcome to GIVORA',  // Subject line
            html: `
                <h1>Welcome to GIVORA</h1>
                <p>Hi ${user.firstName + ' ' + user.lastName},</p>
                
                <p>Thank you for signing up for GIVORA! We are excited to have you on board.</p>
                
                <p>Thank you,<br/>GIVORA Team</p>
                
            ` // HTML body content
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', user.email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};