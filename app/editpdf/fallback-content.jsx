"use client"

export default function FallbackContent({ fileName = "Document" }) {
  const documentName = fileName?.replace(".pdf", "") || "Document"

  return (
    <div className="min-h-[700px] p-8">
      <h1 style={{ textAlign: "center" }}>{documentName}</h1>
      <p style={{ textAlign: "center" }}>
        <em>Converted from PDF</em>
      </p>
      <hr />
      <p>We couldn't extract the content from your PDF automatically. This could be due to:</p>
      <ul>
        <li>The PDF contains scanned images instead of text</li>
        <li>The PDF is password protected</li>
        <li>The PDF has a complex structure that's difficult to extract</li>
      </ul>
      <p>You can still create and edit content below:</p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
    </div>
  )
}
