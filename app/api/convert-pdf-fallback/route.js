import { NextResponse } from "next/server"

// A simplified fallback API that doesn't rely on PDF.js
// This is useful when the main API fails due to PDF.js issues
export async function POST(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Create a simple response with placeholder content
    // This ensures the client always gets a valid response
    return NextResponse.json({
      success: true,
      numPages: 1,
      content: [
        {
          pageNumber: 1,
          paragraphs: [
            "Your PDF has been received.",
            "We couldn't extract the text content automatically.",
            "You can now edit this document in the editor below.",
          ],
        },
      ],
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
