interface PixelArtProps {
  asciiArt?: string
}

export function PixelArt({ asciiArt }: PixelArtProps) {
  return (
    <div className="pixel-art-container">
      <pre className="ascii-display">
        {asciiArt}
      </pre>
    </div>
  )
}
