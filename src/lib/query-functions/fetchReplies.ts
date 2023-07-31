import { GetComment } from 'types';

export const fetchReplies = async ({ parentId }: { parentId: number }) => {
  const res = await fetch(`/api/comments/${parentId}/replies`);

  if (!res.ok) {
    throw new Error('Error getting replies.');
  }

  return (await res.json()) as GetComment[];
};