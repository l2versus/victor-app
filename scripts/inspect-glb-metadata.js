const fs = require("fs")
const path = require("path")

// GLB format: 12-byte header + JSON chunk with scene metadata
// Header: magic(4) + version(4) + length(4)
// Chunk: length(4) + type(4) + data(length)
// JSON chunk type = 0x4E4F534A ("JSON")

const dir = path.join(__dirname, "glb-input")
const files = fs.readdirSync(dir).filter(f => f.endsWith(".glb"))

console.log(`\nInspecting ${files.length} .glb files...\n`)

for (const file of files) {
  const buf = fs.readFileSync(path.join(dir, file))
  const size = (buf.length / 1024 / 1024).toFixed(2)

  // Read header
  const magic = buf.toString("ascii", 0, 4) // "glTF"
  const version = buf.readUInt32LE(4)

  // Read first chunk (JSON)
  const chunkLength = buf.readUInt32LE(12)
  const chunkType = buf.readUInt32LE(16)

  let info = ""
  if (chunkType === 0x4E4F534A) { // JSON
    const json = buf.toString("utf8", 20, 20 + Math.min(chunkLength, 2000))
    try {
      const gltf = JSON.parse(buf.toString("utf8", 20, 20 + chunkLength))
      // Extract useful info
      const meshNames = (gltf.meshes || []).map(m => m.name).filter(Boolean)
      const nodeNames = (gltf.nodes || []).map(n => n.name).filter(Boolean)
      const matNames = (gltf.materials || []).map(m => m.name).filter(Boolean)
      const imageCount = (gltf.images || []).length
      const meshCount = (gltf.meshes || []).length

      info = `meshes=${meshCount} images=${imageCount}`
      if (meshNames.length > 0) info += ` meshNames=[${meshNames.slice(0,3).join(",")}]`
      if (nodeNames.length > 0) info += ` nodes=[${nodeNames.slice(0,3).join(",")}]`
      if (matNames.length > 0) info += ` mats=[${matNames.slice(0,3).join(",")}]`

      // Check for any identifying text in extras
      if (gltf.asset?.extras) info += ` extras=${JSON.stringify(gltf.asset.extras)}`
      if (gltf.asset?.generator) info += ` gen=${gltf.asset.generator}`
    } catch {
      info = "JSON parse failed"
    }
  }

  console.log(`${file} (${size}MB) | ${info}`)
}
