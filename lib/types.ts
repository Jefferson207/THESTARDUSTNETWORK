export type Post = { slug: string; title: string; image: string; date: string; category: string; summary: string; readTime: string; content: string[] };
export type Event = { day: string; month: string; title: string; type: string; time: string; description: string; spots: string };
export type CommunityValue = { name: string; description: string };
export type Comment = { postSlug: string; name: string; date: string; message: string };
