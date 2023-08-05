'use client';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { GetPost, PostIds, VisualMedia } from 'types';
import { useCallback, useEffect, useRef } from 'react';
import useOnScreen from '@/hooks/useOnScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { Post } from './Post';
import { useCreatePost } from '@/hooks/useCreatePost';
import { useDeletePostMutation } from '@/hooks/mutations/useDeletePostMutation';
import { AllCaughtUp } from './AllCaughtUp';
import { POSTS_PER_PAGE } from '@/constants';
import { chunk } from 'lodash';

export function Posts({
  type,
  userId,
}: {
  type: 'profile' | 'feed';
  userId: string;
}) {
  const qc = useQueryClient();
  const queryKey = ['users', userId, 'posts', { type }];
  const { deleteMutation } = useDeletePostMutation();
  const bottomElRef = useRef<HTMLDivElement>(null);
  const isBottomOnScreen = useOnScreen(bottomElRef);
  const { launchEditPost } = useCreatePost();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<PostIds[]>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = type === 'profile' ? 'posts' : 'feed';
      const params = new URLSearchParams();
      params.set('limit', POSTS_PER_PAGE.toString());
      params.set('cursor', pageParam.toString());

      const res = await fetch(
        `/api/users/${userId}/${endpoint}?${params.toString()}`,
      );

      if (!res.ok) {
        throw Error('Failed to load posts.');
      }

      const posts: GetPost[] = await res.json();
      return posts.map((post) => {
        qc.setQueryData(['posts', post.id], post);
        return {
          id: post.id,
          commentsShown: false,
        };
      });
    },
    getNextPageParam: (lastPage, pages) => {
      // If the `pages` `length` is 0, that means there is not a single post to load
      if (pages.length === 0) return undefined;

      // If the last page doesn't have posts, that means the end is reached
      if (lastPage.length === 0) return undefined;

      // Return the id of the last post, this will serve as the cursor
      // that will be passed to `queryFn` as `pageParam` property
      return lastPage.slice(-1)[0].id;
    },
    staleTime: 60000 * 10,
  });

  useEffect(() => {
    if (!isBottomOnScreen) return;
    if (!data) return;
    if (!hasNextPage) return;

    fetchNextPage();
  }, [isBottomOnScreen]);

  const deletePost = useCallback((postId: number) => {
    deleteMutation.mutate({ postId });
  }, []);

  const editPost = useCallback(
    ({
      postId,
      content,
      visualMedia,
    }: {
      postId: number;
      content: string;
      visualMedia?: VisualMedia[];
    }) => {
      launchEditPost({
        postId,
        initialContent: content,
        initialVisualMedia: visualMedia || [],
      });
    },
    [],
  );

  const toggleComments = useCallback(async (postId: number) => {
    qc.setQueryData<InfiniteData<{ id: number; commentsShown: boolean }[]>>(
      queryKey,
      (oldData) => {
        if (!oldData) return;

        // Flatten the old pages
        const newPosts = oldData?.pages.flat();

        // Find the index of the post
        const index = newPosts.findIndex((post) => post.id === postId);

        // Get the value of the old post
        const oldPost = newPosts[index];

        // Toggle the `commentsShown` boolean property of the target post
        newPosts[index] = {
          ...oldPost,
          commentsShown: !oldPost.commentsShown,
        };

        return {
          pages: chunk(newPosts, POSTS_PER_PAGE),
          pageParams: oldData.pageParams,
        };
      },
    );
  }, []);

  return (
    <>
      <div className="flex flex-col">
        {status === 'loading' ? (
          <p>Loading posts...</p>
        ) : status === 'error' ? (
          <p>Error loading posts.</p>
        ) : (
          <AnimatePresence>
            {data.pages.flat().map((post) => (
              <motion.div
                initial={false}
                animate={{
                  height: 'auto',
                  marginTop: '16px',
                  opacity: 1,
                  overflow: 'visible',
                }}
                exit={{
                  height: 0,
                  marginTop: '0px',
                  opacity: 0,
                  overflow: 'hidden',
                }}
                style={{ originY: 0 }}
                transition={{ duration: 0.5 }}
                key={post.id}
              >
                <Post
                  id={post.id}
                  commentsShown={post.commentsShown}
                  {...{
                    editPost,
                    deletePost,
                    toggleComments,
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <div
        className="h-6"
        ref={bottomElRef}
        /**
         * The first page will be initially loaded by React Query
         * so the bottom loader has to be hidden first
         */
        style={{ display: data ? 'block' : 'none' }}
      ></div>
      {!isFetching && !hasNextPage && <AllCaughtUp />}
    </>
  );
}
