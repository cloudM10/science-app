import React from "react";
import Layout from "../components/layout";
import { graphql } from "gatsby";
import styled from "styled-components";
import TeamList from "../components/team-list";
import Intro from "../components/intro";

const TeamPage = ({ data }) => {
    const { html } = data.markdownRemark;
    const team = data.allMarkdownRemark.nodes;

    return (
        <Layout>
            <AboutWrapper>
                <Intro dangerouslySetInnerHTML={{ __html: html }} />
                <TeamList team={team} />
            </AboutWrapper>
        </Layout>
    );
};

export default TeamPage;

const AboutWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 99%;

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
            filter: { fields: { contentType: { eq: "team" } } }
            sort: { order: DESC, fields: frontmatter___date }
            limit: 9
        ) {
            nodes {
                fields {
                    slug
                }
                frontmatter {
                    fullName
                    achievements
                    profile_image {
                        childImageSharp {
                            gatsbyImageData(
                                placeholder: BLURRED
                                formats: PNG
                                height: 400
                            )
                        }
                    }
                }
            }
        }
    }
`;
