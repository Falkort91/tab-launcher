import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const sizes = [16, 32, 48, 128]

await mkdir('public/icons', { recursive: true })

await Promise.all(
  sizes.map((size) =>
    sharp('assets/icon-source.png')
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toFile(`public/icons/icon-${size}.png`),
  ),
)

console.log('Icons generated in public/icons/')
