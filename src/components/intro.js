import React from "react";
import styled from "styled-components";

const Intro = ({ position = "center", ...props }) => {
    return <StyledIntro position={position} {...props} />;
};

const StyledIntro = styled.div`
    display: flex;
    flex-direction: column;
    align-items: ${({ position }) =>
        position === "left" ? "flex-start" : "center"};
    margin-right: auto;
    margin-left: auto;
    margin-top: var(--size-800);
    margin-bottom: var(--size-600);
    text-align: justify;

    a > img {
        width: 80px;
    }

    & h2,
    h3,
    h4 {
        font-size: var(--size-600);
        margin-bottom: 1em;
        text-align: center;
        width: 100%;
    }

    & p {
        text-transform: capitalize;
        font-size: var(--size-450);
        margin-bottom: 1em;
    }

    @media screen and (max-width: 700px) {
        & h2 {
            font-size: var(--size-500);
        }
    }
`;

export default Intro;
