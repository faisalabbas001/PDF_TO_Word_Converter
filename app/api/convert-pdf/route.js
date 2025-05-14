import { NextResponse } from "next/server"

// A simplified API route that doesn't rely on PDF.js in the server environment
export async function POST(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Return a simple success response
    // The actual PDF processing will be done on the client side
    return NextResponse.json({
      success: true,
      message: "File received successfully",
      fileName: file.name,
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error processing PDF",
      },
      { status: 500 },
    )
  }
}
