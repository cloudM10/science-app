import React from "react";
import Layout from "../components/layout";
import { graphql } from "gatsby";
import styled from "styled-components";
import Intro from "../components/intro";
import PostList from "../components/post-list";

const ApplicantsPage = ({ data }) => {
    const { html } = data.markdownRemark;
    const applicants = data.allMarkdownRemark.nodes;

    return (
        <Layout>
            <ApplicantsWrapper>
                <Intro
                    position="left"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                <PostList posts={applicants} />
            </ApplicantsWrapper>
        </Layout>
    );
};

export default ApplicantsPage;

const ApplicantsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;

    @media screen and (max-width: 1000px) {
        & {
            flex-direction: column;
        }

        & > * {
            margin-top: 2rem;
            width: 100%;
            text-align: center;
        }
    }
`;

export const pageQuery = graphql`
    query ($slug: String!) {
        markdownRemark(fields: { slug: { eq: $slug } }) {
            html
        }
        allMarkdownRemark(
            filter: { fields: { contentType: { eq: "applicants" } } }
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
    }
`;
