import { convert } from "pdf-img-convert"
import { writeFileSync, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const extractCoverImage = async (
  pdfFilePath: string,
  outputFolder: string,
): Promise<void> => {
  try {
    if (!existsSync(pdfFilePath)) {
      console.error("File does not exist:", pdfFilePath)
      return
    }

    const outputImages = await convert(pdfFilePath, { page_numbers: [1] })
    if (outputImages.length > 0) {
      const firstImage = outputImages[0]
      const outputFilePath = path.join(outputFolder, "cover3.png")
      writeFileSync(outputFilePath, firstImage)
      console.log("Cover image extracted and saved as:", outputFilePath)
    } else {
      console.log("No images were extracted from the PDF.")
    }
  } catch (error) {
    console.error("Error extracting cover image:", error)
  }
}

// Example usage
const pdfFilePath = path.join(__dirname, "public", "StartSmall.pdf")
const outputFolder = path.join(__dirname, "public")
extractCoverImage(pdfFilePath, outputFolder)
