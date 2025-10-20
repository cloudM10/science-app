import React from "react";
import styled from "styled-components";
import { Link } from "gatsby";
import Container from "./container";
import { useStaticQuery, graphql } from "gatsby";
import NavBar from "./navbar";

const Header = () => {
    const { site } = useStaticQuery(
        graphql`
            query {
                site {
                    siteMetadata {
                        title
                        subtitle
                    }
                }
            }
        `
    );

    return (
        <StyledHeader>
            <HeaderWrapper>
                <HeaderTitle>
                    <Link to="/">{site.siteMetadata.title}</Link>
                </HeaderTitle>
                <HeaderSubtitle>{site.siteMetadata.subtitle}</HeaderSubtitle>
                <NavBar />
            </HeaderWrapper>
        </StyledHeader>
    );
};

export default Header;

const StyledHeader = styled.header`
    padding-top: var(--size-300);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-background);
`;

const HeaderWrapper = styled(Container)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: var(--size-300);
    text-align: center;
`;

const HeaderTitle = styled.div`
    & a {
        text-transform: uppercase;
        text-decoration: none;
        font-size: var(--size-550);
        color: inherit;
    }
`;

const HeaderSubtitle = styled.div`
    font-size: var(--size-400);
    color: var(--color-text-secondary);
`;
