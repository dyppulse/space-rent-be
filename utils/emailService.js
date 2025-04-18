import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "user@example.com",
    pass: process.env.EMAIL_PASSWORD || "password",
  },
})

// Format date for email
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format time for email
const formatTime = (timeString) => {
  const time = new Date(timeString)
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
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
    from: process.env.EMAIL_FROM || "noreply@spacerental.com",
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
