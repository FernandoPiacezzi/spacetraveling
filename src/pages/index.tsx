/* eslint-disable prettier/prettier */
import { useState } from 'react';
import { GetStaticProps } from 'next';

import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [hasMorePostsToLoad, setHasMorePostsToLoad] = useState(
    !!postsPagination.next_page
  );

  const handleShowMorePosts = async () => {
    const response = await fetch(nextPage);

    const { results, page, total_pages, next_page } = await response.json();

    const parseNewPosts = results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    const newPosts = [...posts, parseNewPosts].flat();

    setPosts(newPosts);
    setNextPage(next_page);

    if (page === total_pages) {
      return setHasMorePostsToLoad(false);
    }
  };

  return (
    <>
      <Head>
        <title>Spacetravelling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts &&
            posts.map(post => (
              <>
                <Link key={post.uid} href={`post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div>
                      <time>
                        <FiCalendar />
                        {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                          locale: ptBR,
                        })}
                      </time>
                      <span>
                        <FiUser />
                        {post.data.author}
                      </span>
                    </div>
                  </a>
                </Link>
              </>
            ))}

          {hasMorePostsToLoad && (
            <button type="button" onClick={handleShowMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
