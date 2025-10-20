import React, { Fragment } from "react";
import Header from "./header";
import GlobalStyle from "./global-styles";
import styled from "styled-components";
import Footer from "./footer";
import Hero from "./hero";
// import Seo from "./seo";
import StyledLink from "./styled-link";

const Layout = ({
    children,
    title,
    description,
    socialImage = "",
    isHero = false,
    onClick,
}) => {
    return (
        <Fragment>
            <GlobalStyle />
            {/* <Seo
                title={title}
                description={description}
                socialImage={socialImage}
            /> */}
            <LayoutWrapper>
                <Header />
                {isHero ? <Hero /> : null}
                <Main>
                    {onClick ? (
                        <StyledLink onClick={onClick}>Повернутися</StyledLink>
                    ) : null}
                    {title ? (
                        <Title>
                            <h1>{title}</h1>
                        </Title>
                    ) : null}
                    <Content contentPosition="center">{children}</Content>
                </Main>
                <Footer />
            </LayoutWrapper>
        </Fragment>
    );
};

export default Layout;

const Title = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: var(--size-800);
    text-align: center;

    & h1 {
        margin: 0;
        font-size: var(--size-500);
    }

    & p {
        font-size: var(--size-300);
        margin: 0;
    }

    @media screen and (max-width: 600px) {
        & h1 {
            font-size: var(--size-400);
        }
        & p {
            font-size: var(--size-200);
        }
    }
`;

const LayoutWrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
`;

const Main = styled.main`
    display: flex;
    flex: 1;
    max-width: 1300px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    flex-direction: column;
    padding: 0 var(--size-200);
`;

const Content = styled.div`
    flex: 1;
    overflow-y: auto;

    @media screen and (min-width: 769px) {
        margin-left: ${(props) => {
            if (props.contentPosition === "right") {
                return "250px";
            }
            if (props.contentPosition === "center") {
                return "0px";
            }
            return "250px"; // default
        }};
    }
`;
