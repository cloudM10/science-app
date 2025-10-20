import React from "react";
import Layout from "../components/layout";
import { graphql } from "gatsby";
import Intro from "../components/intro";

const PageTemplate = ({ data }) => {
    const intro = data.markdownRemark.html;

    return (
        <Layout>
            <Intro
                position="left"
                dangerouslySetInnerHTML={{
                    __html: intro,
                }}
            />
        </Layout>
    );
};

export default PageTemplate;

export const pageQuery = graphql`
    query ($slug: String!) {
        markdownRemark(fields: { slug: { eq: $slug } }) {
            html
        }
    }
`;
