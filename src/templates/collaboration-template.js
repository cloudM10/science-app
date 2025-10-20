import React from "react";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import PostList from "../components/post-list";
import Intro from "../components/intro";

const CollaborationPage = ({ data }) => {
    const collaboration = data.allMarkdownRemark.nodes;
    const intro = data.markdownRemark.html;

    return (
        <Layout>
            <Intro
                dangerouslySetInnerHTML={{
                    __html: intro,
                }}
            />

            <PostList posts={collaboration} />
        </Layout>
    );
};

export default CollaborationPage;

export const pageQuery = graphql`
    query ($slug: String!) {
        site {
            siteMetadata {
                title
            }
        }
        allMarkdownRemark(
            filter: { fields: { contentType: { eq: "collaboration" } } }
            sort: { order: DESC, fields: frontmatter___date }
            limit: 9
        ) {
            nodes {
                fields {
                    slug
                }
                frontmatter {
                    title
                    date(formatString: "MMMM DD, YYYY", locale: "uk")
                    social_image {
                        childImageSharp {
                            gatsbyImageData(
                                placeholder: BLURRED
                                formats: PNG
                                height: 400
                            )
                        }
                    }
                    description
                }
                timeToRead
            }
        }
        markdownRemark(fields: { slug: { eq: $slug } }) {
            html
        }
    }
`;
