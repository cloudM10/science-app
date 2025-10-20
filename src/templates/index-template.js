import React from "react";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import styled from "styled-components";
import QuickAccessLinksList from "../components/quick-access-links-list";

const HomePage = ({ data }) => {
    const links = data.allMarkdownRemark.nodes;
    const intro = data.markdownRemark.html;

    return (
        <Layout isHero>
            <Intro
                dangerouslySetInnerHTML={{
                    __html: intro,
                }}
            />

            <QuickAccessLinksList links={links} />
        </Layout>
    );
};

export default HomePage;

const Intro = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 60ch;
    align-items: center;
    margin-right: auto;
    margin-left: auto;
    margin-top: var(--size-800);
    margin-bottom: var(--size-900);
    text-align: center;

    & p {
        text-transform: capitalize;
        font-size: var(--size-500);
    }

    @media screen and (max-width: 700px) {
        & h2 {
            font-size: var(--size-600);
        }
    }
`;

export const pageQuery = graphql`
    query ($slug: String!) {
        site {
            siteMetadata {
                title
            }
        }
        allMarkdownRemark(
            filter: { fields: { contentType: { eq: "quick-access-links" } } }
            sort: { order: DESC, fields: frontmatter___date }
            limit: 9
        ) {
            nodes {
                fields {
                    slug
                }
                frontmatter {
                    title
                    link_image {
                        childImageSharp {
                            gatsbyImageData(
                                placeholder: BLURRED
                                formats: PNG
                                height: 400
                            )
                        }
                    }
                    link
                    id
                }
            }
        }
        markdownRemark(fields: { slug: { eq: $slug } }) {
            html
        }
    }
`;
