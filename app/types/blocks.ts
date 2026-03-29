// app/types/blocks.ts

export type BlockWidth = 'full' | 'half'

export type BlockType =
  | 'bio'
  | 'looking_for'
  | 'interests'
  | 'values'
  | 'pronouns'
  | 'location'
  | 'currently'
  | 'quote'
  | 'photo_single'
  | 'photo_carousel'
  | 'video'
  | 'website_preview'
  | 'social_links'
  | 'contact_button'

export const SINGLE_INSTANCE_BLOCKS: BlockType[] = [
  'bio',
  'looking_for',
  'interests',
  'values',
  'pronouns',
  'location',
  'currently',
  'quote',
  'video',
  'website_preview',
  'social_links',
  'contact_button',
]

export interface BioBlockData {
  content: string
}

export interface LookingForBlockData {
  text: string
}

export interface InterestsBlockData {
  tags: string[]
}

export interface ValuesBlockData {
  tags: string[]
}

export interface PronounsBlockData {
  value: string
}

export interface LocationBlockData {
  text: string
}

export interface CurrentlyBlockData {
  label: string
  value: string
}

export interface QuoteBlockData {
  text: string
  attribution: string
}

export interface PhotoSingleBlockData {
  photoId: string
  storageKey: string
  caption: string
}

export interface PhotoCarouselBlockData {
  photoIds: string[]
}

export interface VideoBlockData {
  url: string
  title: string
}

export interface WebsitePreviewBlockData {
  url: string
  title: string
  description: string
  imageUrl: string
}

export type SocialPlatform =
  | 'instagram'
  | 'spotify'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'website'
  | 'other'

export interface SocialLink {
  platform: SocialPlatform
  url: string
  label: string
}

export interface SocialLinksBlockData {
  links: SocialLink[]
}

export interface ContactButtonBlockData {
  label: string
}

export type BlockDataMap = {
  bio: BioBlockData
  looking_for: LookingForBlockData
  interests: InterestsBlockData
  values: ValuesBlockData
  pronouns: PronounsBlockData
  location: LocationBlockData
  currently: CurrentlyBlockData
  quote: QuoteBlockData
  photo_single: PhotoSingleBlockData
  photo_carousel: PhotoCarouselBlockData
  video: VideoBlockData
  website_preview: WebsitePreviewBlockData
  social_links: SocialLinksBlockData
  contact_button: ContactButtonBlockData
}

export interface Block<T extends BlockType = BlockType> {
  id: string
  type: T
  width: BlockWidth
  data: BlockDataMap[T]
}

export type AnyBlock = { [K in BlockType]: Block<K> }[BlockType]

export interface BlockMeta {
  type: BlockType
  label: string
  description: string
  icon: string
  defaultData: BlockDataMap[BlockType]
}

export const BLOCK_META: BlockMeta[] = [
  {
    type: 'bio',
    label: 'Bio',
    description: 'A rich text paragraph about you',
    icon: '✍️',
    defaultData: { content: '' } as BioBlockData,
  },
  {
    type: 'looking_for',
    label: 'Looking For',
    description: "What you're seeking — dating, friends, networking",
    icon: '🔍',
    defaultData: { text: '' } as LookingForBlockData,
  },
  {
    type: 'interests',
    label: 'Interests',
    description: "Things you're into, shown as chips",
    icon: '✨',
    defaultData: { tags: [] } as InterestsBlockData,
  },
  {
    type: 'values',
    label: 'Values',
    description: 'What matters to you',
    icon: '💛',
    defaultData: { tags: [] } as ValuesBlockData,
  },
  {
    type: 'pronouns',
    label: 'Pronouns',
    description: 'Your pronouns',
    icon: '🏷️',
    defaultData: { value: '' } as PronounsBlockData,
  },
  {
    type: 'location',
    label: 'Location',
    description: 'Your city or neighborhood',
    icon: '📍',
    defaultData: { text: '' } as LocationBlockData,
  },
  {
    type: 'currently',
    label: 'Currently',
    description: "What you're into right now",
    icon: '📖',
    defaultData: { label: 'Into', value: '' } as CurrentlyBlockData,
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'A quote that resonates with you',
    icon: '💬',
    defaultData: { text: '', attribution: '' } as QuoteBlockData,
  },
  {
    type: 'photo_single',
    label: 'Photo',
    description: 'A single photo with optional caption',
    icon: '🖼️',
    defaultData: { photoId: '', storageKey: '', caption: '' } as PhotoSingleBlockData,
  },
  {
    type: 'photo_carousel',
    label: 'Photo Carousel',
    description: 'Multiple photos in a swipeable carousel',
    icon: '🎠',
    defaultData: { photoIds: [] } as PhotoCarouselBlockData,
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A YouTube or Vimeo embed',
    icon: '▶️',
    defaultData: { url: '', title: '' } as VideoBlockData,
  },
  {
    type: 'website_preview',
    label: 'Website',
    description: 'A rich link preview card',
    icon: '🔗',
    defaultData: { url: '', title: '', description: '', imageUrl: '' } as WebsitePreviewBlockData,
  },
  {
    type: 'social_links',
    label: 'Social Links',
    description: 'Links to your social profiles',
    icon: '🌐',
    defaultData: { links: [] } as SocialLinksBlockData,
  },
  {
    type: 'contact_button',
    label: 'Contact Button',
    description: 'Let people reach out to you',
    icon: '📬',
    defaultData: { label: 'Get in touch' } as ContactButtonBlockData,
  },
]
