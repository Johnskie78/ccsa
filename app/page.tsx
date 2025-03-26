import QRScanner from "@/components/qr-scanner"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute adminOnly={false}>
      <main className="min-h-screen flex flex-col">
        <Header />
        <Nav />

        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">QR Code Scanner</h2>
            <p className="text-gray-500 mb-6 text-center">Scan a student's QR code to check them in or out</p>
            <QRScanner />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

