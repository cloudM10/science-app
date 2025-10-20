import React from "react";
import styled from "styled-components";
import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const QuickAccessLinksList = ({ links }) => {
    const sortListToId = (a, b) => {
        return a.frontmatter.id - b.frontmatter.id;
    };

    links.sort(sortListToId);

    const LinksList = links.map(({ frontmatter, fields }) => {
        const { title, link_image, link } = frontmatter;
        const { slug } = fields;
        const linkImage = getImage(link_image);

        return (
            <LinksListItem
                key={slug}
                title={title}
                link={link}
                linkImage={linkImage}
            />
        );
    });

    return <StyledLinksList>{LinksList}</StyledLinksList>;
};

export default QuickAccessLinksList;

const LinksListItem = ({ title, link, linkImage }) => {
    return (
        <StyledLinksListItem>
            <LinkImageWrapper image={linkImage} alt={title} />
            <LinksListTitle>
                <Link to={link}>{title}</Link>
            </LinksListTitle>
        </StyledLinksListItem>
    );
};

const StyledLinksList = styled.ul`
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-800);

    & > li {
        flex: 1 1 25ch;
    }

    @media screen and (max-width: 500px) {
        & > li {
            flex: 1 1 100%;
        }
    }
`;

const StyledLinksListItem = styled.li`
    display: flex;
    padding: 1.5rem 1rem;
    border-radius: 8px;
    position: relative;
    flex-direction: column;
    transition: all 0.3s ease-out;

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

const LinksListTitle = styled.h4`
    line-height: 1.2;
    margin-top: 1rem;
    margin-bottom: 0;
    text-transform: capitalize;
    font-size: var(--size-450);
    font-weight: 500;
    text-align: center;

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

const LinkImageWrapper = styled(GatsbyImage)`
    display: block;
    border-radius: 50%;
    height: 120px;
    width: 120px;
    object-fit: cover;
    margin: 0 auto;
`;
