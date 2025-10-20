import React from "react";
import styled from "styled-components";
import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const PostList = ({ posts }) => {
    const PostList = posts.map(
        ({ frontmatter, fields, excerpt, timeToRead }) => {
            const { title, date, description, social_image } = frontmatter;
            const { slug } = fields;

            return (
                <PostListItem
                    key={slug}
                    title={title}
                    date={date}
                    slug={slug}
                    timeToRead={timeToRead}
                    description={description}
                    excerpt={excerpt}
                    image={getImage(social_image)}
                />
            );
        }
    );

    return <StyledPostList>{PostList}</StyledPostList>;
};

export default PostList;

const PostListItem = ({
    title,
    date,
    timeToRead,
    excerpt,
    description,
    slug,
    image,
}) => {
    return (
        <StyledPostListItem>
            {image ? <ImageWrapper image={image} alt={title} /> : null}
            <PostListTitle>
                <Link to={slug}>{title}</Link>
            </PostListTitle>
            {description || excerpt ? (
                <PostListExcerpt
                    dangerouslySetInnerHTML={{
                        __html: description || excerpt,
                    }}
                />
            ) : null}
            <PostListMeta>
                <span>{date}</span>
                <span>{timeToRead} mins</span>
            </PostListMeta>
        </StyledPostListItem>
    );
};

const ImageWrapper = styled(GatsbyImage)`
    display: block;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    width: 100%;
    object-fit: cover;
    margin: 0 auto;
    max-height: 275px;
`;

const StyledPostList = styled.ul`
    padding: 0;
    list-style: none;
    display: grid;
    justify-items: center;
    grid-gap: var(--size-600);
    grid-template-columns: repeat(auto-fit, minmax(35ch, 1fr));

    @media screen and (max-width: 500px) {
        & {
            display: block;
        }
    }
`;

const StyledPostListItem = styled.li`
    display: flex;
    border-radius: 8px;
    position: relative;
    flex-direction: column;
    transition: all 0.3s ease-out;
    min-width: 300px;
    height: fit-content;

    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.3);

    &:hover {
        background-color: rgba(255, 255, 255, 0.5);
    }

    @media screen and (max-width: 500px) {
        & {
            margin-top: var(--size-600);
        }
    }
`;

const PostListTitle = styled.h2`
    line-height: 1.2;
    margin-top: 1rem;
    text-transform: capitalize;
    font-size: var(--size-450);
    font-weight: 700;
    padding: 1rem;
    text-align: middle;

    & a {
        text-decoration: none;
        color: inherit;
    }

    & a::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }
`;

const PostListExcerpt = styled.p`
    margin-top: auto;
    font-size: var(--size-400);
    padding: 1rem;
`;

const PostListMeta = styled.div`
    font-size: var(--size-300);
    display: flex;
    justify-content: space-between;
    padding: 1rem;
`;
