
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, 'MMMM d, yyyy');
}

export function formatRelativeDate(date: Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export const BLOG_CATEGORIES = [
  "Technology",
  "AI",
  "Web Development",
  "Machine Learning",
  "Data Science",
  "UI/UX",
  "Books",
  "Movies",
  "Cooking",
  "Poems",
  "Travel",
  "Fashion",
  "Lifestyle",
  "Health",
  "Fitness",
  "Personal",
  "General"
];
