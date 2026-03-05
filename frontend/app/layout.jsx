import './globals.css'

export const metadata = {
  title: 'Viatris Health — Care that Grows With You',
  description: 'Connect with doctors, book appointments, and get medical help instantly',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
