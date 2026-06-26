export type Post = { slug: string; constellation: string; title: string; image: string; date: string; publishedAt?: string; category: string; summary: string; readTime: string; content: string[] };
export type Event = { day: string; month: string; title: string; type: string; time: string; description: string; spots: string };
export type CommunityValue = { name: string; description: string };
export type Comment = { postSlug: string; name: string; date: string; message: string };
export type Constellation = { slug: string; title: string; subtitle: string; quote: string; description: string; image: string; relatedPosts: string[] };
export type Signal = { id: string; name: string; email: string; interest: string; message: string; createdAt: string; date: string };
