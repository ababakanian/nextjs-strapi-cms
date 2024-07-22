// types/homepage.ts

// types/homepage.ts

// ... (previous types remain the same)

// New types for the Cover image
export type ImageFormat = {
  name: string
  hash: string
  ext: string
  mime: string
  path: string | null
  width: number
  height: number
  size: number
  sizeInBytes: number
  url: string
}

export type CoverImageAttributes = {
  name: string
  alternativeText: string | null
  caption: string | null
  width: number
  height: number
  formats: {
    thumbnail: ImageFormat
    small: ImageFormat
  }
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl: string | null
  provider: string
  provider_metadata: any | null
  createdAt: string
  updatedAt: string
}

export type CoverImage = {
  data: {
    id: number
    attributes: CoverImageAttributes
  }
}
// ... (HomepageData, HomepageResponse, and HomepageProps remain the same)

// Content structure types
export type TextNode = {
  type: "text"
  text: string
}

export type HeadingNode = {
  type: "heading"
  children: TextNode[]
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export type ParagraphNode = {
  type: "paragraph"
  children: TextNode[]
}

export type ContentNode = HeadingNode | ParagraphNode

// Data structure types
export type HomepageAttributes = {
  Hero: string
  Body: ContentNode[]
  Cover: CoverImage
  createdAt: string
  updatedAt: string
  publishedAt: string
}

export type HomepageData = {
  id: number
  attributes: HomepageAttributes
}

export type HomepageResponse = {
  data: HomepageData
  meta: Record<string, unknown>
}

// Component prop type
export type HomepageProps = {
  data: HomepageResponse
}
