import React from "react";
import styled from "styled-components";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const TeamList = ({ team }) => {
    const teamItems = team.map(({ frontmatter, fields }) => {
        const { fullName, achievements, profile_image } = frontmatter;
        const { slug } = fields;

        return (
            <TeamListItem
                key={slug}
                fullName={fullName}
                slug={slug}
                achievements={achievements}
                image={getImage(profile_image)}
            />
        );
    });

    return <StyledTeamList>{teamItems}</StyledTeamList>;
};

export default TeamList;

const TeamListItem = ({ fullName, achievements, image }) => {
    return (
        <StyledTeamListItem>
            {image ? <ImageWrapper image={image} alt={fullName} /> : null}
            <TeamListTitle>{fullName}</TeamListTitle>
            <TeamListDescription>{achievements}</TeamListDescription>
        </StyledTeamListItem>
    );
};

const ImageWrapper = styled(GatsbyImage)`
    display: block;
    border-radius: 50%;
    height: 280px;
    width: 280px;
    object-fit: cover;
    margin: 0 auto;
`;

const StyledTeamList = styled.ul`
    padding: 0;
    list-style: none;
    display: grid;
    justify-items: center;
    grid-gap: var(--size-600);
    grid-template-columns: repeat(auto-fit, minmax(35ch, 1fr));

    @media screen and (max-width: 500px) {
        & {
            display: block;
        }
    }
`;

const StyledTeamListItem = styled.li`
    display: flex;
    padding: 1rem;
    position: relative;
    flex-direction: column;
    transition: all 0.3s ease-out;
    min-width: 300px;

    @media screen and (max-width: 500px) {
        & {
            margin-top: var(--size-600);
        }
    }
`;

const TeamListTitle = styled.h2`
    line-height: 1.2;
    margin-top: 1rem;
    margin-bottom: 1rem;
    text-transform: capitalize;
    font-size: var(--size-550);
    font-weight: 700;
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

const TeamListDescription = styled.p`
    font-size: var(--size-400);
    line-height: 1.5;
    margin: 0;
    margin-bottom: 1rem;
    text-align: justify;
    text-align: center;

    @media screen and (max-width: 500px) {
        & {
            display: block;
        }
    }
`;
