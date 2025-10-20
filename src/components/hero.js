import React from "react";
import styled from "styled-components";
import { Link } from "gatsby";

const Hero = () => {
    return (
        <HeroSection>
            <HeroTitle>Welcome to Site</HeroTitle>
            <HeroSubtitle>Insights and stories from my journey</HeroSubtitle>
            <HeroButton to="/news">Read News</HeroButton>
        </HeroSection>
    );
};

export default Hero;

const HeroSection = styled.div`
    text-align: center;
    padding: 0;
    margin: 0;
    height: calc(100vh - 60px);
    width: 100vw;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    border: 1px solid rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.3);

    background-image: url("/media/hero-background.jpg");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    body.light-mode & {
        backdrop-filter: blur(10px);
    }

    @media screen and (max-width: 700px) {
        & {
            height: auto;
            padding: var(--size-400) var(--size-200);
        }
    }
`;

const HeroTitle = styled.h2`
    font-size: var(--size-600);
    margin-bottom: var(--size-200);
`;

const HeroSubtitle = styled.p`
    font-size: var(--size-450);
    margin-bottom: var(--size-300);
    color: var(--color-text-secondary);
`;

const HeroButton = styled(Link)`
    display: inline-block;
    padding: var(--size-200) var(--size-400);
    background-color: var(--color-primary);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;

    &:hover {
        background-color: var(--color-primary-hover);
    }
`;
