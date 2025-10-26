import dotenv from 'dotenv-safe'
import nodemailer from 'nodemailer'

dotenv.config()

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
})

// Format date for email
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format time for email
const formatTime = (timeString) => {
  const time = new Date(timeString)
  return time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Send booking confirmation email
export const sendBookingConfirmationEmail = async ({
  to,
  spaceName,
  bookingId,
  eventDate,
  startTime,
  endTime,
  totalPrice,
}) => {
  const formattedDate = formatDate(eventDate)
  const formattedStartTime = formatTime(startTime)
  const formattedEndTime = formatTime(endTime)

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: `Booking Confirmation - ${spaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmation</h2>
        <p>Thank you for booking with us!</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${spaceName}</h3>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
          <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
        </div>
        
        <p>The space owner will review your booking request and confirm it shortly.</p>
        <p>If you have any questions, please contact us.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send email verification email
export const sendVerificationEmail = async ({ to, name, verificationToken }) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SpaceRental!</h2>
        <p>Hello ${name},</p>
        
        <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #238636; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #238636;">${verificationUrl}</p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send owner verification pending email
export const sendOwnerVerificationPendingEmail = async ({ to, name }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Account Pending Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SpaceRental!</h2>
        <p>Hello ${name},</p>
        
        <p>Thank you for signing up as a space owner!</p>
        
        <p>Your account is currently pending verification by our team. We'll review your information within <strong>2 business days</strong> and notify you via email once your account is approved.</p>
        
        <p>In the meantime, you can explore our platform and browse available spaces.</p>
        
        <p>If you have any questions, please contact us at support@spacerental.com</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send owner verification approved email
export const sendOwnerVerificationApprovedEmail = async ({ to, name }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Account Approved - Welcome to SpaceRental!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations, ${name}!</h2>
        
        <p>Your account has been verified and approved!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #238636; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>List your spaces</li>
          <li>Manage bookings</li>
          <li>View your earnings</li>
        </ul>
        
        <p>Welcome aboard!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send owner verification rejected email
export const sendOwnerVerificationRejectedEmail = async ({ to, name, reason }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Account Verification - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        
        <p>We've reviewed your account application, but unfortunately we couldn't approve it at this time.</p>
        
        ${
          reason
            ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Reason:</strong></p>
            <p>${reason}</p>
          </div>
        `
            : ''
        }
        
        <p>If you have questions or would like to provide additional information, please contact us at support@spacerental.com</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send upgrade request submitted email
export const sendUpgradeRequestSubmittedEmail = async ({ to, name }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Upgrade Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        
        <p>Your request to become a space owner has been submitted successfully!</p>
        
        <p>Our team will review your application within <strong>2 business days</strong> and notify you via email once a decision has been made.</p>
        
        <p>In the meantime, you can continue using the platform as a client to book spaces.</p>
        
        <p>If you have any questions, please contact us at support@spacerental.com</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send upgrade request approved email
export const sendUpgradeRequestApprovedEmail = async ({ to, name }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Upgrade Request Approved - You are now a Space Owner!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations, ${name}!</h2>
        
        <p>Your request to become a space owner has been approved!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #238636; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>List your spaces</li>
          <li>Switch between client and owner views</li>
          <li>Manage bookings for your spaces</li>
        </ul>
        
        <p>Welcome to the owner community!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send upgrade request rejected email
export const sendUpgradeRequestRejectedEmail = async ({ to, name, reason }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@spacerental.com',
    to,
    subject: 'Upgrade Request - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        
        <p>We've reviewed your upgrade request, but unfortunately we couldn't approve it at this time.</p>
        
        ${
          reason
            ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Reason:</strong></p>
            <p>${reason}</p>
          </div>
        `
            : ''
        }
        
        <p>If you have questions or would like to provide additional information, please contact us at support@spacerental.com</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
